export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
          Anajak Chat
        </h1>
        <p className="text-2xl text-gray-600 dark:text-gray-300">
          Multi-Business Communication Platform
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
          Business Communication OS - รวมแชททุกช่องทาง เปลี่ยนบทสนทนา → งาน → รายได้ → Insight
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            เข้าสู่ระบบ
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
          >
            ลงทะเบียน
          </a>
        </div>
      </div>
    </div>
  )
}

