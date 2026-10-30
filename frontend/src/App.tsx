import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ThemeProvider } from '@/features/theme/ThemeContext'
import { Toaster } from '@/components/ui/toaster'
import AppRoutes from '@/routes/AppRoutes'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
