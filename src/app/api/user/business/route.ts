import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-server'

// Force dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '')
    
    // Create client with user's token to verify
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Use admin client to bypass RLS
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('business_members')
      .select('business_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle<{ business_id: string; role: string; status: string }>()

    if (membershipError) {
      console.error('Error fetching membership:', membershipError)
      return NextResponse.json({ 
        error: 'Failed to fetch business membership',
        details: membershipError 
      }, { status: 500 })
    }

    if (!membership) {
      return NextResponse.json({ 
        error: 'No business membership found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      business_id: membership.business_id,
      role: membership.role
    })
  } catch (error) {
    console.error('Error in /api/user/business:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 })
  }
}

