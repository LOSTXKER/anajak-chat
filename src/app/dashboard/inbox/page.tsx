'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: string
  status: string
  channel: string
  created_at: string
  last_message_at: string
  contact?: {
    id: string
    name: string
    metadata?: {
      line_user_id?: string
      profile_picture?: string
    }
  }
  messages?: Array<{
    id: string
    content: string
    direction: string
    created_at: string
  }>
}

interface Message {
  id: string
  content: string
  direction: string
  created_at: string
  sender_type: string
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')

  const loadConversations = useCallback(async (bizId: string) => {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          id, status, channel, created_at, last_message_at,
          contact:contacts(id, name, metadata)
        `)
        .eq('business_id', bizId)
        .order('last_message_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setConversations((data as Conversation[]) || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [filter])

  useEffect(() => {
    const init = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token
        if (!token) {
          window.location.href = '/login'
          return
        }

        const res = await fetch('/api/user/business', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()

        if (data.businessId) {
          setBusinessId(data.businessId)
          await loadConversations(data.businessId)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadConversations])

  useEffect(() => {
    if (businessId) {
      loadConversations(businessId)
    }
  }, [filter, businessId, loadConversations])

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    setMessages((data as Message[]) || [])
  }

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv)
    await loadMessages(conv.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return

    setSending(true)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      
      const res = await fetch('/api/line/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: newMessage
        })
      })

      if (res.ok) {
        setNewMessage('')
        await loadMessages(selectedConv.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)

    if (mins < 1) return 'เมื่อกี้'
    if (mins < 60) return `${mins} นาที`
    if (hours < 24) return `${hours} ชม.`
    return `${days} วัน`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--bg-secondary)]">
      {/* Sidebar - Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-[var(--bg-primary)] border-r border-[var(--border-color)] flex flex-col
        ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-3">กล่องข้อความ</h1>
          <div className="flex gap-2">
            {(['all', 'open', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all-200
                  ${filter === f 
                    ? 'bg-[var(--accent-primary)] text-white' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
              >
                {f === 'all' ? 'ทั้งหมด' : f === 'open' ? 'เปิด' : 'ปิด'}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                </svg>
              </div>
              <p className="text-[var(--text-muted)]">ยังไม่มีข้อความ</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-light)]">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 text-left transition-all-200 flex items-center gap-3
                    ${selectedConv?.id === conv.id 
                      ? 'bg-[var(--bg-active)]' 
                      : 'hover:bg-[var(--bg-hover)]'
                    }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                      {conv.contact?.name?.charAt(0) || '?'}
                    </div>
                    {conv.status === 'open' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--bg-primary)]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {conv.contact?.name || 'ไม่ทราบชื่อ'}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-[var(--text-secondary)] truncate flex-1">
                        {conv.channel === 'line' ? 'LINE' : conv.channel}
                      </span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conv.status === 'open' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
              <button 
                onClick={() => setSelectedConv(null)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                {selectedConv.contact?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-[var(--text-primary)]">
                  {selectedConv.contact?.name || 'ไม่ทราบชื่อ'}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedConv.channel === 'line' ? 'LINE' : selectedConv.channel}
                </p>
              </div>
              <span className={`badge ${selectedConv.status === 'open' ? 'badge-green' : 'badge-gray'}`}>
                {selectedConv.status === 'open' ? 'เปิด' : 'ปิด'}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-secondary)]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.direction === 'outgoing'
                      ? 'bg-[var(--accent-primary)] text-white rounded-br-md'
                      : 'bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-bl-md shadow-sm'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[11px] mt-1 ${
                      msg.direction === 'outgoing' ? 'text-white/70' : 'text-[var(--text-muted)]'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 px-4 py-3 rounded-xl"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="btn btn-primary px-5"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[var(--bg-secondary)]">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">เลือกการสนทนา</h3>
              <p className="text-sm text-[var(--text-muted)]">เลือกแชทจากรายการด้านซ้ายเพื่อเริ่มต้น</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
