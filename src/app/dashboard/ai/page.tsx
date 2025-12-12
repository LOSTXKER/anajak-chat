'use client'

import { useEffect, useState } from 'react'

const mockKnowledge = [
  { id: 1, title: 'ราคาสินค้า', type: 'FAQ', items: 45, lastUpdate: '2 ชม. ที่แล้ว' },
  { id: 2, title: 'วิธีสั่งซื้อ', type: 'SOP', items: 12, lastUpdate: '1 วัน ที่แล้ว' },
  { id: 3, title: 'นโยบายคืนสินค้า', type: 'Policy', items: 8, lastUpdate: '3 วัน ที่แล้ว' },
]

const mockMemory = [
  { key: 'tone', value: 'เป็นกันเอง สุภาพ ใช้ภาษาง่ายๆ' },
  { key: 'pricing_style', value: 'บอกราคาชัดเจน ไม่กั๊ก' },
  { key: 'forbidden', value: 'ห้ามพูดถึงคู่แข่ง, ห้ามให้ส่วนลดเกิน 20%' },
]

export default function AIPage() {
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
          <h1 className="page-title">AI Center</h1>
          <p className="page-subtitle">ฝึก AI ให้เข้าใจธุรกิจของคุณ พร้อมดูค่าใช้จ่ายและ Usage</p>
        </div>
        <button disabled className="btn btn-primary opacity-50 cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
          ทดสอบ AI
        </button>
      </div>

      {/* Coming Soon Banner */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border-violet-100 dark:border-violet-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">AI กำลังพัฒนา</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              เร็วๆ นี้ AI จะช่วยตอบลูกค้า สรุปแชท วิเคราะห์อารมณ์ และแนะนำการตอบ โดยฝึกจากข้อมูลธุรกิจของคุณ
            </p>
          </div>
          <span className="badge badge-blue">เร็วๆ นี้</span>
        </div>
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center opacity-70">
          <p className="text-2xl font-bold text-[var(--text-primary)]">฿0.00</p>
          <p className="text-sm text-[var(--text-muted)]">ค่าใช้จ่ายเดือนนี้</p>
        </div>
        <div className="card p-4 text-center opacity-70">
          <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
          <p className="text-sm text-[var(--text-muted)]">Tokens ใช้ไป</p>
        </div>
        <div className="card p-4 text-center opacity-70">
          <p className="text-2xl font-bold text-[var(--text-primary)]">0</p>
          <p className="text-sm text-[var(--text-muted)]">AI ตอบกลับ</p>
        </div>
        <div className="card p-4 text-center opacity-70">
          <p className="text-2xl font-bold text-green-500">0%</p>
          <p className="text-sm text-[var(--text-muted)]">ความพึงพอใจ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge Base */}
        <div className="card overflow-hidden opacity-60 pointer-events-none">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)]">ฐานความรู้ (Knowledge Base)</h3>
            <button className="text-sm text-[var(--accent-primary)]">+ เพิ่ม</button>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {mockKnowledge.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                  <p className="text-sm text-[var(--text-muted)]">{item.items} รายการ • {item.lastUpdate}</p>
                </div>
                <span className="badge badge-gray">{item.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Memory */}
        <div className="card overflow-hidden opacity-60 pointer-events-none">
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)]">AI Memory</h3>
            <button className="text-sm text-[var(--accent-primary)]">+ เพิ่ม</button>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {mockMemory.map((item) => (
              <div key={item.key} className="p-4">
                <p className="text-sm font-medium text-[var(--accent-primary)] mb-1">{item.key}</p>
                <p className="text-[var(--text-secondary)]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="mt-8">
        <h3 className="section-title mb-4">ฟีเจอร์ AI ที่กำลังจะมา</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--text-primary)]">Draft Reply</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">AI ร่างข้อความตอบกลับให้ ตามโทนของธุรกิจ</p>
          </div>

          <div className="card p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--text-primary)]">สรุปแชท</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">สรุปประเด็นสำคัญจากบทสนทนายาวๆ</p>
          </div>

          <div className="card p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--text-primary)]">วิเคราะห์อารมณ์</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">ตรวจจับอารมณ์ลูกค้า แจ้งเตือนความเสี่ยง</p>
          </div>

          <div className="card p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--text-primary)]">Auto-Tag</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">ติด Tag อัตโนมัติตาม Intent</p>
          </div>

          <div className="card p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--text-primary)]">Risk Detection</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">แจ้งเตือนเมื่อมีความเสี่ยง</p>
          </div>

          <div className="card p-5 opacity-70">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <h4 className="font-semibold text-[var(--text-primary)]">RAG Training</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">ฝึก AI จากเอกสารของธุรกิจ</p>
          </div>
        </div>
      </div>
    </div>
  )
}
