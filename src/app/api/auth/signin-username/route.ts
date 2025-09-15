import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Find the user profile by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Get the user's email from auth.users using the service role
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Create a regular Supabase client to sign in with email/password
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    return NextResponse.json({ session: data.session })
  } catch (error) {
    console.error('Username sign-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}