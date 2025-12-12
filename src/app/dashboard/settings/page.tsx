'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface UserInfo {
  email: string
  businessName: string
  role: string
}

const settingsMenu = [
  {
    href: '/dashboard/settings/channels',
    icon: (
      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    title: 'เชื่อมต่อช่องทาง',
    desc: 'LINE, Facebook, Instagram',
    active: true,
  },
  {
    href: '/dashboard/settings/team',
    icon: (
      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'จัดการทีม',
    desc: 'เพิ่ม/ลบสมาชิก, กำหนดสิทธิ์',
    disabled: true,
  },
  {
    href: '/dashboard/settings/business',
    icon: (
      <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    title: 'ข้อมูลธุรกิจ',
    desc: 'ชื่อ, โลโก้, เวลาทำการ',
    disabled: true,
  },
  {
    href: '/dashboard/settings/notifications',
    icon: (
      <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    title: 'การแจ้งเตือน',
    desc: 'Email, Push, LINE Notify',
    disabled: true,
  },
  {
    href: '/dashboard/settings/billing',
    icon: (
      <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: 'บิลและการชำระเงิน',
    desc: 'แพ็กเกจ, ประวัติ, ใบเสร็จ',
    disabled: true,
  },
  {
    href: '/dashboard/settings/api',
    icon: (
      <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: 'API & Webhooks',
    desc: 'สร้าง API Keys, ตั้งค่า Webhooks',
    disabled: true,
  },
]

export default function SettingsPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const token = (await supabase.auth.getSession()).data.session?.access_token
        if (!token) return

        const bizRes = await fetch('/api/user/business', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const bizData = await bizRes.json()

        if (bizData.businessId) {
          const { data: business } = await supabase
            .from('businesses')
            .select('name')
            .eq('id', bizData.businessId)
            .single()

          const { data: member } = await supabase
            .from('business_members')
            .select('role')
            .eq('business_id', bizData.businessId)
            .eq('user_id', user.id)
            .single()

          setUserInfo({
            email: user.email || '',
            businessName: (business as { name: string })?.name || '',
            role: (member as { role: string })?.role || 'member',
          })
        }
      } catch (error) {
        console.error('Error loading user info:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUserInfo()
  }, [])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'เจ้าของ'
      case 'admin':
        return 'แอดมิน'
      case 'agent':
        return 'เจ้าหน้าที่'
      default:
        return 'สมาชิก'
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
      <div className="mb-8">
        <h1 className="page-title">ตั้งค่า</h1>
        <p className="page-subtitle">จัดการบัญชี ธุรกิจ และการเชื่อมต่อ</p>
      </div>

      {/* Account Info */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">บัญชีของคุณ</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-xl">
            {userInfo?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <p className="font-medium text-[var(--text-primary)]">{userInfo?.email}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {userInfo?.businessName && (
                <>
                  {userInfo.businessName} • 
                </>
              )}
              {getRoleLabel(userInfo?.role || '')}
            </p>
          </div>
          <span className="badge badge-green">Active</span>
        </div>
      </div>

      {/* Settings Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsMenu.map((item) => (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            onClick={(e) => item.disabled && e.preventDefault()}
            className={`card p-5 flex items-center gap-4 group transition-all-200
              ${item.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}`}
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-[var(--text-primary)]">{item.title}</h3>
                {item.disabled && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] uppercase">
                    เร็วๆ นี้
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
            </div>
            {!item.disabled && (
              <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </Link>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-8">
        <h2 className="section-title">โซนอันตราย</h2>
        <div className="card p-5 border-[var(--error)]/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--error)]">ลบบัญชี</h3>
              <p className="text-sm text-[var(--text-muted)]">ลบบัญชีและข้อมูลทั้งหมดอย่างถาวร</p>
            </div>
            <button className="px-4 py-2 rounded-lg border border-[var(--error)] text-[var(--error)] text-sm font-medium hover:bg-[var(--error)] hover:text-white transition-colors opacity-50 cursor-not-allowed" disabled>
              ลบบัญชี
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
