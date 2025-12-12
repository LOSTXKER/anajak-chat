'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Target,
  Clock,
  Award,
  AlertCircle,
} from 'lucide-react'

interface AnalyticsData {
  totalConversations: number
  activeConversations: number
  totalEntities: number
  totalRevenue: number
  avgResponseTime: number
  conversionRate: number
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalConversations: 0,
    activeConversations: 0,
    totalEntities: 0,
    totalRevenue: 0,
    avgResponseTime: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's business
      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id)
        .single<{ business_id: string }>()

      if (!membership) return

      // Load conversations
      const { count: totalConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', membership.business_id)

      const { count: activeConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', membership.business_id)
        .in('status', ['open', 'claimed'])

      // Load entities
      const { count: totalEntities } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', membership.business_id)

      // Calculate revenue
      const { data: entities } = await supabase
        .from('entities')
        .select('value')
        .eq('business_id', membership.business_id)
        .eq('status', 'won')

      const totalRevenue = (entities as any[])?.reduce((sum, entity) => sum + (entity.value || 0), 0) || 0

      // Calculate conversion rate
      const { count: wonEntities } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', membership.business_id)
        .eq('status', 'won')

      const conversionRate = totalEntities ? ((wonEntities || 0) / totalEntities) * 100 : 0

      setAnalytics({
        totalConversations: totalConversations || 0,
        activeConversations: activeConversations || 0,
        totalEntities: totalEntities || 0,
        totalRevenue,
        avgResponseTime: 15, // Mock data
        conversionRate,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
  }: {
    title: string
    value: string | number
    subtitle: string
    icon: any
    color: string
  }) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          ภาพรวมและข้อมูลเชิงลึกของธุรกิจ
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="ข้อความทั้งหมด"
            value={analytics.totalConversations}
            subtitle={`${analytics.activeConversations} ข้อความที่ active`}
            icon={MessageSquare}
            color="bg-blue-500"
          />

          <StatCard
            title="งานทั้งหมด"
            value={analytics.totalEntities}
            subtitle="จากการสนทนา"
            icon={Target}
            color="bg-purple-500"
          />

          <StatCard
            title="รายได้"
            value={`฿${analytics.totalRevenue.toLocaleString()}`}
            subtitle="จากงานที่ปิดได้"
            icon={DollarSign}
            color="bg-green-500"
          />

          <StatCard
            title="Conversion Rate"
            value={`${analytics.conversionRate.toFixed(1)}%`}
            subtitle="Chat → Win"
            icon={TrendingUp}
            color="bg-orange-500"
          />
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Conversation Funnel
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversations</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.totalConversations}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Entities Created</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {analytics.totalEntities}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full"
                    style={{
                      width: `${Math.min(
                        (analytics.totalEntities / Math.max(analytics.totalConversations, 1)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Won</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Math.round((analytics.totalEntities * analytics.conversionRate) / 100)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${analytics.conversionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-600 dark:text-blue-400" size={24} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Avg Response Time
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ระยะเวลาตอบกลับเฉลี่ย</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.avgResponseTime}m
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="text-green-600 dark:text-green-400" size={24} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Win Rate</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">อัตราการปิดการขาย</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {analytics.conversionRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="text-purple-600 dark:text-purple-400" size={24} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Active Agents
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">พนักงานที่กำลังทำงาน</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">1</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">💡 AI Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">Top Opportunity</p>
              <p className="font-semibold">
                เพิ่มการตอบกลับเร็วขึ้น 20% เพื่อเพิ่ม conversion
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">คำถามยอดนิยม</p>
              <p className="font-semibold">&quot;สินค้ามีสต็อกหรือไม่?&quot; ถูกถามบ่อยที่สุด</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">Recommendation</p>
              <p className="font-semibold">ควรมีแชทบอทสำหรับคำถามเหล่านี้</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

