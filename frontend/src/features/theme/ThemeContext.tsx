import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    return stored ?? 'system'
  })

  const getSystemTheme = (): 'dark' | 'light' =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  const resolvedTheme: 'dark' | 'light' =
    theme === 'system' ? getSystemTheme() : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.classList.remove('dark', 'light')
      document.documentElement.classList.add(getSystemTheme())
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem('theme', next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
