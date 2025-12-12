'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

const mockFlows = [
  { 
    id: 1, 
    name: 'ตอบกลับอัตโนมัติ - นอกเวลาทำการ', 
    trigger: 'ข้อความใหม่ (22:00-08:00)',
    actions: 3,
    status: 'active', 
    runs: 1234,
    lastRun: '5 นาทีที่แล้ว'
  },
  { 
    id: 2, 
    name: 'แจ้งเตือนทีม - แชทรอนาน', 
    trigger: 'แชทรอเกิน 15 นาที',
    actions: 2,
    status: 'active', 
    runs: 567,
    lastRun: '1 ชม. ที่แล้ว'
  },
  { 
    id: 3, 
    name: 'ส่ง Email ติดตาม', 
    trigger: 'ปิดดีลสำเร็จ',
    actions: 4,
    status: 'paused', 
    runs: 89,
    lastRun: '2 วัน ที่แล้ว'
  },
]

const mockChatbots = [
  {
    id: 1,
    name: 'FAQ Bot',
    desc: 'ตอบคำถามที่ถูกถามบ่อย',
    channels: ['LINE', 'Facebook'],
    status: 'active',
    interactions: 2341
  },
  {
    id: 2,
    name: 'Lead Qualifier',
    desc: 'เก็บข้อมูลลูกค้าก่อนส่งคน',
    channels: ['LINE'],
    status: 'draft',
    interactions: 0
  },
]

const flowTemplates = [
  {
    id: 1,
    name: 'Auto-Reply นอกเวลา',
    desc: 'ตอบกลับอัตโนมัติเมื่อนอกเวลาทำการ',
    icon: '🌙',
    popular: true
  },
  {
    id: 2,
    name: 'แจ้งเตือนแชทค้าง',
    desc: 'แจ้งทีมเมื่อมีแชทรอเกิน X นาที',
    icon: '⏰',
    popular: true
  },
  {
    id: 3,
    name: 'Auto-Tag ตาม Keyword',
    desc: 'ติด Tag อัตโนมัติตามคำที่พูด',
    icon: '🏷️',
    popular: false
  },
  {
    id: 4,
    name: 'Auto-Assign ตาม Channel',
    desc: 'มอบหมายงานตามช่องทางที่แชทเข้า',
    icon: '👥',
    popular: false
  },
]

export default function AutomationPage() {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<'flows' | 'bots' | 'templates'>('flows')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-secondary)]">
      <Navbar title="อัตโนมัติ & Chatbot" />

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">สร้าง Workflow, Chatbot และ Automation แบบ No-Code</p>
          </div>
          <button disabled className="btn btn-primary opacity-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            สร้าง Flow ใหม่
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{mockFlows.length}</p>
            <p className="text-xs text-[var(--text-muted)]">Flows ทั้งหมด</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{mockFlows.filter(f => f.status === 'active').length}</p>
            <p className="text-xs text-[var(--text-muted)]">กำลังทำงาน</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {mockFlows.reduce((sum, f) => sum + f.runs, 0).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--text-muted)]">รันทั้งหมด</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{mockChatbots.length}</p>
            <p className="text-xs text-[var(--text-muted)]">Chatbots</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[var(--bg-tertiary)] rounded-lg p-1 w-fit">
          {(['flows', 'bots', 'templates'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tab === t 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
            >
              {t === 'flows' ? 'Workflows' : t === 'bots' ? 'Chatbots' : 'Templates'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'flows' && (
          <div className="space-y-3">
            {mockFlows.map((flow) => (
              <div key={flow.id} className="card p-4 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--text-primary)]">{flow.name}</h3>
                      <span className={`badge ${flow.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        {flow.status === 'active' ? 'ทำงาน' : 'หยุด'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">Trigger: {flow.trigger}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                      <span>{flow.actions} Actions</span>
                      <span>•</span>
                      <span>รัน {flow.runs.toLocaleString()} ครั้ง</span>
                      <span>•</span>
                      <span>ล่าสุด: {flow.lastRun}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                      <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                      <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'bots' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockChatbots.map((bot) => (
              <div key={bot.id} className="card p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </div>
                  <span className={`badge ${bot.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {bot.status === 'active' ? 'ทำงาน' : 'ร่าง'}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-1">{bot.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{bot.desc}</p>
                <div className="flex items-center gap-2 mb-3">
                  {bot.channels.map((ch) => (
                    <span key={ch} className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                      {ch}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{bot.interactions.toLocaleString()} interactions</span>
                  <button className="text-[var(--accent-primary)] font-medium">แก้ไข →</button>
                </div>
              </div>
            ))}

            {/* Add Bot Card */}
            <div className="card p-8 text-center border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer opacity-60">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="font-medium text-[var(--text-primary)]">สร้าง Chatbot</p>
              <p className="text-sm text-[var(--text-muted)]">ใช้ Flow Builder</p>
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flowTemplates.map((template) => (
              <div key={template.id} className="card p-5 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{template.icon}</div>
                  {template.popular && (
                    <span className="badge badge-blue text-[10px]">ยอดนิยม</span>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{template.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{template.desc}</p>
                <button className="w-full btn btn-secondary text-sm">ใช้ Template นี้</button>
              </div>
            ))}
          </div>
        )}

        {/* Flow Builder Preview */}
        {tab === 'flows' && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Flow Builder (Preview)</h2>
            <div className="card p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-2 border-dashed border-[var(--border-color)]">
              <div className="max-w-4xl mx-auto">
                {/* Flow Example */}
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {/* Trigger */}
                  <div className="text-center">
                    <div className="w-32 h-24 rounded-xl bg-green-500 text-white p-4 shadow-lg">
                      <div className="text-xs mb-1 opacity-80">TRIGGER</div>
                      <div className="font-medium text-sm">ข้อความใหม่</div>
                    </div>
                  </div>

                  <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>

                  {/* Condition */}
                  <div className="text-center">
                    <div className="w-32 h-24 rounded-xl bg-amber-500 text-white p-4 shadow-lg">
                      <div className="text-xs mb-1 opacity-80">CONDITION</div>
                      <div className="font-medium text-sm">นอกเวลา?</div>
                    </div>
                  </div>

                  <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>

                  {/* Action */}
                  <div className="text-center">
                    <div className="w-32 h-24 rounded-xl bg-blue-500 text-white p-4 shadow-lg">
                      <div className="text-xs mb-1 opacity-80">ACTION</div>
                      <div className="font-medium text-sm">ส่งข้อความ</div>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-[var(--text-muted)] mt-6">
                  ลากวาง Blocks เพื่อสร้าง Automation Flow
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
