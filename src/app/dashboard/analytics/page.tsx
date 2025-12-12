'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalConversations: number
  openConversations: number
  totalMessages: number
  totalContacts: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    openConversations: 0,
    totalMessages: 0,
    totalContacts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) return

      // Get business ID first
      const bizRes = await fetch('/api/user/business', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const bizData = await bizRes.json()
      if (!bizData.businessId) return

      // Load stats
      const [convRes, msgRes, contactRes] = await Promise.all([
        supabase.from('conversations').select('id, status', { count: 'exact' }).eq('business_id', bizData.businessId),
        supabase.from('messages').select('id', { count: 'exact' }).eq('business_id', bizData.businessId),
        supabase.from('contacts').select('id', { count: 'exact' }).eq('business_id', bizData.businessId),
      ])

      const conversations = convRes.data || []
      const openCount = conversations.filter((c: { status: string }) => c.status === 'open').length

      setStats({
        totalConversations: convRes.count || 0,
        openConversations: openCount,
        totalMessages: msgRes.count || 0,
        totalContacts: contactRes.count || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
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
        <h1 className="page-title">สถิติ & รายงาน</h1>
        <p className="page-subtitle">ภาพรวมผลการดำเนินงาน และข้อมูลเชิงลึก</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalConversations}</p>
          <p className="text-sm text-[var(--text-muted)]">การสนทนาทั้งหมด</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.openConversations}</p>
          <p className="text-sm text-[var(--text-muted)]">กำลังดำเนินการ</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalMessages}</p>
          <p className="text-sm text-[var(--text-muted)]">ข้อความทั้งหมด</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalContacts}</p>
          <p className="text-sm text-[var(--text-muted)]">รายชื่อติดต่อ</p>
        </div>
      </div>

      {/* Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance */}
        <div className="card p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">ประสิทธิภาพ</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">อัตราการตอบกลับ</span>
                <span className="font-medium text-[var(--text-primary)]">0%</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full w-0 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">เวลาตอบกลับเฉลี่ย</span>
                <span className="font-medium text-[var(--text-primary)]">- นาที</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full w-0 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--text-secondary)]">ความพึงพอใจ</span>
                <span className="font-medium text-[var(--text-primary)]">- %</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full w-0 bg-amber-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="card p-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Funnel</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-10 bg-blue-500/20 rounded-lg flex items-center px-4">
                <span className="text-sm font-medium text-[var(--text-primary)]">แชทใหม่</span>
              </div>
              <span className="text-sm text-[var(--text-muted)] w-16 text-right">{stats.totalConversations}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-10 bg-purple-500/20 rounded-lg flex items-center px-4 ml-4">
                <span className="text-sm font-medium text-[var(--text-primary)]">สร้างงาน</span>
              </div>
              <span className="text-sm text-[var(--text-muted)] w-16 text-right">0</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-10 bg-green-500/20 rounded-lg flex items-center px-4 ml-8">
                <span className="text-sm font-medium text-[var(--text-primary)]">ปิดดีล</span>
              </div>
              <span className="text-sm text-[var(--text-muted)] w-16 text-right">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="card p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">สถิติเพิ่มเติมกำลังมา</h3>
            <p className="text-sm text-[var(--text-secondary)]">รายงานเชิงลึก, Agent Performance, Revenue Tracking</p>
          </div>
          <span className="badge badge-blue ml-auto">เร็วๆ นี้</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center opacity-60">
            <p className="text-xs text-[var(--text-muted)] mb-1">รายได้เดือนนี้</p>
            <p className="font-semibold text-[var(--text-primary)]">฿0</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center opacity-60">
            <p className="text-xs text-[var(--text-muted)] mb-1">Close Rate</p>
            <p className="font-semibold text-[var(--text-primary)]">0%</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center opacity-60">
            <p className="text-xs text-[var(--text-muted)] mb-1">Avg. Deal Size</p>
            <p className="font-semibold text-[var(--text-primary)]">฿0</p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center opacity-60">
            <p className="text-xs text-[var(--text-muted)] mb-1">Customer LTV</p>
            <p className="font-semibold text-[var(--text-primary)]">฿0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
