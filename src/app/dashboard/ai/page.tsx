'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

const aiFeatures = [
  {
    id: 'sentiment',
    title: 'Sentiment Analysis',
    desc: 'วิเคราะห์อารมณ์ลูกค้าจากข้อความ',
    icon: '😊',
    color: 'from-pink-500 to-rose-500',
    stats: { analyzed: 1234, positive: 892, neutral: 234, negative: 108 }
  },
  {
    id: 'intent',
    title: 'Intent Detection',
    desc: 'ตรวจจับเจตนาของลูกค้าอัตโนมัติ',
    icon: '🎯',
    color: 'from-blue-500 to-cyan-500',
    stats: { detected: 987, purchase: 234, inquiry: 543, complaint: 210 }
  },
  {
    id: 'suggest',
    title: 'Reply Suggestions',
    desc: 'แนะนำคำตอบที่เหมาะสมด้วย AI',
    icon: '💡',
    color: 'from-amber-500 to-yellow-500',
    stats: { suggested: 2341, used: 1876, accuracy: 80.1 }
  },
  {
    id: 'summary',
    title: 'Conversation Summary',
    desc: 'สรุปบทสนทนาอัตโนมัติ',
    icon: '📝',
    color: 'from-green-500 to-emerald-500',
    stats: { summarized: 567, saved: '234 ชม.' }
  },
  {
    id: 'translate',
    title: 'Auto Translation',
    desc: 'แปลภาษาอัตโนมัติ 50+ ภาษา',
    icon: '🌐',
    color: 'from-purple-500 to-violet-500',
    stats: { translated: 456, languages: 12 }
  },
  {
    id: 'classify',
    title: 'Auto-Classification',
    desc: 'จัดหมวดหมู่และ Tag อัตโนมัติ',
    icon: '🏷️',
    color: 'from-indigo-500 to-blue-500',
    stats: { classified: 1876, tags: 24 }
  },
]

const mockInsights = [
  {
    id: 1,
    type: 'warning',
    title: 'ลูกค้ารอนานกว่าปกติ',
    desc: 'เวลารอเฉลี่ยเพิ่มขึ้น 23% ในสัปดาห์นี้',
    action: 'ดูรายละเอียด',
    time: '2 ชม. ที่แล้ว'
  },
  {
    id: 2,
    type: 'success',
    title: 'Sentiment เป็นบวก',
    desc: '85% ของแชทมีอารมณ์เป็นบวกในวันนี้',
    action: 'ดูแนวโน้ม',
    time: '5 ชม. ที่แล้ว'
  },
  {
    id: 3,
    type: 'info',
    title: 'หัวข้อยอดนิยม',
    desc: 'ลูกค้าถามเรื่อง "ราคา" บ่อยสุดวันนี้ (45 ครั้ง)',
    action: 'สร้าง FAQ',
    time: '1 วัน ที่แล้ว'
  },
]

const mockModels = [
  {
    id: 1,
    name: 'GPT-4',
    provider: 'OpenAI',
    status: 'connected',
    usage: 2341,
    cost: 234.50
  },
  {
    id: 2,
    name: 'Claude 3',
    provider: 'Anthropic',
    status: 'connected',
    usage: 1234,
    cost: 123.20
  },
  {
    id: 3,
    name: 'Gemini Pro',
    provider: 'Google',
    status: 'not_connected',
    usage: 0,
    cost: 0
  },
]

