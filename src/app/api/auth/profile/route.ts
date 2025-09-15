import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { UserProfileUpdate } from '@/types/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Extract user ID from auth header or session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch user profile with statistics
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user accuracy
    const { data: accuracy } = await supabase.rpc('get_user_accuracy', {
      user_uuid: user.id
    })

    // Get leaderboard rank
    const { data: rank } = await supabase.rpc('get_user_leaderboard_rank', {
      user_uuid: user.id
    })

    // Get recent games
    const { data: recentGames } = await supabase
      .from('user_game_history')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(10)

    // Get achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    return NextResponse.json({
      profile: {
        ...profile,
        accuracy: accuracy || 0,
        leaderboardRank: rank,
        recentGames: recentGames || [],
        achievements: achievements || [],
      }
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
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

    const updates: UserProfileUpdate = await request.json()

    // Validate username uniqueness if updating username
    if (updates.username) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', user.id)
        .single()

      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}