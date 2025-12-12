'use client'

import { Brain, Sparkles, BookOpen, Settings } from 'lucide-react'

export default function AICenterPage() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Center</h1>
          <p className="text-gray-600 dark:text-gray-400">
            จัดการและฝึกสอน AI ให้เหมาะกับธุรกิจของคุณ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Knowledge Base */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Knowledge Base
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              อัปโหลดเอกสาร FAQ และข้อมูลเพื่อให้ AI เรียนรู้
            </p>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              จัดการ Knowledge Base →
            </button>
          </div>

          {/* AI Training */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              AI Training
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              ฝึกสอน AI จากบทสนทนาและ feedback
            </p>
            <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
              เริ่มฝึกสอน →
            </button>
          </div>

          {/* AI Memory */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              AI Memory
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              จัดการความจำและนโยบายของ AI
            </p>
            <button className="text-sm text-green-600 dark:text-green-400 hover:underline">
              จัดการ Memory →
            </button>
          </div>

          {/* Model Settings */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
              <Settings className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Model Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              ตั้งค่า API และเลือก AI model
            </p>
            <button className="text-sm text-orange-600 dark:text-orange-400 hover:underline">
              ตั้งค่า →
            </button>
          </div>
        </div>

        {/* AI Usage Stats */}
        <div className="mt-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">AI Usage This Month</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-90">Total Requests</p>
              <p className="text-3xl font-bold">1,234</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Tokens Used</p>
              <p className="text-3xl font-bold">45.2K</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Cost</p>
              <p className="text-3xl font-bold">฿120</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

