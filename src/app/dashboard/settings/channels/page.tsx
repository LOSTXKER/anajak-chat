'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, Loader2, ExternalLink, MessageSquare, Facebook, Instagram } from 'lucide-react'

interface Channel {
  id: string
  type: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  config: any
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showLineModal, setShowLineModal] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        setLoading(false)
        return
      }

      // Load channels via API (bypasses RLS)
      const response = await fetch('/api/channels/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.success && data.channels) {
        console.log('Loaded channels:', data.channels)
        setChannels(data.channels)
      } else {
        console.error('Failed to load channels:', data.error)
        setChannels([])
      }
    } catch (error) {
      console.error('Error loading channels:', error)
      setChannels([])
    } finally {
      setLoading(false)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'line':
        return <MessageSquare className="text-green-500" size={24} />
      case 'facebook':
        return <Facebook className="text-blue-600" size={24} />
      case 'instagram':
        return <Instagram className="text-pink-500" size={24} />
      default:
        return <MessageSquare className="text-gray-500" size={24} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-sm">
            <Check size={14} />
            เชื่อมต่อแล้ว
          </span>
        )
      case 'error':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full text-sm">
            <X size={14} />
            มีปัญหา
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 rounded-full text-sm">
            ยังไม่เชื่อมต่อ
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Channel Connections
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          เชื่อมต่อช่องทางการสื่อสารต่างๆ เพื่อรับข้อความจากลูกค้า
        </p>
      </div>

      <div className="p-6 max-w-6xl">
        {/* Available Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* LINE Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getChannelIcon('line')}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">LINE</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Official Account</p>
                </div>
              </div>
              {channels.find(c => c.type === 'line') && 
                getStatusBadge(channels.find(c => c.type === 'line')?.status || 'disconnected')
              }
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              เชื่อมต่อกับ LINE Official Account เพื่อรับและส่งข้อความถึงลูกค้า
            </p>

            {channels.find(c => c.type === 'line')?.status === 'connected' ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowLineModal(true)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm transition-colors"
                >
                  ตั้งค่า
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLineModal(true)}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                เชื่อมต่อ LINE
              </button>
            )}
          </div>

          {/* Facebook Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow opacity-60">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getChannelIcon('facebook')}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Facebook</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Messenger</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-xs">
                เร็วๆ นี้
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              รับข้อความจาก Facebook Page Messenger
            </p>

            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-lg text-sm cursor-not-allowed"
            >
              กำลังพัฒนา
            </button>
          </div>

          {/* Instagram Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow opacity-60">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getChannelIcon('instagram')}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Instagram</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Direct Messages</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-xs">
                เร็วๆ นี้
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              รับข้อความจาก Instagram Direct Messages
            </p>

            <button
              disabled
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded-lg text-sm cursor-not-allowed"
            >
              กำลังพัฒนา
            </button>
          </div>

        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
            💡 ต้องการความช่วยเหลือ?
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
            ดูคู่มือการเชื่อมต่อช่องทางต่างๆ แบบละเอียด
          </p>
          <a
            href="/docs/LINE_INTEGRATION_SETUP.md"
            target="_blank"
            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink size={16} />
            คู่มือเชื่อมต่อ LINE
          </a>
        </div>
      </div>

      {/* LINE Connection Modal */}
      {showLineModal && (
        <LineConnectionModal
          onClose={() => setShowLineModal(false)}
          onSuccess={() => {
            setShowLineModal(false)
            // Reload channels to show updated status
            loadChannels()
          }}
          existingChannel={channels.find(c => c.type === 'line')}
        />
      )}
    </div>
  )
}

// LINE Connection Modal Component
function LineConnectionModal({ 
  onClose, 
  onSuccess,
  existingChannel 
}: { 
  onClose: () => void
  onSuccess: () => void
  existingChannel?: Channel
}) {
  const [formData, setFormData] = useState({
    channelId: existingChannel?.config?.channel_id || '',
    channelSecret: existingChannel?.config?.channel_secret || '',
    accessToken: existingChannel?.config?.access_token || '',
    autoReplyEnabled: existingChannel?.config?.auto_reply_enabled || true,
    autoReplyMessage: existingChannel?.config?.auto_reply_message || 'สวัสดีครับ ขอบคุณที่ติดต่อเรา เราจะรีบตอบกลับโดยเร็วที่สุดครับ 🙏',
  })
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/line/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: formData.channelId,
          channelSecret: formData.channelSecret,
          accessToken: formData.accessToken,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: `✅ เชื่อมต่อสำเร็จ! Bot name: ${data.botName}`,
        })
      } else {
        setTestResult({
          success: false,
          message: `❌ เชื่อมต่อไม่สำเร็จ: ${data.error || 'ไม่ทราบสาเหตุ'}`,
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '❌ เกิดข้อผิดพลาด: ' + (error as Error).message,
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Use API route to save (bypasses RLS issues)
      const response = await fetch('/api/channels/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          channelId: formData.channelId,
          channelSecret: formData.channelSecret,
          accessToken: formData.accessToken,
          autoReplyEnabled: formData.autoReplyEnabled,
          autoReplyMessage: formData.autoReplyMessage,
          existingChannelId: existingChannel?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save channel')
      }

      // Show success message
      alert('✅ บันทึกการตั้งค่าสำเร็จ!\n\nระบบจะรีเฟรชหน้าเพื่ออัปเดตสถานะ')
      
      // Close modal and reload
      onSuccess()
      
      // Reload page to show updated status
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error saving channel:', error)
      alert('❌ เกิดข้อผิดพลาด: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-green-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              เชื่อมต่อ LINE Official Account
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
              📝 วิธีหา Credentials:
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>ไปที่ <a href="https://developers.line.biz/console/" target="_blank" className="underline">LINE Developers Console</a></li>
              <li>เลือก Channel ของคุณ</li>
              <li>ไปที่ tab "Basic settings" สำหรับ Channel ID และ Secret</li>
              <li>ไปที่ tab "Messaging API" สำหรับ Access Token</li>
            </ol>
          </div>

          {/* Channel ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Channel ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              placeholder="1234567890"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Channel Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Channel Secret <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.channelSecret}
              onChange={(e) => setFormData({ ...formData, channelSecret: e.target.value })}
              placeholder="••••••••••••••••"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Channel Access Token <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              placeholder="Long-lived access token"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          {/* Auto Reply Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={formData.autoReplyEnabled}
                onChange={(e) => setFormData({ ...formData, autoReplyEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                เปิดใช้งาน Auto-reply
              </span>
            </label>

            {formData.autoReplyEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ข้อความตอบกลับอัตโนมัติ
                </label>
                <textarea
                  value={formData.autoReplyMessage}
                  onChange={(e) => setFormData({ ...formData, autoReplyMessage: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleTest}
            disabled={testing || !formData.channelId || !formData.channelSecret || !formData.accessToken}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                กำลังทดสอบ...
              </>
            ) : (
              'ทดสอบการเชื่อมต่อ'
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !testResult?.success}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  กำลังบันทึก...
                </>
              ) : (
                'บันทึก'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

