'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, User, Mail, Phone, Tag, Package, FileText, Sparkles } from 'lucide-react'
import { Database } from '@/types/database.types'

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  contact: Database['public']['Tables']['contacts']['Row']
  channel: Database['public']['Tables']['channels']['Row']
}

type Entity = Database['public']['Tables']['entities']['Row']

interface ContextPanelProps {
  conversation: Conversation
}

export default function ContextPanel({ conversation }: ContextPanelProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [activeTab, setActiveTab] = useState<'contact' | 'entities' | 'ai'>('contact')

  useEffect(() => {
    loadEntities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id])

  const loadEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setEntities(data || [])
    } catch (error) {
      console.error('Error loading entities:', error)
    }
  }

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contact'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <User size={18} className="inline mr-2" />
            ผู้ติดต่อ
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'entities'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Package size={18} className="inline mr-2" />
            งาน
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Sparkles size={18} className="inline mr-2" />
            AI
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-semibold mx-auto mb-3">
                {conversation.contact.name?.[0]?.toUpperCase() || '?'}
              </div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {conversation.contact.name || 'Unknown Contact'}
              </h3>
            </div>

            <div className="space-y-3">
              {conversation.contact.email && (
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">อีเมล</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {conversation.contact.email}
                    </p>
                  </div>
                </div>
              )}

              {conversation.contact.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">เบอร์โทร</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {conversation.contact.phone}
                    </p>
                  </div>
                </div>
              )}

              {conversation.contact.tags && conversation.contact.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">แท็ก</p>
                    <div className="flex flex-wrap gap-2">
                      {conversation.contact.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                แก้ไขข้อมูล
              </button>
            </div>
          </div>
        )}

        {activeTab === 'entities' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">งานที่เกี่ยวข้อง</h3>
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors">
                + สร้างงาน
              </button>
            </div>

            {entities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">ยังไม่มีงานที่เกี่ยวข้อง</p>
              </div>
            ) : (
              entities.map((entity) => (
                <div
                  key={entity.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                      {entity.title}
                    </h4>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
                      {entity.status}
                    </span>
                  </div>
                  {entity.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {entity.description}
                    </p>
                  )}
                  {entity.value && (
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {entity.value.toLocaleString()} {entity.currency || 'THB'}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">AI Insights</h3>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-3">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-400 mb-2">
                  สรุปบทสนทนา
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  ลูกค้าสอบถามเกี่ยวกับสินค้าและราคา กำลังพิจารณาซื้อ
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-3">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-2">
                  แนะนำการตอบ
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  เสนอโปรโมชั่นพิเศษและเชิญชวนดูสินค้าเพิ่มเติม
                </p>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  ใช้คำแนะนำนี้
                </button>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-400 mb-2">
                  Next Action
                </h4>
                <p className="text-sm text-green-800 dark:text-green-300">
                  ส่งใบเสนอราคาและติดตามใน 24 ชั่วโมง
                </p>
              </div>
            </div>

            <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              <Sparkles size={16} />
              สร้างข้อความด้วย AI
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

