'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Filter, MoreVertical, User, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Database } from '@/types/database.types'
import CreateEntityModal from '@/components/entities/CreateEntityModal'
import EntityDetailModal from '@/components/entities/EntityDetailModal'

type Entity = Database['public']['Tables']['entities']['Row'] & {
  owner?: { id: string; email?: string }
  contact?: Database['public']['Tables']['contacts']['Row']
}

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)

  useEffect(() => {
    loadEntities()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('entities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
        },
        () => {
          loadEntities()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    filterEntities()
  }, [entities, searchQuery, statusFilter, typeFilter])

  const loadEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('entities')
        .select(`
          *,
          contact:contacts(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setEntities(data as Entity[])
    } catch (error) {
      console.error('Error loading entities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEntities = () => {
    let filtered = entities

    if (searchQuery) {
      filtered = filtered.filter((entity) =>
        entity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((entity) => entity.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((entity) => entity.type === typeFilter)
    }

    setFilteredEntities(filtered)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      won: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    }
    return colors[status] || colors.new
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดงาน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entities</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            สร้างงานใหม่
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="ค้นหางาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">ทุกประเภท</option>
            <option value="deal">Deal</option>
            <option value="ticket">Ticket</option>
            <option value="work">Work</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="new">ใหม่</option>
            <option value="in_progress">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="won">ปิดการขาย</option>
            <option value="lost">ไม่สำเร็จ</option>
          </select>
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredEntities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="mb-4">📦</div>
              <p className="text-lg">ไม่พบงาน</p>
              <p className="text-sm mt-2">ลองค้นหาด้วยคำอื่นหรือสร้างงานใหม่</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntities.map((entity) => (
              <div
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(entity.status)}`}>
                        {entity.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(entity.priority)}`}>
                        {entity.priority}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {entity.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {entity.type}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Description */}
                {entity.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {entity.description}
                  </p>
                )}

                {/* Value */}
                {entity.value && (
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-green-600 dark:text-green-400" />
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {entity.value.toLocaleString()} {entity.currency || 'THB'}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {entity.contact && (
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span className="truncate">{entity.contact.name}</span>
                    </div>
                  )}
                  {entity.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{format(new Date(entity.due_date), 'd MMM', { locale: th })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEntityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadEntities()
          }}
        />
      )}

      {selectedEntity && (
        <EntityDetailModal
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
          onUpdate={loadEntities}
        />
      )}
    </div>
  )
}

