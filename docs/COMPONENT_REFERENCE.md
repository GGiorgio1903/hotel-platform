# Hotel Platform Frontend Component Reference

## Overview

The Hotel Platform frontend is built with React 18, TypeScript, and Vite. It uses Tailwind CSS for styling and shadcn/ui for component library. The application follows a modern React architecture with hooks, contexts, and functional components.

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling  
- Tailwind CSS for styling
- shadcn/ui component library
- React Router for navigation
- Lucide React for icons

## Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── Header.tsx      # Main navigation component
├── pages/              # Page components (routes)
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── assets/             # Static assets
```

## Core Components

### Header Component

The main navigation header component providing site navigation and user authentication controls.

**File:** `src/components/Header.tsx`

```typescript
interface HeaderProps {
  // No props required - uses authentication context
}

function Header(): JSX.Element
```

**Features:**
- Responsive navigation menu
- User authentication state display
- Logo and branding
- Dropdown menu for user actions
- Mobile-friendly hamburger menu

**Dependencies:**
- `useAuth()` hook for authentication state
- React Router for navigation
- Lucide React icons

**Usage:**
```tsx
import { Header } from '@/components/Header'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{/* Page content */}</main>
    </div>
  )
}
```

**Navigation Items:**
- Dashboard (`/`) - Home page with booking overview
- Booking (`/booking`) - Create and manage bookings  
- Check-in/out (`/checkin-checkout`) - Digital room access
- Documents (`/documents`) - Identity document upload
- Admin (`/admin`) - Administrative functions

## Page Components

### LoginPage

Authentication page with OTP-based login system.

**File:** `src/pages/LoginPage.tsx`

```typescript
interface LoginPageProps {
  // No props - standalone page component
}

function LoginPage(): JSX.Element
```

**Features:**
- Email input for OTP request
- OTP verification form
- Automatic redirect after successful login
- Error handling and user feedback
- Link to registration page

**State Management:**
- Local state for form inputs
- `useAuth()` context for authentication actions
- Form validation and submission handling

**Usage:**
- Rendered by React Router at `/login`
- Automatically redirects authenticated users
- Entry point for guest authentication flow

### RegisterPage

Guest registration page for creating new accounts.

**File:** `src/pages/RegisterPage.tsx`

```typescript
interface RegisterPageProps {
  // No props - standalone page component  
}

function RegisterPage(): JSX.Element
```

**Features:**
- Guest information form (name, email, phone)
- Input validation and error handling
- Automatic login after successful registration
- Link to login page for existing users

**Form Fields:**
- `first_name`: Guest's first name (required)
- `last_name`: Guest's last name (required)
- `email`: Email address (required, validated)
- `phone`: Phone number (required)

### DashboardPage

Main dashboard showing guest's booking overview and account information.

**File:** `src/pages/DashboardPage.tsx`

```typescript
interface DashboardPageProps {
  // No props - uses authentication context
}

function DashboardPage(): JSX.Element
```

**Features:**
- Welcome message with guest name
- Current bookings display
- Booking status indicators
- Quick action buttons
- Responsive card layout

**Data Sources:**
- Guest information from `useAuth()` context
- Booking data from API calls
- Real-time status updates

### BookingPage

Booking creation and management interface.

**File:** `src/pages/BookingPage.tsx`

```typescript
interface BookingPageProps {
  // No props - standalone page component
}

function BookingPage(): JSX.Element
```

**Features:**
- Room selection interface
- Date picker for check-in/check-out
- Price calculation
- Special requests input
- Booking form validation
- Integration with payment flow

**Booking Flow:**
1. Select room number
2. Choose check-in/check-out dates
3. Add special requests (optional)
4. Review booking details
5. Proceed to payment

### PaymentPage

Stripe-powered payment processing interface.

**File:** `src/pages/PaymentPage.tsx`

```typescript
interface PaymentPageProps {
  // No props - uses URL parameters for booking ID
}

function PaymentPage(): JSX.Element
```

**Features:**
- Stripe Elements integration
- Payment form with card input
- Booking summary display
- Payment confirmation handling
- Error handling and retry logic

**Payment Flow:**
1. Display booking summary
2. Collect payment information
3. Process payment with Stripe
4. Confirm payment with backend
5. Redirect to confirmation

### DocumentsPage

Document upload and management interface for identity verification.

**File:** `src/pages/DocumentsPage.tsx`

```typescript
interface DocumentsPageProps {
  // No props - uses authentication context
}

