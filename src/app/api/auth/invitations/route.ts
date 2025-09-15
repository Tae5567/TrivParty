import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get game invitations for this user
    const { data: invitations, error } = await supabase
      .from('game_invitations')
      .select(`
        id,
        status,
        message,
        created_at,
        expires_at,
        inviter:inviter_id(id, username, display_name, avatar_url),
        session:session_id(
          id,
          join_code,
          quiz:quiz_id(title)
        )
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ invitations: invitations || [] })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { sessionId, inviteeId, message } = await request.json()

    if (!sessionId || !inviteeId) {
      return NextResponse.json({ error: 'Session ID and invitee ID are required' }, { status: 400 })
    }

    // Verify the session exists and user is the host
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can send invitations' }, { status: 403 })
    }

    if (session.status !== 'waiting') {
      return NextResponse.json({ error: 'Cannot invite to a game that has already started' }, { status: 400 })
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('game_invitations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('invitee_id', inviteeId)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 })
    }

    // Create invitation
    const { data, error } = await supabase
      .from('game_invitations')
      .insert({
        session_id: sessionId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        message,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ invitation: data })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { invitationId, action } = await request.json()

    if (!invitationId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify the invitation exists and is for this user
    const { data: invitation, error: fetchError } = await supabase
      .from('game_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('game_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId)
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Update invitation status
    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { data, error } = await supabase
      .from('game_invitations')
      .update({ status: newStatus })
      .eq('id', invitationId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // If accepted, return session join code
    if (action === 'accept') {
      const { data: session } = await supabase
        .from('sessions')
        .select('join_code')
        .eq('id', invitation.session_id)
        .single()

      return NextResponse.json({ 
        invitation: data,
        joinCode: session?.join_code 
      })
    }

    return NextResponse.json({ invitation: data })
  } catch (error) {
    console.error('Error responding to invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}