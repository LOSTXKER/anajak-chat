'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) throw authError

      if (authData.user) {
        // Create business using RPC function
        const businessSlug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        
        const { error: rpcError } = await supabase.rpc('create_business_with_owner', {
          business_name: businessName,
          business_slug: businessSlug,
          user_id: authData.user.id
        } as never)

        if (rpcError) {
          console.error('Error creating business:', rpcError)
        }

        // Check if email confirmation is required
        if (authData.session) {
          router.push('/dashboard')
        } else {
          setSuccess(true)
        }
      }
    } catch (err) {
      console.error('Registration error:', err)
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          setError('อีเมลนี้ถูกใช้งานแล้ว')
        } else {
          setError(err.message)
        }
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--success)]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">สมัครสมาชิกสำเร็จ!</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี
          </p>
          <Link href="/login" className="btn btn-primary">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-secondary)]">
      {/* Left - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-white/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            เริ่มต้นใช้งานวันนี้
          </h2>
          <p className="text-white/80">
            สร้างบัญชีฟรี เชื่อมต่อช่องทางแชท และเริ่มจัดการธุรกิจได้ทันที
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-semibold text-xl text-[var(--text-primary)]">Anajak</span>
          </Link>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            สร้างบัญชีใหม่
          </h1>
          <p className="text-[var(--text-secondary)] mb-8">
            เริ่มจัดการแชทธุรกิจได้ใน 2 นาที
          </p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                ชื่อธุรกิจ
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="เช่น ร้านกาแฟลุงตู่"
                className="w-full px-4 py-3 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full px-4 py-3 rounded-xl"
                minLength={6}
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20">
                <p className="text-sm text-[var(--error)]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'สร้างบัญชี'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            การสมัครถือว่าคุณยอมรับ{' '}
            <a href="#" className="text-[var(--accent-primary)] hover:underline">เงื่อนไขการใช้งาน</a>
            {' '}และ{' '}
            <a href="#" className="text-[var(--accent-primary)] hover:underline">นโยบายความเป็นส่วนตัว</a>
          </p>

          <div className="mt-8 text-center">
            <p className="text-[var(--text-secondary)]">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/login" className="text-[var(--accent-primary)] font-medium hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
