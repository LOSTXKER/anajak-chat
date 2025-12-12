'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Building, Users, Zap, Brain, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBusiness()
  }, [])

  const loadBusiness = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('business_members')
        .select('business_id, businesses(*)')
        .eq('user_id', user.id)
        .single()

      if (membership) {
        setBusiness(membership)
      }
    } catch (error) {
      console.error('Error loading business:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'business', name: 'ข้อมูลธุรกิจ', icon: Building, path: '/dashboard/settings' },
    { id: 'team', name: 'ทีม', icon: Users, path: '/dashboard/settings' },
    { id: 'channels', name: 'ช่องทาง', icon: Zap, path: '/dashboard/settings/channels' },
    { id: 'ai', name: 'AI Settings', icon: Brain, path: '/dashboard/settings' },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: Bell, path: '/dashboard/settings' },
    { id: 'security', name: 'ความปลอดภัย', icon: Shield, path: '/dashboard/settings' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        <nav className="p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isChannels = tab.id === 'channels'
            
            if (isChannels) {
              return (
                <a
                  key={tab.id}
                  href={tab.path}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Icon size={20} />
                  <span>{tab.name}</span>
                </a>
              )
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl">
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  ข้อมูลธุรกิจ
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  จัดการข้อมูลพื้นฐานของธุรกิจของคุณ
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ชื่อธุรกิจ
                  </label>
                  <input
                    type="text"
                    defaultValue={business?.businesses?.name}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    defaultValue={business?.businesses?.slug}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ทีม</h2>
                <p className="text-gray-600 dark:text-gray-400">จัดการสมาชิกในทีมของคุณ</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Team management feature coming soon...
                </p>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ช่องทาง</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  เชื่อมต่อช่องทางการสื่อสารต่างๆ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Facebook', 'Instagram', 'LINE', 'TikTok', 'Shopee', 'Email'].map(
                  (channel) => (
                    <div
                      key={channel}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {channel}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        ไม่ได้เชื่อมต่อ
                      </p>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                        เชื่อมต่อ
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">ตั้งค่า AI สำหรับธุรกิจของคุณ</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Model
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                    <option>GPT-4</option>
                    <option>GPT-3.5 Turbo</option>
                    <option>Claude 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone & Style
                  </label>
                  <textarea
                    rows={3}
                    placeholder="อธิบายโทนและสไตล์การพูดของธุรกิจ..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Enable AI Assist</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      เปิดใช้งานการช่วยเหลือจาก AI
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  บันทึกการตั้งค่า
                </button>
              </div>
            </div>
          )}

          {(activeTab === 'notifications' || activeTab === 'security') && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                Feature coming soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