function DocumentsPage(): JSX.Element
```

**Features:**
- File upload with drag & drop
- Document type selection
- File type validation (PDF, images)
- Upload progress indicators
- Document list display
- File preview capabilities

**Supported Document Types:**
- Passport
- ID Card  
- Driver's License

**File Restrictions:**
- Max size: 10MB per file
- Formats: PDF, JPG, PNG, JPEG
- Virus scanning (if configured)

### CheckInOutPage

Digital check-in and check-out interface with smart lock integration.

**File:** `src/pages/CheckInOutPage.tsx`

```typescript
interface CheckInOutPageProps {
  // No props - uses authentication context
}

function CheckInOutPage(): JSX.Element
```

**Features:**
- Booking selection for check-in/out
- Room access status display
- Smart lock control interface
- QR code generation (if applicable)
- Status updates and notifications

**Check-in Requirements:**
- Booking must be confirmed
- Payment must be completed
- Valid identity document uploaded

**Check-out Process:**
- Automatic room lock
- Checkout confirmation
- Final bill generation

### AdminPage

Administrative interface for hotel staff.

**File:** `src/pages/AdminPage.tsx`

```typescript
interface AdminPageProps {
  // No props - admin access component
}

function AdminPage(): JSX.Element
```

**Features:**
- Guest management interface
- Booking overview and management
- Payment transaction history
- Document review interface
- System statistics dashboard
- Data export capabilities

**Admin Functions:**
- View all guests and bookings
- Manage booking statuses
- Review uploaded documents
- Process refunds
- Generate reports

## React Contexts

### AuthContext

Provides authentication state and methods throughout the application.

**File:** `src/contexts/AuthContext.tsx`

```typescript
interface Guest {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  created_at: string
}

interface AuthContextType {
  isAuthenticated: boolean
  guest: Guest | null
  loading: boolean
  login: (email: string, otp: string) => Promise<boolean>
  logout: () => void
  requestOTP: (email: string) => Promise<boolean>
}

function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element
function useAuth(): AuthContextType
```

**State Properties:**
- `isAuthenticated`: Boolean indicating if user is logged in
- `guest`: Current guest object or null
- `loading`: Boolean for initial authentication check

**Methods:**
- `requestOTP(email)`: Request OTP for authentication
- `login(email, otp)`: Verify OTP and authenticate user
- `logout()`: Clear authentication state and tokens

**Usage:**
```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { isAuthenticated, guest, login, logout } = useAuth()
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {guest?.first_name}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  )
}
```

**Token Management:**
- Stores JWT token in localStorage
- Automatically validates token on app startup
- Handles token expiration and cleanup

## Custom Hooks

### useToast

Toast notification hook for user feedback and alerts.

**File:** `src/hooks/use-toast.ts`

```typescript
interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: 'default' | 'destructive'
}

interface ToastFunction {
  (props: Omit<ToastProps, 'id'>): { id: string; dismiss: () => void; update: (props: ToasterToast) => void }
}

function useToast(): {
  toast: ToastFunction
  dismiss: (toastId?: string) => void
  toasts: ToasterToast[]
}
```

**Features:**
- Multiple toast variants (success, error, warning)
- Auto-dismiss functionality
- Custom actions and buttons
- Queue management
- Accessible ARIA attributes

**Usage:**
```tsx
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()
  
  const showSuccess = () => {
    toast({
      title: "Success!",
      description: "Your booking has been confirmed.",
      variant: "default"
    })
  }
  
  const showError = () => {
    toast({
      title: "Error",
      description: "Something went wrong.",
      variant: "destructive"
    })
  }
  
  return (
    <div>
      <button onClick={showSuccess}>Show Success</button>
      <button onClick={showError}>Show Error</button>
    </div>
  )
}
```

### useMobile

Responsive design hook for detecting mobile devices.

**File:** `src/hooks/use-mobile.tsx`

```typescript
function useMobile(): boolean
```

**Features:**
- CSS media query integration
- Window resize listeners
- SSR-safe implementation
- Performance optimized

**Usage:**
```tsx
import { useMobile } from '@/hooks/use-mobile'

