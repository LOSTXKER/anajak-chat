'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Register user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ')
        } else {
          setError(authError.message)
        }
        return
      }

      if (authData.user) {
        // Create business
        const slug = businessName.toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-')
        const { error: businessError } = await supabase
          .rpc('create_business_with_owner', {
            business_name: businessName,
            business_slug: slug,
            user_id: authData.user.id,
          } as any)

        if (businessError) {
          console.error('Business creation error:', businessError)
        }

        setSuccess(true)
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)]">
        <div className="w-full max-w-sm text-center">
          <div className="card p-8">
            <div className="text-5xl mb-4">✉️</div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              ตรวจสอบอีเมลของคุณ
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              เราส่งลิงก์ยืนยันไปที่<br />
              <span className="font-medium text-[var(--text-primary)]">{email}</span>
            </p>
            <Link 
              href="/login"
              className="inline-block w-full py-2.5 bg-[var(--accent-primary)] text-white rounded-lg
                font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent-primary)] mb-4">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            สร้างบัญชี
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            เริ่มต้นใช้งานฟรี
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="card p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              ชื่อธุรกิจ
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="ชื่อร้านหรือธุรกิจของคุณ"
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              อีเมล
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--accent-primary)] text-white rounded-lg
              font-medium text-sm disabled:opacity-50 hover:bg-[var(--accent-hover)] transition-colors"
          >
            {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-sm text-[var(--text-secondary)]">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-[var(--accent-primary)] font-medium hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  )
}
