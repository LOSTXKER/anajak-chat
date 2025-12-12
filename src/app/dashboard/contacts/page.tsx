'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  channel: string
  created_at: string
  metadata?: {
    profile_picture?: string
  }
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  const loadContacts = useCallback(async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) return

      const bizRes = await fetch('/api/user/business', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const bizData = await bizRes.json()
      if (!bizData.businessId) return

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('business_id', bizData.businessId)
        .order('created_at', { ascending: false })

      setContacts((data as Contact[]) || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  )

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'line':
        return <span className="badge" style={{ background: '#06c755', color: 'white' }}>LINE</span>
      case 'facebook':
        return <span className="badge" style={{ background: '#1877f2', color: 'white' }}>Facebook</span>
      case 'instagram':
        return <span className="badge" style={{ background: '#e4405f', color: 'white' }}>Instagram</span>
      default:
        return <span className="badge badge-gray">{channel}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">รายชื่อติดต่อ</h1>
          <p className="page-subtitle">จัดการผู้ติดต่อและลูกค้าของคุณ</p>
        </div>
        <button className="btn btn-primary opacity-50 cursor-not-allowed" disabled>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มผู้ติดต่อ
        </button>
      </div>

      {/* Search & Filter */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl"
          />
        </div>
      </div>

      {/* Contact List */}
      {filteredContacts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">
            {searchTerm ? 'ไม่พบผู้ติดต่อ' : 'ยังไม่มีผู้ติดต่อ'}
          </h3>
          <p className="text-[var(--text-muted)]">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ผู้ติดต่อจะปรากฏเมื่อมีคนทักแชท'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[var(--border-color)]">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-lg">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{contact.name}</p>
                  <p className="text-sm text-[var(--text-muted)] truncate">
                    {contact.email || contact.phone || 'ไม่มีข้อมูลติดต่อ'}
                  </p>
                </div>
                {getChannelBadge(contact.channel)}
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>แสดง {filteredContacts.length} จาก {contacts.length} รายการ</span>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedContact(null)}></div>
          <div className="relative card w-full max-w-md p-6">
            <button
              onClick={() => setSelectedContact(null)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--bg-hover)]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-2xl">
                {selectedContact.name.charAt(0)}
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{selectedContact.name}</h2>
              <div className="mt-2">{getChannelBadge(selectedContact.channel)}</div>
            </div>

            <div className="space-y-4">
              {selectedContact.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="text-[var(--text-primary)]">{selectedContact.email}</span>
                </div>
              )}
              {selectedContact.phone && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span className="text-[var(--text-primary)]">{selectedContact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="text-[var(--text-secondary)]">
                  เข้าร่วม {new Date(selectedContact.created_at).toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setSelectedContact(null)}>
                ปิด
              </button>
              <button className="btn btn-primary flex-1 opacity-50 cursor-not-allowed" disabled>
                ดูประวัติแชท
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
