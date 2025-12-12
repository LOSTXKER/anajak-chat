'use client'

import { FileText, Upload } from 'lucide-react'

export default function FilesPage() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <FileText size={64} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Files & Approval</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Feature ระบบไฟล์และการอนุมัติกำลังพัฒนา
        </p>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors">
          <Upload size={20} />
          อัปโหลดไฟล์
        </button>
      </div>
    </div>
  )
}

