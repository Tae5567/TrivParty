import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Enhanced realtime configuration for game sessions
const realtimeConfig = {
  realtime: {
    params: {
      eventsPerSecond: 20, // Increased for real-time gaming
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, realtimeConfig)

// Client-side Supabase client for browser usage
export const createClientComponentClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, realtimeConfig)
}

// Connection management utilities
export class RealtimeConnectionManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private client = createClientComponentClient()

  // Subscribe to a channel with automatic cleanup
  subscribeToChannel(channelName: string, config?: any): RealtimeChannel {
    // Remove existing channel if it exists
    this.unsubscribeFromChannel(channelName)

    const channel = this.client.channel(channelName, config)
    this.channels.set(channelName, channel)
    
    return channel
  }

  // Unsubscribe from a specific channel
  unsubscribeFromChannel(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.client.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Clean up all channels
  cleanup(): void {
    this.channels.forEach((channel, channelName) => {
      this.client.removeChannel(channel)
    })
    this.channels.clear()
  }

  // Get connection status
  getConnectionStatus(): string {
    return this.client.realtime.connection?.readyState?.toString() || 'unknown'
  }

  // Get active channels
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}