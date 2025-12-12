import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'

export async function POST(req: NextRequest) {
  try {
    const { channelId, channelSecret, accessToken } = await req.json()

    if (!channelId || !channelSecret || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create LINE client with provided credentials
    const client = new Client({
      channelAccessToken: accessToken,
      channelSecret: channelSecret,
    })

    try {
      // Test the connection by getting bot info
      const botInfo = await client.getBotInfo()
      
      return NextResponse.json({
        success: true,
        botName: botInfo.displayName,
        botId: botInfo.userId,
        message: 'Connection successful',
      })
    } catch (lineError: any) {
      console.error('LINE API Error:', lineError)
      
      let errorMessage = 'Unable to connect to LINE'
      
      if (lineError.statusCode === 401) {
        errorMessage = 'Invalid Channel Access Token'
      } else if (lineError.statusCode === 403) {
        errorMessage = 'Invalid Channel Secret or Access Token'
      } else if (lineError.message) {
        errorMessage = lineError.message
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

