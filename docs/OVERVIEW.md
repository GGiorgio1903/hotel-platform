# Hotel Platform Documentation

## Overview

Welcome to the Hotel Platform documentation. This is a comprehensive hotel management system that provides modern, digital solutions for guest booking, payment processing, identity verification, and contactless check-in/check-out experiences.

## 📋 Documentation Index

### Core References
- **[API Reference](./API_REFERENCE.md)** - Complete backend API documentation with endpoints, schemas, and examples
- **[Component Reference](./COMPONENT_REFERENCE.md)** - Frontend React components, hooks, and contexts documentation  
- **[Services Reference](./SERVICES_REFERENCE.md)** - Backend service classes and business logic documentation
- **[Usage Examples](./USAGE_EXAMPLES.md)** - Practical integration examples and code snippets

### Quick Start Guides
- **[Installation & Setup](#installation--setup)** - Get the platform running locally
- **[API Quick Start](#api-quick-start)** - Start using the API in 5 minutes
- **[Frontend Integration](#frontend-integration)** - Add components to your React app

## 🏗 Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   External      │
│   (React)       │◄──►│   (FastAPI)      │◄──►│   Services      │
│                 │    │                  │    │                 │
│ • Pages         │    │ • API Endpoints  │    │ • Stripe        │
│ • Components    │    │ • Business Logic │    │ • Email SMTP    │
│ • Contexts      │    │ • Data Models    │    │ • Smart Locks   │
│ • Hooks         │    │ • Services       │    │ • Authority API │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for component library
- **React Router** for client-side routing
- **Stripe Elements** for payment processing

#### Backend
- **FastAPI** with Python 3.12+
- **Pydantic** for data validation and serialization
- **JWT** for authentication and authorization
- **Stripe SDK** for payment processing
- **SMTP** for email notifications
- **Async/await** for optimal performance

#### External Integrations
- **Stripe** - Payment processing (with simulation fallback)
- **Email Services** - OTP delivery and notifications (with console fallback)
- **Smart Lock APIs** - Room access control (simulated)
- **Authority Portals** - Compliance data submission (simulated)

## 🚀 Core Features

### Guest Experience
- **🔐 OTP Authentication** - Passwordless login via email verification
- **🏨 Room Booking** - Select rooms, dates, and submit special requests
- **💳 Secure Payments** - Stripe-powered payment processing
- **📄 Document Upload** - Identity verification with drag & drop upload
- **📱 Digital Check-in/out** - Contactless room access via smart locks
- **📧 Email Notifications** - Automatic booking confirmations and updates

### Admin Features
- **👥 Guest Management** - View and manage all guest accounts
- **📅 Booking Overview** - Monitor reservations and booking statuses
- **💰 Payment Tracking** - View transactions and revenue analytics
- **📋 Document Review** - Access uploaded identity documents
- **📊 System Statistics** - Real-time dashboard with key metrics

### Developer Features
- **🔄 Auto-generated API Docs** - Interactive OpenAPI documentation
- **🛡 Type Safety** - Full TypeScript support throughout
- **🧪 Simulation Mode** - Works without external service configuration
- **🔧 Environment Config** - Easy setup with environment variables
- **📱 Responsive Design** - Mobile-first UI components

## 📦 Installation & Setup

### Prerequisites
- **Node.js 18+** for frontend development
- **Python 3.12+** for backend development
- **Poetry** for Python dependency management
- **npm/yarn** for Node.js packages

### Backend Setup
```bash
# Navigate to backend directory
cd hotel-backend

# Install dependencies with Poetry
poetry install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration (optional for demo)
nano .env

# Start development server
poetry run fastapi dev app/main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup
```bash
# Navigate to frontend directory
cd hotel-frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## ⚡ API Quick Start

### 1. Register a Guest
```bash
curl -X POST "http://localhost:8000/guests" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

### 2. Request OTP for Authentication
```bash
curl -X POST "http://localhost:8000/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 3. Verify OTP and Get Token
```bash
curl -X POST "http://localhost:8000/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### 4. Create a Booking
```bash
curl -X POST "http://localhost:8000/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "guest_id": "guest_123",
    "room_number": "101",
    "check_in_date": "2024-12-15T15:00:00Z",
    "check_out_date": "2024-12-18T11:00:00Z",
    "total_amount": 299.99
  }'
```

### 5. View Interactive API Documentation
Visit `http://localhost:8000/docs` for complete interactive API documentation.

## 🎨 Frontend Integration

### Basic Component Usage
```tsx
import { AuthProvider } from '@/contexts/AuthContext'
import { Header } from '@/components/Header'
import { BookingForm } from '@/components/BookingForm'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto py-8">
          <BookingForm />
        </main>
      </div>
    </AuthProvider>
  )
}
```

### Authentication Hook
```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { isAuthenticated, guest, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div>
      <h1>Welcome, {guest?.first_name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Stripe Configuration (optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Smart Lock API (optional)
SMART_LOCK_API_URL=https://api.smartlock-simulator.com

# JWT Secret (recommended to change)
JWT_SECRET_KEY=your-super-secret-jwt-key
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Simulation Mode
The platform works in simulation mode without any external service configuration:
- **Payments**: Returns mock Stripe responses
- **Emails**: Prints to console instead of sending
- **Smart Locks**: Returns success responses
- **Authority APIs**: Logs submission data

## 📚 Data Models

### Core Entities

#### Guest
```typescript
{
  id: string
  email: string (validated)
  first_name: string
  last_name: string
  phone: string
  created_at: datetime
}
```

#### Booking
```typescript
{
  id: string
  guest_id: string
  room_number: string
  check_in_date: datetime
  check_out_date: datetime
  total_amount: number
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled"
  special_requests?: string
  created_at: datetime
  updated_at: datetime
}
```

#### Payment
```typescript
{
  id: string
  booking_id: string
  amount: number
  currency: string
  stripe_payment_intent_id?: string
  status: "pending" | "completed" | "failed" | "refunded"
  created_at: datetime
}
```

### Booking Status Flow
```
pending → confirmed → checked_in → checked_out
   ↓           ↓
cancelled   cancelled
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** with configurable expiration (default: 30 minutes)
- **OTP Verification** for passwordless authentication (expires in 10 minutes)
- **Guest Data Isolation** - users can only access their own data
- **Admin Endpoints** for staff access (no authentication required in demo)

### Data Protection
- **Input Validation** with Pydantic models
- **File Upload Security** with type and size validation
- **CORS Protection** configured for cross-origin requests
- **SQL Injection Prevention** through ORM usage

### Payment Security
- **Stripe Integration** for PCI-compliant payment processing
- **Payment Intent Verification** before booking confirmation
- **Amount Validation** to prevent payment tampering

## 🧪 Testing

### Test User Account
For development and testing:
- **Email**: test@example.com
- **Name**: Test User
- **Phone**: +1 (555) 123-4567

OTP codes are displayed in the backend console when email is not configured.

### Test Payment Cards (Stripe)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

### API Testing
```bash
# Run backend tests
cd hotel-backend
poetry run pytest

# Run frontend tests
cd hotel-frontend
npm test
```

## 📈 Monitoring & Analytics

### Admin Dashboard
Access `/admin` for:
- Total guests and bookings count
- Revenue tracking and payment status
- Recent booking activity
- Document upload status
- System health metrics

### Logging
The system logs important events:
- Authentication attempts and failures
- Booking creation and status changes
- Payment processing events
- Email delivery status
- Smart lock control actions

## 🚀 Deployment

### Backend Deployment
```bash
# Build for production
poetry build

# Deploy to Fly.io (configured)
poetry run flyctl deploy

# Or deploy to your preferred platform
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel, Netlify, or your preferred platform
# The build output will be in the `dist` directory
```

### Production Considerations
- Set secure JWT secret keys
- Configure real email service (SMTP)
- Set up Stripe with production keys
- Implement proper database (PostgreSQL/MySQL)
- Configure SSL/HTTPS
- Set up monitoring and logging
- Implement rate limiting
- Add backup and recovery procedures

## 🤝 Contributing

### Development Workflow
1. **Backend Changes**: Work in `hotel-backend/app/`
2. **Frontend Changes**: Work in `hotel-frontend/src/`
3. **Testing**: Use test account and verify all features
4. **Documentation**: Update relevant docs for API/component changes

### Code Style
- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: Use Prettier and ESLint configurations
- **TypeScript**: Enable strict mode and proper typing
- **Git**: Use conventional commit messages

## 📖 API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

### Core Endpoints
- `POST /auth/request-otp` - Request authentication OTP
- `POST /auth/verify-otp` - Verify OTP and get token
- `POST /guests` - Register new guest
- `GET /guests/me` - Get current guest profile
- `POST /bookings` - Create booking
- `GET /bookings` - List guest bookings
- `POST /payments/create-intent` - Create payment intent
- `POST /documents/upload` - Upload identity document
- `POST /checkin/{booking_id}` - Digital check-in
- `POST /checkout/{booking_id}` - Digital check-out

## 🆘 Support & Troubleshooting

### Common Issues

#### Backend Won't Start
- Check Python version (3.12+ required)
- Verify Poetry installation: `poetry --version`
- Install dependencies: `poetry install`
- Check port 8000 is available

#### Frontend Won't Start
- Check Node.js version (18+ required)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port 5173 is available

#### Authentication Issues
- Verify OTP in backend console logs
- Check JWT secret key is set
- Ensure token is included in Authorization header
- Check token expiration (default: 30 minutes)

#### Payment Issues
- Verify Stripe keys are correctly set
- Use test card numbers for development
- Check browser console for Stripe errors
- Ensure booking exists and is in pending status

### Getting Help
1. Check the interactive API documentation at `/docs`
2. Review console logs for error messages
3. Verify all environment variables are set correctly
4. Ensure all required services are running

### Debugging Tips
- Enable debug mode in FastAPI for detailed error messages
- Use browser developer tools to inspect network requests
- Check backend logs for service simulation messages
- Verify database state using admin endpoints

---

**Built with ❤️ for the hospitality industry**

This platform demonstrates modern hotel management with digital-first guest experiences, secure payment processing, and seamless integration capabilities.