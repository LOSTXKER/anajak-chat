'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Entity {
  id: string
  type: string
  title: string
  status: string
  value: number | null
  due_date: string | null
  contact_id: string | null
  created_at: string
  contact?: {
    name: string
  }
}

const statusConfig: Record<string, { label: string; class: string }> = {
  'new': { label: 'ใหม่', class: 'badge-blue' },
  'in_progress': { label: 'กำลังดำเนินการ', class: 'badge-orange' },
  'pending': { label: 'รอดำเนินการ', class: 'badge-gray' },
  'completed': { label: 'เสร็จสิ้น', class: 'badge-green' },
  'cancelled': { label: 'ยกเลิก', class: 'badge-red' },
}

const typeConfig: Record<string, { label: string; icon: JSX.Element }> = {
  'deal': {
    label: 'ดีล',
    icon: (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  'order': {
    label: 'ออเดอร์',
    icon: (
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  'ticket': {
    label: 'ตั๋ว',
    icon: (
      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
  'task': {
    label: 'งาน',
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)

  const loadEntities = useCallback(async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) return

      const bizRes = await fetch('/api/user/business', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const bizData = await bizRes.json()
      if (!bizData.businessId) return

      let query = supabase
        .from('entities')
        .select('*, contact:contacts(name)')
        .eq('business_id', bizData.businessId)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('type', filter)
      }

      const { data } = await query
      setEntities((data as Entity[]) || [])
    } catch (error) {
      console.error('Error loading entities:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadEntities()
  }, [loadEntities])

  const filteredEntities = entities.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">งาน & ดีล</h1>
          <p className="page-subtitle">จัดการงาน ออเดอร์ และดีลทั้งหมด</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          สร้างใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'deal', 'order', 'ticket', 'task'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all-200
                ${filter === type 
                  ? 'bg-[var(--accent-primary)] text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
            >
              {type === 'all' ? 'ทั้งหมด' : typeConfig[type]?.label || type}
            </button>
          ))}
        </div>
      </div>

      {/* Entity List */}
      {filteredEntities.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-2">ยังไม่มีงาน</h3>
          <p className="text-[var(--text-muted)] mb-4">สร้างงาน ดีล หรือออเดอร์แรกของคุณ</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            สร้างใหม่
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[var(--border-color)]">
            {filteredEntities.map((entity) => (
              <div key={entity.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                  {typeConfig[entity.type]?.icon || (
                    <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--text-primary)] truncate">{entity.title}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {entity.contact?.name || 'ไม่มีผู้ติดต่อ'}
                    {entity.due_date && ` • ครบ ${new Date(entity.due_date).toLocaleDateString('th-TH')}`}
                  </p>
                </div>
                {entity.value && (
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold text-[var(--text-primary)]">
                      ฿{entity.value.toLocaleString()}
                    </p>
                  </div>
                )}
                <span className={`badge ${statusConfig[entity.status]?.class || 'badge-gray'}`}>
                  {statusConfig[entity.status]?.label || entity.status}
                </span>
                <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
                  <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <span className="badge badge-gray">เร็วๆ นี้</span>
          </div>
          <h4 className="font-medium text-[var(--text-primary)] mb-1">Kanban Board</h4>
          <p className="text-sm text-[var(--text-secondary)]">ลากวาง เปลี่ยนสถานะง่ายๆ</p>
        </div>

        <div className="card p-5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <span className="badge badge-gray">เร็วๆ นี้</span>
          </div>
          <h4 className="font-medium text-[var(--text-primary)] mb-1">ปฏิทิน</h4>
          <p className="text-sm text-[var(--text-secondary)]">ดูงานตาม Due Date</p>
        </div>

        <div className="card p-5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            </div>
            <span className="badge badge-gray">เร็วๆ นี้</span>
          </div>
          <h4 className="font-medium text-[var(--text-primary)] mb-1">Workflow</h4>
          <p className="text-sm text-[var(--text-secondary)]">เปลี่ยนสถานะอัตโนมัติ</p>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <CreateEntityModal onClose={() => setShowModal(false)} onSuccess={loadEntities} />
      )}
    </div>
  )
}

// Create Entity Modal
function CreateEntityModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState('deal')
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) return

      const bizRes = await fetch('/api/user/business', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const bizData = await bizRes.json()
      if (!bizData.businessId) return

      await supabase.from('entities').insert({
        business_id: bizData.businessId,
        type,
        title,
        value: value ? parseFloat(value) : null,
        status: 'new',
      } as never)

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating entity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">สร้างงานใหม่</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">ประเภท</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(typeConfig).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`p-3 rounded-xl text-center transition-all-200
                    ${type === key 
                      ? 'bg-[var(--accent-primary)] text-white' 
                      : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'
                    }`}
                >
                  <div className="flex justify-center mb-1">{config.icon}</div>
                  <span className="text-xs">{config.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">ชื่องาน</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ใส่ชื่องาน..."
              className="w-full px-4 py-2.5"
              required
            />
          </div>
          {(type === 'deal' || type === 'order') && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">มูลค่า (บาท)</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5"
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              ยกเลิก
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'กำลังสร้าง...' : 'สร้าง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
