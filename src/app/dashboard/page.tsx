'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Stats {
  conversations: number
  contacts: number
  messages: number
  entities: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    conversations: 0,
    contacts: 0,
    messages: 0,
    entities: 0
  })
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Get business info
      const response = await fetch('/api/user/business', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (response.ok) {
        const { business_id } = await response.json()
        
        // Get business name
        const { data: business } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', business_id)
          .single<{ name: string }>()
        
        if (business) setBusinessName(business.name)

        // Get stats
        const [convResult, contactResult, msgResult, entityResult] = await Promise.all([
          supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', business_id),
          supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', business_id),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('business_id', business_id),
          supabase.from('entities').select('id', { count: 'exact', head: true }).eq('business_id', business_id),
        ])

        setStats({
          conversations: convResult.count || 0,
          contacts: contactResult.count || 0,
          messages: msgResult.count || 0,
          entities: entityResult.count || 0,
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'การสนทนา', value: stats.conversations, href: '/dashboard/inbox', color: 'var(--accent-primary)' },
    { label: 'ลูกค้า', value: stats.contacts, href: '/dashboard/contacts', color: 'var(--success)' },
    { label: 'ข้อความ', value: stats.messages, href: '/dashboard/inbox', color: 'var(--info)' },
    { label: 'งาน & ดีล', value: stats.entities, href: '/dashboard/entities', color: 'var(--warning)' },
  ]

  const quickActions = [
    { label: 'เปิดกล่องข้อความ', href: '/dashboard/inbox', icon: '📬' },
    { label: 'ดูรายชื่อลูกค้า', href: '/dashboard/contacts', icon: '👥' },
    { label: 'จัดการงาน', href: '/dashboard/entities', icon: '📋' },
    { label: 'ตั้งค่าระบบ', href: '/dashboard/settings', icon: '⚙️' },
  ]

  if (loading) {
    return (
      <div className="p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[var(--bg-tertiary)] rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-[var(--bg-tertiary)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          สวัสดี! 👋
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {businessName ? `ยินดีต้อนรับสู่ ${businessName}` : 'ยินดีต้อนรับกลับ'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card p-4 hover:shadow-soft transition-shadow cursor-pointer"
          >
            <div 
              className="text-3xl font-bold mb-1"
              style={{ color: stat.color }}
            >
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {stat.label}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          เริ่มต้นใช้งาน
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="card p-4 hover:shadow-soft transition-all hover:scale-[1.02] cursor-pointer
                flex items-center gap-3"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-5 bg-[var(--bg-active)]">
        <h3 className="font-medium text-[var(--text-primary)] mb-2">
          💡 เคล็ดลับ
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          เชื่อมต่อ LINE Official Account ของคุณในหน้าตั้งค่า เพื่อรับข้อความจากลูกค้าได้ทันที
        </p>
        <Link 
          href="/dashboard/settings/channels"
          className="inline-block mt-3 text-sm font-medium text-[var(--accent-primary)] hover:underline"
        >
          ไปที่การตั้งค่าช่องทาง →
        </Link>
      </div>
    </div>
  )
}
