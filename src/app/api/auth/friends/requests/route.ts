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

    // Get pending friend requests sent to this user
    const { data: requests, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        requester:requester_id(id, username, display_name, avatar_url)
      `)
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const friendRequests = requests?.map(request => ({
      id: request.id,
      requester: request.requester,
      status: request.status,
      createdAt: request.created_at,
    })) || []

    return NextResponse.json({ requests: friendRequests })
  } catch (error) {
    console.error('Error fetching friend requests:', error)
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

    const { friendshipId, action } = await request.json()

    if (!friendshipId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify the friendship request exists and is for this user
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    // Update friendship status
    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { data, error } = await supabase
      .from('friendships')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ friendship: data })
  } catch (error) {
    console.error('Error responding to friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}