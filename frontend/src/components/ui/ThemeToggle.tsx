import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/features/theme/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-200',
        'text-secondary hover:bg-muted hover:text-foreground',
        className
      )}
    >
      {/* Animated icon swap */}
      <span className="relative w-4 h-4 flex-shrink-0">
        <Sun
          className={cn(
            'absolute inset-0 w-4 h-4 transition-all duration-300',
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 w-4 h-4 transition-all duration-300',
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          )}
        />
      </span>
      {showLabel && (
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      )}
    </button>
  )
}
