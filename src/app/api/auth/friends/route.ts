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

    // Get friends (accepted friendships)
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        requester:requester_id(id, username, display_name, avatar_url),
        addressee:addressee_id(id, username, display_name, avatar_url)
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Format friends list
    const friends = friendships?.map(friendship => {
      const isRequester = friendship.requester.id === user.id
      const friend = isRequester ? friendship.addressee : friendship.requester
      
      return {
        id: friend.id,
        profile: friend,
        friendshipId: friendship.id,
        friendsSince: friendship.created_at,
      }
    }) || []

    return NextResponse.json({ friends })
  } catch (error) {
    console.error('Error fetching friends:', error)
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

    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Find user by username
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, username')
      .eq('username', username)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 })
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},addressee_id.eq.${user.id})`)
      .single()

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 })
      } else if (existingFriendship.status === 'pending') {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 })
      }
    }

    // Create friend request
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: targetUser.id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ friendship: data })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}