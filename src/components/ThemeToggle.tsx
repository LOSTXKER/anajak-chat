 'use client'
 
 import { useEffect, useState } from 'react'
 import { Moon, Sun } from 'lucide-react'
 
 type Theme = 'light' | 'dark'
 
 function getPreferredTheme(): Theme {
   if (typeof window === 'undefined') return 'light'
   const saved = window.localStorage.getItem('theme') as Theme | null
   if (saved === 'light' || saved === 'dark') return saved
   return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
 }
 
 function applyTheme(theme: Theme) {
   const root = document.documentElement
   if (theme === 'dark') root.classList.add('dark')
   else root.classList.remove('dark')
 }
 
 export default function ThemeToggle() {
   const [theme, setTheme] = useState<Theme>('light')
 
   useEffect(() => {
     const t = getPreferredTheme()
     setTheme(t)
     applyTheme(t)
   }, [])
 
   const toggle = () => {
     const next: Theme = theme === 'dark' ? 'light' : 'dark'
     setTheme(next)
     window.localStorage.setItem('theme', next)
     applyTheme(next)
   }
 
   const isDark = theme === 'dark'
 
   return (
     <button
       type="button"
       onClick={toggle}
       className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
       title={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
       aria-label="สลับธีม"
     >
       {isDark ? <Moon size={18} /> : <Sun size={18} />}
       <span className="hidden sm:inline">{isDark ? 'โหมดมืด' : 'โหมดสว่าง'}</span>
     </button>
   )
 }