function ResponsiveComponent() {
  const isMobile = useMobile()
  
  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  )
}
```

## UI Components (shadcn/ui)

The application uses a comprehensive set of UI components from shadcn/ui. Key components include:

### Form Components
- `Button` - Various button styles and sizes
- `Input` - Text input fields with validation
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection component
- `Checkbox` - Checkbox input with custom styling
- `RadioGroup` - Radio button group selection

### Layout Components
- `Card` - Content containers with headers and footers
- `Sheet` - Slide-out panels and modals
- `Dialog` - Modal dialogs and confirmations
- `Tabs` - Tabbed content interface
- `Accordion` - Expandable content sections

### Navigation Components
- `DropdownMenu` - Context menus and actions
- `NavigationMenu` - Main site navigation
- `Breadcrumb` - Breadcrumb navigation trails
- `Pagination` - Page navigation controls

### Feedback Components
- `Alert` - Alert messages and notifications
- `Toast` - Temporary notification messages
- `Progress` - Progress bars and loading indicators
- `Skeleton` - Loading placeholders

### Data Display
- `Table` - Data tables with sorting and filtering
- `Badge` - Status indicators and labels
- `Avatar` - User profile images
- `Tooltip` - Contextual help text

## Styling Guidelines

### Tailwind CSS Classes

The application uses a consistent design system with Tailwind CSS:

**Colors:**
- Primary: `blue-600`, `blue-700`, `blue-100`
- Success: `green-600`, `green-100`
- Error: `red-600`, `red-100`
- Warning: `yellow-600`, `yellow-100`
- Neutral: `gray-50` to `gray-900`

**Typography:**
- Headings: `text-2xl font-bold`, `text-xl font-semibold`
- Body: `text-base`, `text-sm`
- Labels: `text-sm font-medium`

**Spacing:**
- Consistent spacing scale: `p-4`, `m-4`, `space-y-4`
- Component padding: `px-4 py-2` for buttons, `p-6` for cards

**Layout:**
- Container: `max-w-7xl mx-auto px-4`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Flexbox: `flex justify-between items-center`

### Responsive Design

All components are built with mobile-first responsive design:

```css
/* Mobile first (default) */
.component { /* mobile styles */ }

/* Tablet and up */
@media (min-width: 768px) {
  .md:component { /* tablet styles */ }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .lg:component { /* desktop styles */ }
}
```

## State Management Patterns

### Local State
- Use `useState` for component-specific state
- Use `useReducer` for complex state logic
- Keep state close to where it's used

### Global State
- `AuthContext` for authentication state
- URL state for navigation and deep linking
- Local storage for persistence

### Server State
- Fetch data in components with `useEffect`
- Handle loading and error states consistently
- Cache responses when appropriate

## Error Handling

### Component Error Boundaries
```tsx
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 text-red-600">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  )
}
```

### API Error Handling
```tsx
const [error, setError] = useState<string | null>(null)

try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    throw new Error('API request failed')
  }
  // Handle success
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error')
}
```

### Form Validation
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})

const validateForm = (data: FormData) => {
  const newErrors: Record<string, string> = {}
  
  if (!data.email) {
    newErrors.email = 'Email is required'
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

## Performance Optimizations

### Code Splitting
- Lazy load page components with `React.lazy()`
- Use dynamic imports for large libraries
- Split vendor bundles with Vite

### Memoization
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for stable function references

### Asset Optimization
- Optimize images with proper formats (WebP, AVIF)
- Use appropriate image sizes for different screens
- Lazy load images below the fold

## Testing Guidelines

### Component Testing
```tsx
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/Header'

test('renders navigation links', () => {
  render(<Header />)
  
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(screen.getByText('Booking')).toBeInTheDocument()
})
```

### Hook Testing
```tsx
import { renderHook } from '@testing-library/react'
import { useAuth } from '@/contexts/AuthContext'

test('useAuth provides authentication methods', () => {
  const { result } = renderHook(() => useAuth())
  
  expect(typeof result.current.login).toBe('function')
  expect(typeof result.current.logout).toBe('function')
})
```

## Accessibility

### ARIA Labels
- Use `aria-label` for icon buttons
- Use `aria-describedby` for form help text
- Use `role` attributes for custom components

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Use proper tab order with `tabIndex`
- Implement custom keyboard handlers for complex components

### Screen Reader Support
- Use semantic HTML elements
- Provide alternative text for images
- Use proper heading hierarchy

## Development Workflow

### Component Creation
1. Create component file in appropriate directory
2. Export component with proper TypeScript types
3. Add to component index if needed
4. Document props and usage
5. Add tests if complex logic

### Styling
1. Use Tailwind utility classes first
2. Create custom CSS only when necessary
3. Follow responsive design patterns
4. Test on multiple screen sizes

### State Management
1. Start with local state
2. Move to context when sharing across components
3. Consider URL state for navigational data
4. Use proper TypeScript types for all state