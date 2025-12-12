'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      setUser(session.user)

      const response = await fetch('/api/user/business', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const { business_id } = await response.json()
        const { data } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', business_id)
          .single()
        
        if (data) setBusiness(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const settingsSections = [
    {
      title: 'ช่องทางการติดต่อ',
      description: 'เชื่อมต่อ LINE, Facebook และช่องทางอื่นๆ',
      href: '/dashboard/settings/channels',
      icon: '📱',
    },
    {
      title: 'ข้อมูลธุรกิจ',
      description: 'แก้ไขชื่อ โลโก้ และข้อมูลติดต่อ',
      href: '#',
      icon: '🏢',
      disabled: true,
    },
    {
      title: 'ทีมงาน',
      description: 'จัดการสมาชิกและสิทธิ์การใช้งาน',
      href: '#',
      icon: '👥',
      disabled: true,
    },
    {
      title: 'การแจ้งเตือน',
      description: 'ตั้งค่าการแจ้งเตือนข้อความใหม่',
      href: '#',
      icon: '🔔',
      disabled: true,
    },
  ]

  if (loading) {
    return (
      <div className="p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[var(--bg-tertiary)] rounded" />
          <div className="h-24 bg-[var(--bg-tertiary)] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 pt-16 lg:pt-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          ตั้งค่า
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          จัดการบัญชีและการตั้งค่าระบบ
        </p>
      </div>

      {/* Account Info */}
      <div className="card p-5 mb-6">
        <h2 className="font-medium text-[var(--text-primary)] mb-4">
          ข้อมูลบัญชี
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-default">
            <span className="text-sm text-[var(--text-secondary)]">อีเมล</span>
            <span className="text-sm text-[var(--text-primary)]">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-default">
            <span className="text-sm text-[var(--text-secondary)]">ชื่อธุรกิจ</span>
            <span className="text-sm text-[var(--text-primary)]">{business?.name || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-secondary)]">แพ็กเกจ</span>
            <span className="text-sm text-[var(--accent-primary)] font-medium">ฟรี</span>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-3">
        {settingsSections.map((section) => (
          <Link
            key={section.title}
            href={section.disabled ? '#' : section.href}
            className={`
              card p-4 flex items-center gap-4 transition-all
              ${section.disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-soft hover:scale-[1.01]'
              }
            `}
            onClick={(e) => section.disabled && e.preventDefault()}
          >
            <span className="text-2xl">{section.icon}</span>
            <div className="flex-1">
              <h3 className="font-medium text-[var(--text-primary)]">
                {section.title}
                {section.disabled && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                    เร็วๆ นี้
                  </span>
                )}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {section.description}
              </p>
            </div>
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-8 card p-5 border-red-200 dark:border-red-900/50">
        <h2 className="font-medium text-red-600 dark:text-red-400 mb-2">
          โซนอันตราย
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          การดำเนินการเหล่านี้ไม่สามารถย้อนกลับได้
        </p>
        <button
          disabled
          className="px-4 py-2 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 
            rounded-lg opacity-50 cursor-not-allowed"
        >
          ลบบัญชี
        </button>
      </div>
    </div>
  )
}
