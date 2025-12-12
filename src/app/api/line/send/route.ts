import { NextRequest, NextResponse } from 'next/server'
import { pushLineMessage } from '@/lib/line-client'
import { supabaseAdmin } from '@/lib/supabase-server'

// API to send message from dashboard to LINE
export async function POST(req: NextRequest) {
  try {
    const { conversationId, message, userId } = await req.json()

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get conversation with contact info
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        business_id,
        contact:contacts(
          id,
          metadata
        )
      `)
      .eq('id', conversationId)
      .single<{
        id: string
        business_id: string
        contact: { id: string; metadata: any } | null
      }>()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get LINE user ID from contact metadata
    const lineUserId = conversation.contact?.metadata?.line_user_id
    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE user ID not found in contact' },
        { status: 400 }
      )
    }

    // Send message via LINE
    await pushLineMessage(lineUserId, message)

    // Save message to database
    const { error: msgError } = await (supabaseAdmin
      .from('messages') as any)
      .insert({
        conversation_id: conversationId,
        business_id: conversation.business_id,
        sender_type: 'agent',
        sender_id: userId || null,
        content: message,
        content_type: 'text',
        metadata: {
          line_user_id: lineUserId,
        },
      })

    if (msgError) {
      console.error('Error saving message:', msgError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Update conversation timestamp
    await (supabaseAdmin
      .from('conversations') as any)
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending LINE message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

