import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Home, Calendar, FileText, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const { guest, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Booking', href: '/booking', icon: Calendar },
    { name: 'Check-in/out', href: '/checkin-checkout', icon: Settings },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Admin', href: '/admin', icon: Settings },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Hotel Platform</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {guest?.first_name} {guest?.last_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <div>
                    <p className="font-medium">{guest?.first_name} {guest?.last_name}</p>
                    <p className="text-sm text-gray-500">{guest?.email}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="flex items-center space-x-2 text-red-600">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
