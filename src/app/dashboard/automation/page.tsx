'use client'

import { Zap, Plus } from 'lucide-react'

export default function AutomationPage() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Zap size={64} className="mx-auto mb-4 text-yellow-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Automation</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          สร้างระบบอัตโนมัติและ workflow เพื่อเพิ่มประสิทธิภาพการทำงาน
        </p>
        <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors">
          <Plus size={20} />
          สร้าง Automation
        </button>
      </div>
    </div>
  )
}

