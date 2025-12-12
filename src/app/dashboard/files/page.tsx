'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

const mockFiles = [
  { 
    id: 1, 
    name: 'ใบเสนอราคา-001.pdf', 
    type: 'pdf', 
    size: '2.4 MB', 
    date: '12 ธ.ค. 2567 14:30',
    status: 'approved',
    uploadedBy: 'คุณสมชาย',
    version: 'v3',
    approver: 'ลูกค้า A',
    conversation: 'คุยกับ B\'Best'
  },
  { 
    id: 2, 
    name: 'แบบเสื้อ-V3.jpg', 
    type: 'image', 
    size: '1.2 MB', 
    date: '11 ธ.ค. 2567 10:15',
    status: 'pending',
    uploadedBy: 'คุณสมหญิง',
    version: 'v3',
    approver: null,
    conversation: 'คุยกับลูกค้า C'
  },
  { 
    id: 3, 
    name: 'รายละเอียดงาน.docx', 
    type: 'doc', 
    size: '890 KB', 
    date: '10 ธ.ค. 2567 16:45',
    status: 'approved',
    uploadedBy: 'คุณสมศรี',
    version: 'v1',
    approver: 'ลูกค้า B',
    conversation: null
  },
  { 
    id: 4, 
    name: 'Invoice-2024-12.pdf', 
    type: 'pdf', 
    size: '1.8 MB', 
    date: '9 ธ.ค. 2567 09:00',
    status: 'rejected',
    uploadedBy: 'คุณสมชาย',
    version: 'v2',
    approver: 'ลูกค้า A',
    conversation: 'คุยกับลูกค้า A'
  },
]

const fileTypeIcons: Record<string, { icon: JSX.Element; color: string }> = {
  pdf: {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v7h6v9H6z"/>
      </svg>
    ),
    color: 'bg-red-100 dark:bg-red-900/30 text-red-500'
  },
  image: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-500'
  },
  doc: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
  },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  approved: { label: 'อนุมัติ', color: 'badge-green' },
  pending: { label: 'รอตรวจ', color: 'badge-orange' },
  rejected: { label: 'ไม่อนุมัติ', color: 'badge-red' },
}

export default function FilesPage() {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [selectedFile, setSelectedFile] = useState<typeof mockFiles[0] | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const filteredFiles = filter === 'all' 
    ? mockFiles 
    : mockFiles.filter(f => f.status === filter)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-secondary)]">
      <Navbar title="ไฟล์ & เอกสาร" />

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">จัดการไฟล์ อนุมัติเอกสาร และ Version Control</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded ${view === 'grid' ? 'bg-[var(--bg-primary)] shadow-sm' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded ${view === 'list' ? 'bg-[var(--bg-primary)] shadow-sm' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </button>
            </div>
            <button disabled className="btn btn-primary opacity-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              อัปโหลด
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{mockFiles.length}</p>
            <p className="text-xs text-[var(--text-muted)]">ไฟล์ทั้งหมด</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{mockFiles.filter(f => f.status === 'approved').length}</p>
            <p className="text-xs text-[var(--text-muted)]">อนุมัติแล้ว</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{mockFiles.filter(f => f.status === 'pending').length}</p>
            <p className="text-xs text-[var(--text-muted)]">รอตรวจสอบ</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">8.3 MB</p>
            <p className="text-xs text-[var(--text-muted)]">ใช้ไปแล้ว</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${filter === f 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
            >
              {f === 'all' ? 'ทั้งหมด' : statusConfig[f]?.label || f}
            </button>
          ))}
        </div>

        {/* File List */}
        {view === 'list' ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)] text-xs font-medium text-[var(--text-muted)] uppercase">
                <tr>
                  <th className="text-left p-3">ชื่อไฟล์</th>
                  <th className="text-left p-3">ขนาด</th>
                  <th className="text-left p-3">อัปโหลดโดย</th>
                  <th className="text-left p-3">วันที่</th>
                  <th className="text-left p-3">สถานะ</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredFiles.map((file) => {
                  const fileType = fileTypeIcons[file.type]
                  return (
                    <tr 
                      key={file.id} 
                      className="hover:bg-[var(--bg-hover)] cursor-pointer"
                      onClick={() => setSelectedFile(file)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${fileType.color} flex items-center justify-center`}>
                            {fileType.icon}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)] text-sm">{file.name}</p>
                            {file.version && (
                              <p className="text-xs text-[var(--text-muted)]">{file.version}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-[var(--text-secondary)]">{file.size}</td>
                      <td className="p-3 text-sm text-[var(--text-secondary)]">{file.uploadedBy}</td>
                      <td className="p-3 text-sm text-[var(--text-secondary)]">{file.date}</td>
                      <td className="p-3">
                        <span className={`badge ${statusConfig[file.status].color}`}>
                          {statusConfig[file.status].label}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
                          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => {
              const fileType = fileTypeIcons[file.type]
              return (
                <div 
                  key={file.id} 
                  className="card p-4 hover:shadow-lg cursor-pointer"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className={`w-full aspect-square rounded-xl ${fileType.color} flex items-center justify-center mb-3`}>
                    {fileType.icon}
                  </div>
                  <p className="font-medium text-sm text-[var(--text-primary)] truncate mb-1">{file.name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">{file.size}</span>
                    <span className={`badge ${statusConfig[file.status].color}`}>
                      {statusConfig[file.status].label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--bg-hover)] z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* File Preview */}
            <div className="h-64 bg-[var(--bg-tertiary)] rounded-t-xl flex items-center justify-center">
              <div className={`w-20 h-20 rounded-2xl ${fileTypeIcons[selectedFile.type].color} flex items-center justify-center`}>
                {fileTypeIcons[selectedFile.type].icon}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">{selectedFile.name}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{selectedFile.size} • {selectedFile.date}</p>
                </div>
                <span className={`badge ${statusConfig[selectedFile.status].color}`}>
                  {statusConfig[selectedFile.status].label}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)] mb-1">อัปโหลดโดย</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.uploadedBy}</p>
                </div>
                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)] mb-1">เวอร์ชัน</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.version}</p>
                </div>
                {selectedFile.approver && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)] mb-1">อนุมัติโดย</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.approver}</p>
                  </div>
                )}
                {selectedFile.conversation && (
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)] mb-1">เกี่ยวข้องกับ</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.conversation}</p>
                  </div>
                )}
              </div>

              {/* Version History */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">ประวัติเวอร์ชัน</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">v3 (ปัจจุบัน)</p>
                      <p className="text-xs text-[var(--text-muted)]">{selectedFile.date}</p>
                    </div>
                    <button className="text-xs text-[var(--accent-primary)] font-medium">ดาวน์โหลด</button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg opacity-60">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">v2</p>
                      <p className="text-xs text-[var(--text-muted)]">10 ธ.ค. 2567</p>
                    </div>
                    <button className="text-xs text-[var(--accent-primary)] font-medium">ดาวน์โหลด</button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 btn btn-secondary">ดาวน์โหลด</button>
                <button className="flex-1 btn btn-primary">ส่งให้ลูกค้าอนุมัติ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
