'use client'

import { useEffect, useState } from 'react'

const mockFlows = [
  { id: 1, name: 'ตอบกลับอัตโนมัติ', trigger: 'ข้อความใหม่', status: 'active', runs: 1234 },
  { id: 2, name: 'แจ้งเตือนทีม', trigger: 'แชทรอนาน', status: 'active', runs: 567 },
  { id: 3, name: 'ส่ง Email ติดตาม', trigger: 'ปิดดีล', status: 'paused', runs: 89 },
]

export default function AutomationPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">อัตโนมัติ</h1>
          <p className="page-subtitle">สร้าง Flow อัตโนมัติ และ Chatbot ไม่ต้องเขียนโค้ด</p>
        </div>
        <button disabled className="btn btn-primary opacity-50 cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          สร้าง Flow
        </button>
      </div>

      {/* Coming Soon Banner */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c-.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">ระบบ Automation กำลังพัฒนา</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              เร็วๆ นี้คุณจะสามารถสร้าง Flow Builder, Chatbot, Auto-reply และ Workflow ได้แบบ No-Code
            </p>
          </div>
          <span className="badge badge-orange">เร็วๆ นี้</span>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 opacity-70">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-2">Flow Builder</h4>
          <p className="text-sm text-[var(--text-secondary)]">ลากวาง สร้าง Logic ได้ตามต้องการ</p>
        </div>

        <div className="card p-5 opacity-70">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-2">Chatbot</h4>
          <p className="text-sm text-[var(--text-secondary)]">สร้าง Bot ตอบคำถามอัตโนมัติ</p>
        </div>

        <div className="card p-5 opacity-70">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-2">Auto-Assign</h4>
          <p className="text-sm text-[var(--text-secondary)]">กระจายงานให้ทีมอัตโนมัติ</p>
        </div>

        <div className="card p-5 opacity-70">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-2">แจ้งเตือน</h4>
          <p className="text-sm text-[var(--text-secondary)]">Email, LINE Notify, Webhook</p>
        </div>
      </div>

      {/* Mock Flow List */}
      <div className="card overflow-hidden opacity-60 pointer-events-none">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h3 className="font-medium text-[var(--text-primary)]">Flow ของคุณ (ตัวอย่าง)</h3>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {mockFlows.map((flow) => (
            <div key={flow.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text-primary)]">{flow.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Trigger: {flow.trigger}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--text-primary)]">{flow.runs.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-muted)]">ครั้ง</p>
              </div>
              <span className={`badge ${flow.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                {flow.status === 'active' ? 'ทำงาน' : 'หยุด'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
