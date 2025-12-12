'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, Lock, Unlock, MoreVertical, Sparkles, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Database } from '@/types/database.types'

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  contact: Database['public']['Tables']['contacts']['Row']
  channel: Database['public']['Tables']['channels']['Row']
}

type Message = Database['public']['Tables']['messages']['Row']

interface ChatThreadProps {
  conversation: Conversation | null
  onClaim: (conversationId: string) => void
  onRelease: (conversationId: string) => void
}

export default function ChatThread({ conversation, onClaim, onRelease }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (!conversation) {
      setMessages([])
      return
    }

    loadMessages()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id])

  const loadMessages = async () => {
    if (!conversation) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation || loading) return

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Check if this is a LINE conversation
      const isLineChannel = conversation.channel.type === 'line'

      if (isLineChannel && !isInternal) {
        // Send via LINE API
        const response = await fetch('/api/line/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            message: newMessage,
            userId: user.id,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send LINE message')
        }
      } else {
        // Save as internal note or for non-LINE channels
        const { error } = await supabase.from('messages').insert({
          conversation_id: conversation.id,
          business_id: conversation.business_id,
          sender_type: 'agent',
          sender_id: user.id,
          content: newMessage,
          content_type: 'text',
          is_internal: isInternal,
        })

        if (error) throw error

        // Update conversation last_message_at
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversation.id)
      }

      setNewMessage('')
      setIsInternal(false)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('เกิดข้อผิดพลาดในการส่งข้อความ')
    } finally {
      setLoading(false)
    }
  }

  const canModifyConversation = conversation?.assigned_to === currentUserId || conversation?.status === 'open'

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <FileText size={64} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">เลือกข้อความเพื่อเริ่มการสนทนา</p>
        </div>
      </div>
    )
  }

  const isClaimed = conversation.status === 'claimed'
  const isOwnedByCurrentUser = conversation.assigned_to === currentUserId

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {conversation.contact.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {conversation.contact.name || 'Unknown Contact'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation.channel.name} • {conversation.contact.email || conversation.contact.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isClaimed && isOwnedByCurrentUser ? (
            <button
              onClick={() => onRelease(conversation.id)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Unlock size={18} />
              ปล่อย
            </button>
          ) : conversation.status === 'open' ? (
            <button
              onClick={() => onClaim(conversation.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Lock size={18} />
              รับเคส
            </button>
          ) : (
            <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg flex items-center gap-2">
              <Lock size={18} />
              ถูกรับไปแล้ว
            </span>
          )}

          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const isAgent = message.sender_type === 'agent'
          const isSystem = message.sender_type === 'system'
          const time = format(new Date(message.created_at), 'HH:mm', { locale: th })

          if (isSystem) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
                  {message.content}
                </div>
              </div>
            )
          }

          return (
            <div
              key={message.id}
              className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
                {message.is_internal && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 mb-1 flex items-center gap-1">
                    <Lock size={12} />
                    Internal Note
                  </span>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.is_internal
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : isAgent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{time}</span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {!canModifyConversation && conversation.status !== 'open' && (
          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-400">
            การสนทนานี้ถูกจัดการโดยผู้ใช้อื่น คุณไม่สามารถส่งข้อความได้
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                disabled={!canModifyConversation}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Internal Note
            </label>
            <button
              type="button"
              className="ml-auto px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              disabled={!canModifyConversation}
            >
              <Sparkles size={16} />
              AI Assist
            </button>
          </div>

          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
              placeholder={canModifyConversation ? "พิมพ์ข้อความ..." : "คุณไม่สามารถส่งข้อความได้"}
              disabled={!canModifyConversation || loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
              rows={3}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !canModifyConversation || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

