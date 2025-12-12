import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { 
      userId,
      channelId, 
      channelSecret, 
      accessToken,
      autoReplyEnabled,
      autoReplyMessage,
      existingChannelId 
    } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get business_id - trying multiple methods
    let businessId: string | null = null

    // Method 1: From business_members
    const { data: membership } = await supabaseAdmin
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membership) {
      businessId = membership.business_id
    }

    // Method 2: From businesses (where user is owner)
    if (!businessId) {
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (business) {
        businessId = business.id

        // Create business_member if missing
        await supabaseAdmin
          .from('business_members')
          .insert({
            business_id: business.id,
            user_id: userId,
            role: 'owner',
            status: 'active',
          })
          .onConflict('business_id,user_id')
      }
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'No business found for this user' },
        { status: 404 }
      )
    }

    const config = {
      channel_id: channelId,
      channel_secret: channelSecret,
      access_token: accessToken,
      auto_reply_enabled: autoReplyEnabled,
      auto_reply_message: autoReplyMessage,
    }

    // Check if LINE channel already exists for this business
    const { data: existingLineChannel } = await supabaseAdmin
      .from('channels')
      .select('id')
      .eq('business_id', businessId)
      .eq('type', 'line')
      .single()

    if (existingChannelId || existingLineChannel) {
      // Update existing channel
      const channelIdToUpdate = existingChannelId || existingLineChannel?.id

      const { error } = await supabaseAdmin
        .from('channels')
        .update({
          status: 'connected',
          config,
          name: 'LINE Official Account',
        })
        .eq('id', channelIdToUpdate)

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
    } else {
      // Create new channel only if none exists
      const { error } = await supabaseAdmin
        .from('channels')
        .insert({
          business_id: businessId,
          type: 'line',
          name: 'LINE Official Account',
          status: 'connected',
          config,
        })

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      businessId 
    })
  } catch (error) {
    console.error('Save channel error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

