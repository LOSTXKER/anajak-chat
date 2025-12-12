'use client'

import { useEffect, useState } from 'react'

const mockFiles = [
  { id: 1, name: 'ใบเสนอราคา-001.pdf', type: 'pdf', size: '2.4 MB', date: '12 ธ.ค. 2567', status: 'approved' },
  { id: 2, name: 'แบบเสื้อ-V3.jpg', type: 'image', size: '1.2 MB', date: '11 ธ.ค. 2567', status: 'pending' },
  { id: 3, name: 'รายละเอียดงาน.docx', type: 'doc', size: '890 KB', date: '10 ธ.ค. 2567', status: 'approved' },
  { id: 4, name: 'Invoice-2024-12.pdf', type: 'pdf', size: '1.8 MB', date: '9 ธ.ค. 2567', status: 'rejected' },
]

const fileTypeIcons: Record<string, JSX.Element> = {
  pdf: (
    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v7h6v9H6z"/>
      </svg>
    </div>
  ),
  image: (
    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
      <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    </div>
  ),
  doc: (
    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
  ),
}

const statusBadge: Record<string, JSX.Element> = {
  approved: <span className="badge badge-green">อนุมัติแล้ว</span>,
  pending: <span className="badge badge-orange">รอตรวจ</span>,
  rejected: <span className="badge badge-red">ไม่อนุมัติ</span>,
}

export default function FilesPage() {
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
          <h1 className="page-title">ไฟล์ & เอกสาร</h1>
          <p className="page-subtitle">จัดการไฟล์ทั้งหมด รวมถึงระบบอนุมัติเอกสาร</p>
        </div>
        <button disabled className="btn btn-primary opacity-50 cursor-not-allowed">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          อัปโหลด
        </button>
      </div>

      {/* Coming Soon Banner */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">ระบบไฟล์กำลังพัฒนา</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              เร็วๆ นี้คุณจะสามารถอัปโหลด จัดการ และอนุมัติไฟล์ได้โดยตรง รวมถึง Version Control และ Approval Flow
            </p>
          </div>
          <span className="badge badge-blue">เร็วๆ นี้</span>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 opacity-70">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <h4 className="font-medium text-[var(--text-primary)] mb-1">อัปโหลดง่าย</h4>
          <p className="text-sm text-[var(--text-secondary)]">ลากวางหรือเลือกไฟล์ รองรับทุกประเภท</p>
        </div>
        <div className="card p-5 opacity-70">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h4 className="font-medium text-[var(--text-primary)] mb-1">อนุมัติเอกสาร</h4>
          <p className="text-sm text-[var(--text-secondary)]">ส่งให้ลูกค้าอนุมัติ พร้อม Log</p>
        </div>
        <div className="card p-5 opacity-70">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-medium text-[var(--text-primary)] mb-1">Version History</h4>
          <p className="text-sm text-[var(--text-secondary)]">ดูประวัติ แก้ไข กู้คืนได้ทุกเวอร์ชัน</p>
        </div>
      </div>

      {/* Mock File List */}
      <div className="card overflow-hidden opacity-60 pointer-events-none">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h3 className="font-medium text-[var(--text-primary)]">ไฟล์ล่าสุด (ตัวอย่าง)</h3>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {mockFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors">
              {fileTypeIcons[file.type]}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{file.size} • {file.date}</p>
              </div>
              {statusBadge[file.status]}
              <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
