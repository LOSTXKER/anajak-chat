import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    // Get user from cookie/header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // For now, just get all channels (we'll filter by business later)
    // TODO: Add proper user authentication and business filtering
    
    const { data: channels, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Remove duplicates - keep only latest for each type
    const uniqueChannels = (channels || []).reduce((acc: any[], channel: any) => {
      const exists = acc.find((c: any) => c.type === channel.type)
      if (!exists) {
        acc.push(channel)
      }
      return acc
    }, [])

    return NextResponse.json({ 
      success: true,
      channels: uniqueChannels 
    })
  } catch (error) {
    console.error('Error loading channels:', error)
    return NextResponse.json({ 
      success: false,
      error: (error as Error).message 
    }, { status: 500 })
  }
}

// Also support POST with userId in body for better auth
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user's business
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .single<{ business_id: string }>()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    // Get channels for this business
    const { data: channels, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .eq('business_id', membership.business_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Remove duplicates
    const uniqueChannels = (channels || []).reduce((acc: any[], channel: any) => {
      const exists = acc.find((c: any) => c.type === channel.type)
      if (!exists) {
        acc.push(channel)
      }
      return acc
    }, [])

    return NextResponse.json({ 
      success: true,
      channels: uniqueChannels 
    })
  } catch (error) {
    console.error('Error loading channels:', error)
    return NextResponse.json({ 
      success: false,
      error: (error as Error).message 
    }, { status: 500 })
  }
}

