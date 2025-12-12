import { Client, WebhookEvent, TextMessage, MessageEvent } from '@line/bot-sdk'
import { supabaseAdmin } from '@/lib/supabase-server'

// Cache for LINE client
let cachedClient: Client | null = null
let cachedConfig: { accessToken: string; channelSecret: string } | null = null

// Get LINE config from database
export async function getLineConfig(businessId?: string) {
  try {
    let query = supabaseAdmin
      .from('channels')
      .select('config, business_id')
      .eq('type', 'line')
      .eq('status', 'connected')

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data: channel, error } = await query.single<{
      config: any
      business_id: string
    }>()

    if (error || !channel) {
      console.error('Failed to get LINE config from database:', error)
      // Fallback to environment variables
      return {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
        channelSecret: process.env.LINE_CHANNEL_SECRET || '',
        businessId: null,
      }
    }

    return {
      channelAccessToken: channel.config?.access_token || process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      channelSecret: channel.config?.channel_secret || process.env.LINE_CHANNEL_SECRET || '',
      businessId: channel.business_id,
    }
  } catch (error) {
    console.error('Error getting LINE config:', error)
    return {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
      businessId: null,
    }
  }
}

// Create LINE client with config from database
export async function getLineClient() {
  const config = await getLineConfig()
  
  if (!config.channelAccessToken) {
    throw new Error('LINE access token not configured')
  }

  return new Client({
    channelAccessToken: config.channelAccessToken,
    channelSecret: config.channelSecret,
  })
}

// Helper: Send text message
export async function sendLineMessage(replyToken: string, text: string) {
  const client = await getLineClient()
  const message: TextMessage = {
    type: 'text',
    text,
  }
  
  return await client.replyMessage(replyToken, message)
}

// Helper: Send multiple messages
export async function sendLineMessages(replyToken: string, messages: TextMessage[]) {
  const client = await getLineClient()
  return await client.replyMessage(replyToken, messages)
}

// Helper: Push message (not reply)
export async function pushLineMessage(userId: string, text: string) {
  const client = await getLineClient()
  const message: TextMessage = {
    type: 'text',
    text,
  }
  
  return await client.pushMessage(userId, message)
}

// Helper: Get LINE profile
export async function getLineProfile(userId: string) {
  try {
    const client = await getLineClient()
    return await client.getProfile(userId)
  } catch (error) {
    console.error('Error getting LINE profile:', error)
    return null
  }
}

// Validate LINE signature
export async function validateLineSignature(body: string, signature: string): Promise<boolean> {
  const crypto = require('crypto')
  const config = await getLineConfig()
  
  if (!config.channelSecret) {
    console.error('LINE channel secret not configured')
    return false
  }
  
  const hash = crypto
    .createHmac('SHA256', config.channelSecret)
    .update(body)
    .digest('base64')
  
  return hash === signature
}
