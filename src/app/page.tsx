'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }

  const features = [
    { icon: '💬', title: 'รวมแชททุกช่องทาง', desc: 'LINE, Facebook, Instagram ในที่เดียว' },
    { icon: '👥', title: 'จัดการลูกค้า', desc: 'ประวัติลูกค้าและการสนทนาครบถ้วน' },
    { icon: '📊', title: 'วิเคราะห์ข้อมูล', desc: 'สถิติและรายงานเพื่อพัฒนาธุรกิจ' },
    { icon: '🤖', title: 'ระบบอัตโนมัติ', desc: 'ตอบกลับอัตโนมัติ 24 ชั่วโมง' },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-default">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg text-[var(--text-primary)]">Anajak</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-medium
                  hover:bg-[var(--accent-hover)] transition-colors"
              >
                เข้าสู่ Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-sm font-medium
                    hover:bg-[var(--accent-hover)] transition-colors"
                >
                  เริ่มใช้งานฟรี
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight">
            จัดการแชทธุรกิจ<br />
            <span className="text-[var(--accent-primary)]">ง่าย รวดเร็ว ครบจบ</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            รวมแชทจาก LINE, Facebook และช่องทางอื่นๆ ไว้ในที่เดียว
            พร้อมระบบจัดการลูกค้าและวิเคราะห์ข้อมูลครบวงจร
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-[var(--accent-primary)] text-white rounded-xl text-lg font-medium
                hover:bg-[var(--accent-hover)] transition-colors shadow-lg shadow-blue-500/20"
            >
              เริ่มใช้งานฟรี
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl text-lg font-medium
                hover:bg-[var(--bg-hover)] transition-colors border border-default"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-bold text-center text-[var(--text-primary)] mb-12">
            ฟีเจอร์ที่ช่วยให้ธุรกิจคุณเติบโต
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card p-6 text-center hover:shadow-soft transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-4">
            พร้อมเริ่มต้นแล้วหรือยัง?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            สมัครใช้งานฟรี ไม่ต้องใช้บัตรเครดิต
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-[var(--accent-primary)] text-white rounded-xl text-lg font-medium
              hover:bg-[var(--accent-hover)] transition-colors"
          >
            สร้างบัญชีฟรี
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-default">
        <div className="max-w-6xl mx-auto text-center text-sm text-[var(--text-muted)]">
          © 2024 Anajak Chat. พัฒนาด้วย ❤️ สำหรับธุรกิจไทย
        </div>
      </footer>
    </div>
  )
}
