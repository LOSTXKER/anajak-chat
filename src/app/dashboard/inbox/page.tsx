'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ConversationList from '@/components/inbox/ConversationList'
import ChatThread from '@/components/inbox/ChatThread'
import ContextPanel from '@/components/inbox/ContextPanel'
import { Database } from '@/types/database.types'

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  contact: Database['public']['Tables']['contacts']['Row']
  channel: Database['public']['Tables']['channels']['Row']
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Conversation change:', payload)
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(*),
          channel:channels(*)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setConversations(data as Conversation[])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleClaimConversation = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'claimed',
          assigned_to: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', conversationId)

      if (error) throw error

      loadConversations()
    } catch (error) {
      console.error('Error claiming conversation:', error)
    }
  }

  const handleReleaseConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'open',
          assigned_to: null,
          claimed_at: null,
        })
        .eq('id', conversationId)

      if (error) throw error

      loadConversations()
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
      }
    } catch (error) {
      console.error('Error releasing conversation:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อความ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Left: Conversation List */}
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
      />

      {/* Middle: Chat Thread */}
      <ChatThread
        conversation={selectedConversation}
        onClaim={handleClaimConversation}
        onRelease={handleReleaseConversation}
      />

      {/* Right: Context Panel */}
      {selectedConversation && (
        <ContextPanel conversation={selectedConversation} />
      )}
    </div>
  )
}

