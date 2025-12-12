'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  tags?: string[]
  created_at: string
  metadata?: any
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/user/business', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const { business_id } = await response.json()
        const { data } = await supabase
          .from('contacts')
          .select('*')
          .eq('business_id', business_id)
          .order('created_at', { ascending: false })

        if (data) setContacts(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[var(--bg-tertiary)] rounded" />
          <div className="h-12 bg-[var(--bg-tertiary)] rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-[var(--bg-tertiary)] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            รายชื่อลูกค้า
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {contacts.length} รายชื่อ
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, อีเมล หรือเบอร์โทร..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full lg:w-80 px-4 py-2.5 rounded-lg text-sm"
        />
      </div>

      {/* Contact List */}
      {filteredContacts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            {searchTerm ? 'ไม่พบผลลัพธ์' : 'ยังไม่มีรายชื่อลูกค้า'}
          </h3>
          <p className="text-[var(--text-secondary)]">
            {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'ลูกค้าจะปรากฏที่นี่เมื่อมีคนติดต่อเข้ามา'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-default bg-[var(--bg-secondary)]">
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-secondary)]">
                    ลูกค้า
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hidden md:table-cell">
                    ช่องทาง
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hidden lg:table-cell">
                    วันที่เพิ่ม
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-secondary)]">
                    แท็ก
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id}
                    className="border-b border-default hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0 text-lg">
                          {contact.avatar ? (
                            <img 
                              src={contact.avatar} 
                              alt="" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            contact.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">
                            {contact.name}
                          </div>
                          {contact.email && (
                            <div className="text-sm text-[var(--text-muted)]">
                              {contact.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {contact.metadata?.line_user_id ? '💬 LINE' : '📧 อื่นๆ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {formatDate(contact.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags?.map((tag, i) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                          >
                            {tag}
                          </span>
                        )) || (
                          <span className="text-xs text-[var(--text-muted)]">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