export default function AICenterPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [tab, setTab] = useState<'features' | 'insights' | 'models'>('features')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const feature = selectedFeature ? aiFeatures.find(f => f.id === selectedFeature) : null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-secondary)]">
      <Navbar title="AI Center" />

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">ใช้ AI เพื่อวิเคราะห์ แนะนำ และปรับปรุงการบริการ</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)]">AI ทำงานอยู่</span>
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">6</p>
            <p className="text-xs text-[var(--text-muted)]">AI Features</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">7.2K</p>
            <p className="text-xs text-[var(--text-muted)]">AI Requests</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">85%</p>
            <p className="text-xs text-[var(--text-muted)]">ความแม่นยำ</p>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">$357</p>
            <p className="text-xs text-[var(--text-muted)]">ค่าใช้จ่ายเดือนนี้</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--bg-tertiary)] rounded-lg p-1 w-fit">
          {(['features', 'insights', 'models'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              {t === 'features' ? 'AI Features' : t === 'insights' ? 'Insights' : 'AI Models'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'features' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiFeatures.map((feat) => (
              <div
                key={feat.id}
                onClick={() => setSelectedFeature(feat.id)}
                className="card p-5 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {feat.icon}
                  </div>
                  <span className="badge badge-green text-[10px]">เปิดใช้</span>
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{feat.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{feat.desc}</p>
                
                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(feat.stats).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="p-2 bg-[var(--bg-secondary)] rounded-lg">
                      <p className="text-xs text-[var(--text-muted)] capitalize">{key}</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'insights' && (
          <div className="space-y-3">
            {mockInsights.map((insight) => (
              <div key={insight.id} className="card p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    insight.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    insight.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {insight.type === 'warning' && (
                      <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    )}
                    {insight.type === 'success' && (
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {insight.type === 'info' && (
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">{insight.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{insight.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">{insight.time}</span>
                      <button className="text-sm font-medium text-[var(--accent-primary)] hover:underline">
                        {insight.action} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* AI Analysis Preview */}
            <div className="card p-6 mt-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-2">AI กำลังวิเคราะห์...</h3>
                <p className="text-sm text-[var(--text-secondary)]">อัปเดตผลวิเคราะห์ทุก 15 นาที</p>
              </div>
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'models' && (
          <div>
            <div className="space-y-3 mb-6">
              {mockModels.map((model) => (
                <div key={model.id} className="card p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg">
                      {model.provider.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">{model.name}</h3>
                        <span className="text-sm text-[var(--text-muted)]">by {model.provider}</span>
                        <span className={`badge ${model.status === 'connected' ? 'badge-green' : 'badge-gray'}`}>
                          {model.status === 'connected' ? 'เชื่อมแล้ว' : 'ไม่ได้เชื่อม'}
                        </span>
                      </div>
                      {model.status === 'connected' && (
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                          <span>{model.usage.toLocaleString()} requests</span>
                          <span>•</span>
                          <span>${model.cost.toFixed(2)} ใช้ไปแล้ว</span>
                        </div>
                      )}
                    </div>
                    <button 
                      disabled
                      className={`btn ${model.status === 'connected' ? 'btn-secondary' : 'btn-primary'} opacity-50`}
                    >
                      {model.status === 'connected' ? 'ตั้งค่า' : 'เชื่อมต่อ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Usage Chart Placeholder */}
            <div className="card p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">การใช้งาน AI (7 วันที่แล้ว)</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {[45, 67, 82, 71, 89, 95, 78].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-t from-violet-500 to-purple-500 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${height}%` }}></div>
                    <span className="text-xs text-[var(--text-muted)] mt-2">
                      {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && feature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFeature(null)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--bg-hover)] z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl shadow-xl`}>
                {feature.icon}
              </div>
              <h2 className="text-2xl font-bold text-center text-[var(--text-primary)] mb-2">{feature.title}</h2>
              <p className="text-center text-[var(--text-secondary)] mb-6">{feature.desc}</p>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(feature.stats).map(([key, value]) => (
                  <div key={key} className="p-4 bg-[var(--bg-secondary)] rounded-xl text-center">
                    <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">{value}</p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{key}</p>
                  </div>
                ))}
              </div>

              {/* Settings */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">เปิดใช้งาน</p>
                    <p className="text-sm text-[var(--text-muted)]">ใช้ AI สำหรับฟีเจอร์นี้</p>
                  </div>
                  <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-not-allowed opacity-50">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl opacity-60">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Auto Mode</p>
                    <p className="text-sm text-[var(--text-muted)]">ทำงานอัตโนมัติ</p>
                  </div>
                  <div className="w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full relative cursor-not-allowed">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <button className="w-full btn btn-primary opacity-50" disabled>
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
