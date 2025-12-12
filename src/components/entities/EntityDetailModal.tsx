'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Edit, Trash, Calendar, DollarSign, User, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Database } from '@/types/database.types'

type Entity = Database['public']['Tables']['entities']['Row'] & {
  contact?: Database['public']['Tables']['contacts']['Row']
}

interface EntityDetailModalProps {
  entity: Entity
  onClose: () => void
  onUpdate: () => void
}

export default function EntityDetailModal({ entity, onClose, onUpdate }: EntityDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'notes'>('overview')
  const [editing, setEditing] = useState(false)

  const handleDelete = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบงานนี้?')) return

    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entity.id)

      if (error) throw error

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error deleting entity:', error)
      alert('เกิดข้อผิดพลาดในการลบงาน')
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(entity.status)}`}>
                {entity.status}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(entity.priority)}`}>
                {entity.priority}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                {entity.type}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {entity.title}
            </h2>
            {entity.value && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <DollarSign size={20} />
                <span className="text-xl font-bold">
                  {entity.value.toLocaleString()} {entity.currency || 'THB'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <Edit size={20} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
            >
              <Trash size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Notes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              {entity.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    รายละเอียด
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {entity.description}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                {entity.contact && (
                  <div className="flex items-start gap-3">
                    <User size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ผู้ติดต่อ</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{entity.contact.name}</p>
                    </div>
                  </div>
                )}

                {entity.due_date && (
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">กำหนดส่ง</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(entity.due_date), 'PPP', { locale: th })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">สร้างเมื่อ</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(entity.created_at), 'PPP', { locale: th })}
                    </p>
                  </div>
                </div>

                {entity.completed_at && (
                  <div className="flex items-start gap-3">
                    <Calendar size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">เสร็จสิ้นเมื่อ</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(entity.completed_at), 'PPP', { locale: th })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {entity.tags && entity.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">แท็ก</h3>
                  <div className="flex flex-wrap gap-2">
                    {entity.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Tasks feature coming soon...</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Notes feature coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

