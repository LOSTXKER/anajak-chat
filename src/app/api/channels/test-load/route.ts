import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { data: channels, error } = await supabaseAdmin
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      count: channels?.length || 0,
      channels 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: (error as Error).message 
    })
  }
}

