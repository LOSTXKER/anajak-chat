'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Conversation {
  id: string
  status: string
  channel_id: string
  created_at: string
  last_message_at: string
  assigned_to?: string
  contact?: {
    id: string
    name: string
    email?: string
    phone?: string
    metadata?: {
      line_user_id?: string
      profile_picture?: string
    }
  }
}

interface Message {
  id: string
  content: string
  sender_type: string
  created_at: string
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
  const [showPanel, setShowPanel] = useState(true)

  const loadConversations = useCallback(async (bizId: string) => {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          id, status, channel_id, created_at, last_message_at, assigned_to,
          contact:contacts(id, name, email, phone, metadata)
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

  const updateConversationStatus = async (status: string) => {
    if (!selectedConv) return
    
    await supabase
      .from('conversations')
      .update({ status } as never)
      .eq('id', selectedConv.id)
    
    setSelectedConv({ ...selectedConv, status })
    if (businessId) loadConversations(businessId)
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
      {/* Column 1: Conversation List */}
      <div className={`w-full md:w-80 flex-shrink-0 bg-[var(--bg-primary)] border-r border-[var(--border-color)] flex flex-col
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
                      <span className="text-sm text-[var(--text-secondary)] truncate flex-1">LINE</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conv.status === 'open' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Chat Thread */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="h-14 px-4 flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
              <button 
                onClick={() => setSelectedConv(null)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium text-sm">
                {selectedConv.contact?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-[var(--text-primary)] truncate text-sm">
                  {selectedConv.contact?.name || 'ไม่ทราบชื่อ'}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">LINE</p>
              </div>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-secondary)]">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">ยังไม่มีข้อความ</div>
              ) : (
                messages.map((msg) => {
                  const isOutgoing = msg.sender_type === 'agent' || msg.sender_type === 'bot'
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isOutgoing
                          ? 'bg-[var(--accent-primary)] text-white rounded-br-md'
                          : 'bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[11px] mt-1 ${isOutgoing ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="พิมพ์ข้อความ..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="btn btn-primary px-4"
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
              <p className="text-sm text-[var(--text-muted)]">เลือกแชทจากรายการด้านซ้าย</p>
            </div>
          </div>
        )}
      </div>

      {/* Column 3: Context Panel (Right Sidebar) */}
      {selectedConv && showPanel && (
        <div className="hidden lg:flex w-80 flex-shrink-0 bg-[var(--bg-primary)] border-l border-[var(--border-color)] flex-col overflow-y-auto">
          {/* Contact Header */}
          <div className="p-5 border-b border-[var(--border-color)] text-center">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-medium">
              {selectedConv.contact?.name?.charAt(0) || '?'}
            </div>
            <h3 className="font-semibold text-lg text-[var(--text-primary)]">
              {selectedConv.contact?.name || 'ไม่ทราบชื่อ'}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">LINE Contact</p>
          </div>

          {/* Status Actions */}
          <div className="p-4 border-b border-[var(--border-color)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">สถานะ</p>
            <div className="flex gap-2">
              <button
                onClick={() => updateConversationStatus('open')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedConv.status === 'open' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
              >
                เปิด
              </button>
              <button
                onClick={() => updateConversationStatus('resolved')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedConv.status === 'resolved' 
                    ? 'bg-gray-500 text-white' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
              >
                ปิดแชท
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 border-b border-[var(--border-color)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">ข้อมูลติดต่อ</p>
            <div className="space-y-3">
              {selectedConv.contact?.email && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-sm text-[var(--text-primary)]">{selectedConv.contact.email}</span>
                </div>
              )}
              {selectedConv.contact?.phone && (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="text-sm text-[var(--text-primary)]">{selectedConv.contact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="text-sm text-[var(--text-secondary)]">
                  เริ่มแชท: {new Date(selectedConv.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>
            </div>
          </div>

          {/* AI Assist - Coming Soon */}
          <div className="p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">AI Assist</p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                เร็วๆ นี้
              </span>
            </div>
            <div className="space-y-2 opacity-50">
              <button disabled className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] text-left">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span className="text-sm font-medium text-[var(--text-primary)]">ร่างคำตอบ</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">AI จะช่วยร่างข้อความตอบกลับ</p>
              </button>
              <button disabled className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] text-left">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                  </svg>
                  <span className="text-sm font-medium text-[var(--text-primary)]">สรุปแชท</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">สรุปประเด็นสำคัญจากบทสนทนา</p>
              </button>
            </div>
          </div>

          {/* Quick Actions - Coming Soon */}
          <div className="p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Quick Actions</p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                เร็วๆ นี้
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 opacity-50">
              <button disabled className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-center">
                <svg className="w-5 h-5 mx-auto mb-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-xs text-[var(--text-secondary)]">สร้างดีล</span>
              </button>
              <button disabled className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-center">
                <svg className="w-5 h-5 mx-auto mb-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                <span className="text-xs text-[var(--text-secondary)]">สร้างงาน</span>
              </button>
              <button disabled className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-center">
                <svg className="w-5 h-5 mx-auto mb-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
                </svg>
                <span className="text-xs text-[var(--text-secondary)]">มอบหมาย</span>
              </button>
              <button disabled className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-center">
                <svg className="w-5 h-5 mx-auto mb-1 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                <span className="text-xs text-[var(--text-secondary)]">ติด Tags</span>
              </button>
            </div>
          </div>

          {/* Notes - Coming Soon */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">โน้ตภายใน</p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                เร็วๆ นี้
              </span>
            </div>
            <textarea
              disabled
              placeholder="เพิ่มโน้ตภายใน (ลูกค้าไม่เห็น)..."
              className="w-full h-24 p-3 rounded-xl bg-[var(--bg-tertiary)] text-sm resize-none opacity-50"
            />
          </div>
        </div>
      )}
    </div>
  )
}
