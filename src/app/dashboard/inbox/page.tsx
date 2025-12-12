'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

interface Contact {
  id: string
  name: string
  avatar?: string
}

interface Channel {
  id: string
  type: string
  name: string
}

interface Conversation {
  id: string
  status: string
  business_id: string
  last_message_at: string | null
  created_at: string
  contact: Contact
  channel: Channel
}

interface Message {
  id: string
  content: string
  sender_type: string
  created_at: string
  is_internal?: boolean
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadConversations()

    // Real-time subscription
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadConversations()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
          setMessages(prev => [...prev, payload.new as Message])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation])

  const loadConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/user/business', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (!response.ok) return

      const { business_id } = await response.json()

      const { data, error } = await supabase
        .from('conversations')
        .select(`*, contact:contacts(*), channel:channels(*)`)
        .eq('business_id', business_id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (!error && data) {
        setConversations(data as Conversation[])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = useCallback(async () => {
    if (!selectedConversation) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedConversation.id)
      .order('created_at', { ascending: true })

    if (data) setMessages(data as Message[])
  }, [selectedConversation, supabase])

  useEffect(() => {
    if (selectedConversation) loadMessages()
  }, [selectedConversation, loadMessages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Check if LINE channel
      const isLine = selectedConversation.channel?.type === 'line'

      if (isLine) {
        const response = await fetch('/api/line/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            message: newMessage,
            userId: session.user.id
          })
        })

        if (!response.ok) throw new Error('ส่งข้อความไม่สำเร็จ')
      } else {
        await (supabase.from('messages') as any).insert({
          conversation_id: selectedConversation.id,
          business_id: selectedConversation.business_id,
          sender_type: 'agent',
          sender_id: session.user.id,
          content: newMessage,
          content_type: 'text',
          is_internal: false
        })

        await (supabase.from('conversations') as any)
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', selectedConversation.id)
      }

      setNewMessage('')
      loadMessages()
    } catch (error) {
      console.error('Error sending:', error)
      alert('ส่งข้อความไม่สำเร็จ')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'เมื่อวาน'
    } else if (diffDays < 7) {
      return d.toLocaleDateString('th-TH', { weekday: 'short' })
    }
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      claimed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      resolved: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    }
    const labels: Record<string, string> = {
      open: 'เปิด',
      claimed: 'รับแล้ว',
      resolved: 'เสร็จสิ้น',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.open}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getChannelIcon = (type: string) => {
    if (type === 'line') return '💬'
    if (type === 'facebook') return '📘'
    return '💌'
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex pt-14 lg:pt-0">
      {/* Conversation List */}
      <div className={`
        w-full lg:w-80 border-r border-default bg-[var(--bg-primary)]
        ${selectedConversation ? 'hidden lg:block' : 'block'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-default">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            กล่องข้อความ
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {conversations.length} การสนทนา
          </p>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100vh-88px)] lg:h-[calc(100vh-88px)]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-[var(--text-secondary)]">ยังไม่มีการสนทนา</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`
                  w-full p-4 text-left border-b border-default transition-colors
                  ${selectedConversation?.id === conv.id 
                    ? 'bg-[var(--bg-active)]' 
                    : 'hover:bg-[var(--bg-hover)]'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 text-lg">
                    {conv.contact?.avatar ? (
                      <img 
                        src={conv.contact.avatar} 
                        alt="" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getChannelIcon(conv.channel?.type)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {conv.contact?.name || 'ไม่ระบุชื่อ'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                        {formatTime(conv.last_message_at || conv.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(conv.status)}
                      <span className="text-xs text-[var(--text-muted)]">
                        {conv.channel?.type === 'line' ? 'LINE' : conv.channel?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`
        flex-1 flex flex-col bg-[var(--bg-secondary)]
        ${selectedConversation ? 'block' : 'hidden lg:flex'}
      `}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-[var(--bg-primary)] border-b border-default flex items-center gap-3">
              {/* Back Button (Mobile) */}
              <button
                onClick={() => setSelectedConversation(null)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-lg">
                {selectedConversation.contact?.avatar ? (
                  <img 
                    src={selectedConversation.contact.avatar} 
                    alt="" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getChannelIcon(selectedConversation.channel?.type)
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="font-medium text-[var(--text-primary)]">
                  {selectedConversation.contact?.name || 'ไม่ระบุชื่อ'}
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  {getStatusBadge(selectedConversation.status)}
                  <span className="text-[var(--text-muted)]">
                    {selectedConversation.channel?.type === 'line' ? 'LINE' : selectedConversation.channel?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'contact' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`
                    max-w-[80%] lg:max-w-[60%] px-4 py-2.5 rounded-2xl
                    ${msg.sender_type === 'contact'
                      ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-bl-md'
                      : msg.sender_type === 'bot'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-br-md'
                        : 'bg-[var(--accent-primary)] text-white rounded-br-md'
                    }
                  `}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender_type === 'agent' ? 'text-white/70' : 'text-[var(--text-muted)]'
                    }`}>
                      {formatTime(msg.created_at)}
                      {msg.sender_type === 'bot' && ' • บอท'}
                      {msg.sender_type === 'agent' && ' • คุณ'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-[var(--bg-primary)] border-t border-default">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-5 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl
                    font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-[var(--accent-hover)] transition-colors"
                >
                  {sending ? '...' : 'ส่ง'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-[var(--text-secondary)]">เลือกการสนทนาเพื่อเริ่มแชท</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
