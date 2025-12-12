'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

interface Conversation {
  id: string
  status: string
  channel_id: string
  created_at: string
  last_message_at: string
  assigned_to?: string
  claimed_at?: string
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

// Quick Replies
const quickReplies = [
  { id: '1', title: 'ทักทาย', content: 'สวัสดีครับ/ค่ะ ยินดีให้บริการครับ มีอะไรให้ช่วยเหลือไหมครับ?' },
  { id: '2', title: 'ขอบคุณ', content: 'ขอบคุณที่ติดต่อมาครับ/ค่ะ หากมีข้อสงสัยเพิ่มเติม สามารถสอบถามได้ตลอดเลยนะครับ' },
  { id: '3', title: 'รอสักครู่', content: 'รบกวนรอสักครู่นะครับ กำลังตรวจสอบข้อมูลให้ครับ' },
  { id: '4', title: 'ราคา', content: 'สำหรับราคาสินค้า รบกวนแจ้งรุ่นหรือรายละเอียดที่สนใจเพิ่มเติมได้ไหมครับ?' },
  { id: '5', title: 'จัดส่ง', content: 'สินค้าจัดส่งภายใน 1-3 วันทำการ หลังชำระเงินครับ' },
  { id: '6', title: 'ปิดการขาย', content: 'ขอบคุณที่ใช้บริการครับ/ค่ะ หวังว่าจะได้รับใช้อีกนะครับ 🙏' },
]

// Common Emojis
const commonEmojis = ['😊', '👍', '❤️', '🙏', '✅', '📦', '💯', '🎉', '😍', '🤝', '💬', '📞', '📍', '⏰', '💰', '🔥']

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
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversations = useCallback(async (bizId: string) => {
    try {
      let query = supabase
        .from('conversations')
        .select(`
          id, status, channel_id, created_at, last_message_at, assigned_to, claimed_at,
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
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUserId(user.id)

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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const claimConversation = async () => {
    if (!selectedConv || !currentUserId) return
    
    await supabase
      .from('conversations')
      .update({ 
        assigned_to: currentUserId, 
        claimed_at: new Date().toISOString() 
      } as never)
      .eq('id', selectedConv.id)
    
    setSelectedConv({ ...selectedConv, assigned_to: currentUserId, claimed_at: new Date().toISOString() })
    if (businessId) loadConversations(businessId)
  }

  const releaseConversation = async () => {
    if (!selectedConv) return
    
    await supabase
      .from('conversations')
      .update({ 
        assigned_to: null, 
        claimed_at: null 
      } as never)
      .eq('id', selectedConv.id)
    
    setSelectedConv({ ...selectedConv, assigned_to: undefined, claimed_at: undefined })
    if (businessId) loadConversations(businessId)
  }

  const insertQuickReply = (content: string) => {
    setNewMessage(content)
    setShowQuickReplies(false)
  }

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
  }

  const getSLATime = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000)
    
    if (diffMins < 5) return { text: `${diffMins}น.`, color: 'text-green-500 bg-green-100 dark:bg-green-900/30' }
    if (diffMins < 15) return { text: `${diffMins}น.`, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' }
    if (diffMins < 60) return { text: `${diffMins}น.`, color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' }
    const hours = Math.floor(diffMins / 60)
    return { text: `${hours}ชม.`, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' }
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
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-secondary)]">
      {/* Navbar */}
      <Navbar title="กล่องข้อความ" />

      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Conversation List */}
        <div className={`w-full md:w-80 flex-shrink-0 bg-[var(--bg-primary)] border-r border-[var(--border-color)] flex flex-col
          ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
          {/* Filter */}
          <div className="p-3 border-b border-[var(--border-color)]">
            <div className="flex gap-2">
              {(['all', 'open', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all-200
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
                {conversations.map((conv) => {
                  const sla = conv.status === 'open' ? getSLATime(conv.last_message_at) : null
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-3 text-left transition-all-200 flex items-center gap-3
                        ${selectedConv?.id === conv.id 
                          ? 'bg-[var(--bg-active)]' 
                          : 'hover:bg-[var(--bg-hover)]'
                        }`}
                    >
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                          {conv.contact?.name?.charAt(0) || '?'}
                        </div>
                        {conv.status === 'open' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--bg-primary)]"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-[var(--text-primary)] truncate text-sm">
                            {conv.contact?.name || 'ไม่ทราบชื่อ'}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[var(--text-secondary)] truncate flex-1">LINE</span>
                          {sla && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sla.color}`}>
                              {sla.text}
                            </span>
                          )}
                          {conv.assigned_to && (
                            <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">LINE</span>
                    {selectedConv.assigned_to === currentUserId && (
                      <span className="text-[10px] text-blue-500">• กำลังดูแล</span>
                    )}
                  </div>
                </div>

                {/* Claim/Release Buttons */}
                {selectedConv.status === 'open' && (
                  <>
                    {selectedConv.assigned_to ? (
                      selectedConv.assigned_to === currentUserId && (
                        <button
                          onClick={releaseConversation}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          คืนเรื่อง
                        </button>
                      )
                    ) : (
                      <button
                        onClick={claimConversation}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600"
                      >
                        รับเรื่อง
                      </button>
                    )}
                  </>
                )}

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
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
                {/* Quick Replies */}
                {showQuickReplies && (
                  <div className="mb-3 p-2 bg-[var(--bg-tertiary)] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">ข้อความสำเร็จรูป</span>
                      <button onClick={() => setShowQuickReplies(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {quickReplies.map((qr) => (
                        <button
                          key={qr.id}
                          onClick={() => insertQuickReply(qr.content)}
                          className="text-left p-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <p className="text-sm font-medium text-[var(--text-primary)]">{qr.title}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{qr.content}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojis && (
                  <div className="mb-3 p-2 bg-[var(--bg-tertiary)] rounded-xl">
                    <div className="flex flex-wrap gap-1">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 rounded hover:bg-[var(--bg-hover)] text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Row */}
                <div className="flex items-center gap-2">
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setShowQuickReplies(!showQuickReplies); setShowEmojis(false); }}
                      className={`p-2 rounded-lg transition-colors ${showQuickReplies ? 'bg-[var(--accent-primary)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
                      title="ข้อความสำเร็จรูป"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setShowEmojis(!showEmojis); setShowQuickReplies(false); }}
                      className={`p-2 rounded-lg transition-colors ${showEmojis ? 'bg-[var(--accent-primary)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
                      title="Emoji"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                      </svg>
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed"
                      title="แนบไฟล์ (เร็วๆ นี้)"
                      disabled
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                      </svg>
                    </button>
                  </div>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="พิมพ์ข้อความ..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                    disabled={sending}
                  />

                  {/* Send Button */}
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

        {/* Column 3: Context Panel */}
        {selectedConv && showPanel && (
          <div className="hidden lg:flex w-72 flex-shrink-0 bg-[var(--bg-primary)] border-l border-[var(--border-color)] flex-col overflow-y-auto">
            {/* Contact Header */}
            <div className="p-4 border-b border-[var(--border-color)] text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-medium">
                {selectedConv.contact?.name?.charAt(0) || '?'}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">
                {selectedConv.contact?.name || 'ไม่ทราบชื่อ'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">LINE</p>
            </div>

            {/* SLA Info */}
            {selectedConv.status === 'open' && (
              <div className="p-4 border-b border-[var(--border-color)]">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">SLA</p>
                <div className={`p-3 rounded-lg ${getSLATime(selectedConv.last_message_at).color}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">เวลารอ</span>
                    <span className="text-lg font-bold">{getSLATime(selectedConv.last_message_at).text}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div className="p-4 border-b border-[var(--border-color)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">สถานะ</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateConversationStatus('open')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                    ${selectedConv.status === 'open' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                >
                  เปิด
                </button>
                <button
                  onClick={() => updateConversationStatus('resolved')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                    ${selectedConv.status === 'resolved' 
                      ? 'bg-gray-500 text-white' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 border-b border-[var(--border-color)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">ข้อมูลติดต่อ</p>
              <div className="space-y-2 text-sm">
                {selectedConv.contact?.email && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span className="truncate">{selectedConv.contact.email}</span>
                  </div>
                )}
                {selectedConv.contact?.phone && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <span>{selectedConv.contact.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{new Date(selectedConv.created_at).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-[var(--border-color)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-center opacity-50 cursor-not-allowed" disabled>
                  <svg className="w-5 h-5 mx-auto mb-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-[10px] text-[var(--text-secondary)]">สร้างดีล</span>
                </button>
                <button className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-center opacity-50 cursor-not-allowed" disabled>
                  <svg className="w-5 h-5 mx-auto mb-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                  <span className="text-[10px] text-[var(--text-secondary)]">ติด Tag</span>
                </button>
              </div>
            </div>

            {/* AI Assist */}
            <div className="p-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">AI Assist</p>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  เร็วๆ นี้
                </span>
              </div>
              <div className="space-y-2 opacity-50">
                <button disabled className="w-full p-2 rounded-lg bg-[var(--bg-tertiary)] text-left">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <span className="text-xs font-medium text-[var(--text-primary)]">ร่างคำตอบ</span>
                  </div>
                </button>
                <button disabled className="w-full p-2 rounded-lg bg-[var(--bg-tertiary)] text-left">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                    <span className="text-xs font-medium text-[var(--text-primary)]">สรุปแชท</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
