'use client'

import { useState } from 'react'
import { Search, Filter, Clock, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { Database } from '@/types/database.types'

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  contact: Database['public']['Tables']['contacts']['Row']
  channel: Database['public']['Tables']['channels']['Row']
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contact.phone?.includes(searchQuery)

    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return ''
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400'
      case 'high':
        return 'text-orange-600 dark:text-orange-400'
      case 'medium':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      open: { label: 'เปิด', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      claimed: { label: 'รับแล้ว', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      resolved: { label: 'แก้ไขแล้ว', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      archived: { label: 'เก็บถาวร', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    return badges[status] || badges.open
  }

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Inbox
        </h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="ค้นหาข้อความ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {['all', 'open', 'claimed', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' ? 'ทั้งหมด' : getStatusBadge(status).label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MessageSquareIcon className="mx-auto mb-2" size={48} />
            <p>ไม่มีข้อความ</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id
              const statusBadge = getStatusBadge(conversation.status)
              const timeAgo = conversation.last_message_at
                ? formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                    locale: th,
                  })
                : formatDistanceToNow(new Date(conversation.created_at), {
                    addSuffix: true,
                    locale: th,
                  })

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {conversation.contact.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {conversation.contact.name || 'Unknown'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.channel.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {timeAgo}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    {conversation.priority !== 'low' && conversation.priority !== 'medium' && (
                      <span className={`text-xs font-semibold ${getPriorityColor(conversation.priority)}`}>
                        {conversation.priority === 'urgent' ? 'ด่วนมาก' : 'สำคัญ'}
                      </span>
                    )}
                    {conversation.risk_level !== 'none' && (
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getRiskBadgeColor(conversation.risk_level)}`}>
                        <AlertCircle size={12} />
                        เสี่ยง
                      </span>
                    )}
                    {conversation.sla_due_at && new Date(conversation.sla_due_at) < new Date() && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-1">
                        <Clock size={12} />
                        เกิน SLA
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageSquareIcon({ className, size }: { className?: string; size: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  )
}

