import { NextRequest, NextResponse } from 'next/server'
import { WebhookEvent, MessageEvent, TextEventMessage } from '@line/bot-sdk'
import { validateLineSignature, sendLineMessage, getLineProfile, getLineConfig } from '@/lib/line-client'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  console.log('📨 LINE Webhook received!')
  
  try {
    // Get signature from headers
    const signature = req.headers.get('x-line-signature')
    if (!signature) {
      console.log('❌ No signature in request')
      return NextResponse.json({ error: 'No signature' }, { status: 401 })
    }

    // Get raw body
    const body = await req.text()
    console.log('📝 Received body:', body.substring(0, 200) + '...')
    
    // Validate signature
    const isValid = await validateLineSignature(body, signature)
    if (!isValid) {
      console.log('❌ Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    console.log('✅ Signature validated')

    // Parse webhook events
    const data = JSON.parse(body)
    const events: WebhookEvent[] = data.events || []
    
    console.log(`📬 Processing ${events.length} events`)

    // Process each event
    for (const event of events) {
      await handleLineEvent(event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ LINE webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle GET for webhook verification
export async function GET(req: NextRequest) {
  console.log('🔍 LINE Webhook verification request')
  return NextResponse.json({ status: 'ok', message: 'LINE webhook is active' })
}

async function handleLineEvent(event: WebhookEvent) {
  console.log('📩 LINE Event:', event.type)

  // Handle message events
  if (event.type === 'message' && event.message.type === 'text') {
    await handleTextMessage(event as MessageEvent)
  }
  
  // Handle follow event (user adds bot)
  else if (event.type === 'follow') {
    console.log('👤 New follower!')
    await handleFollow(event)
  }
  
  // Handle unfollow event (user blocks/removes bot)
  else if (event.type === 'unfollow') {
    console.log('👋 User unfollowed')
  }
}

async function handleTextMessage(event: MessageEvent) {
  const message = event.message as TextEventMessage
  const userId = event.source.userId
  const replyToken = event.replyToken

  if (!userId) {
    console.error('No user ID in event')
    return
  }

  console.log(`💬 Message from ${userId}: "${message.text}"`)

  try {
    // Get LINE config to get business_id
    const lineConfig = await getLineConfig()
    const businessId = lineConfig.businessId

    if (!businessId) {
      console.error('❌ No business ID found for LINE channel')
      return
    }

    console.log(`🏢 Business ID: ${businessId}`)

    // Get or create contact
    const contact = await getOrCreateContact(userId, businessId)
    if (!contact) {
      console.error('❌ Failed to get/create contact')
      return
    }
    console.log(`👤 Contact: ${contact.name} (${contact.id})`)

    // Get or create conversation
    const conversation = await getOrCreateConversation(contact.id, businessId)
    if (!conversation) {
      console.error('❌ Failed to get/create conversation')
      return
    }
    console.log(`💬 Conversation: ${conversation.id}`)

    // Save incoming message
    const { error: msgError } = await (supabaseAdmin.from('messages') as any).insert({
      conversation_id: conversation.id,
      business_id: businessId,
      sender_type: 'contact',
      sender_id: null,
      content: message.text,
      content_type: 'text',
      metadata: {
        line_user_id: userId,
        line_message_id: message.id,
      },
    })

    if (msgError) {
      console.error('❌ Error saving message:', msgError)
    } else {
      console.log('✅ Message saved!')
    }

    // Update conversation timestamp
    await (supabaseAdmin
      .from('conversations') as any)
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'open' // Reopen if was closed
      })
      .eq('id', conversation.id)

    // Check if auto-reply is enabled
    const { data: channel } = await (supabaseAdmin
      .from('channels') as any)
      .select('config')
      .eq('business_id', businessId)
      .eq('type', 'line')
      .single()

    // Send auto-reply if enabled
    if (channel?.config?.auto_reply_enabled) {
      const autoReplyMessage = channel.config.auto_reply_message || 
        'สวัสดีครับ ขอบคุณที่ติดต่อเรา เราจะรีบตอบกลับโดยเร็วที่สุดครับ'
      
      console.log('🤖 Sending auto-reply...')
      await sendLineMessage(replyToken, autoReplyMessage)
      
      // Save auto-reply message
      await (supabaseAdmin.from('messages') as any).insert({
        conversation_id: conversation.id,
        business_id: businessId,
        sender_type: 'bot',
        sender_id: null,
        content: autoReplyMessage,
        content_type: 'text',
        metadata: {
          auto_reply: true,
        },
      })
      console.log('✅ Auto-reply sent!')
    }

    console.log('🎉 Message processed successfully!')
  } catch (error) {
    console.error('❌ Error handling text message:', error)
  }
}

async function handleFollow(event: WebhookEvent) {
  const userId = event.source.userId
  if (!userId) return

  console.log('👤 New follower:', userId)
  
  // Get LINE config
  const lineConfig = await getLineConfig()
  if (!lineConfig.businessId) {
    console.error('No business ID found')
    return
  }

  // Get profile and create contact
  await getOrCreateContact(userId, lineConfig.businessId)
}

async function getOrCreateContact(lineUserId: string, businessId: string) {
  try {
    // Get LINE profile
    const profile = await getLineProfile(lineUserId)
    
    // Find existing contact by LINE user ID
    const { data: existing } = await (supabaseAdmin
      .from('contacts') as any)
      .select('*')
      .eq('business_id', businessId)
      .eq('metadata->>line_user_id', lineUserId)
      .single()

    if (existing) {
      console.log('Found existing contact:', existing.name)
      return existing
    }

    // Create new contact
    const { data: newContact, error } = await (supabaseAdmin
      .from('contacts') as any)
      .insert({
        business_id: businessId,
        name: profile?.displayName || 'LINE User',
        avatar: profile?.pictureUrl || null,
        metadata: {
          line_user_id: lineUserId,
          line_status_message: profile?.statusMessage,
        },
        tags: ['line'],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return null
    }

    console.log('Created new contact:', newContact.name)
    return newContact
  } catch (error) {
    console.error('Error in getOrCreateContact:', error)
    return null
  }
}

async function getOrCreateConversation(contactId: string, businessId: string) {
  try {
    // Find existing open conversation
    const { data: existing } = await (supabaseAdmin
      .from('conversations') as any)
      .select('*')
      .eq('contact_id', contactId)
      .eq('business_id', businessId)
      .in('status', ['open', 'claimed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      console.log('Found existing conversation')
      return existing
    }

    // Get LINE channel
    const { data: channel } = await (supabaseAdmin
      .from('channels') as any)
      .select('id')
      .eq('business_id', businessId)
      .eq('type', 'line')
      .single()

    if (!channel) {
      console.error('No LINE channel found')
      return null
    }

    // Create new conversation
    const { data: newConversation, error } = await (supabaseAdmin
      .from('conversations') as any)
      .insert({
        business_id: businessId,
        contact_id: contactId,
        channel_id: channel.id,
        status: 'open',
        priority: 'medium',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    console.log('Created new conversation')
    return newConversation
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error)
    return null
  }
}
