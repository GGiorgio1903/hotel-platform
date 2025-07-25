# Hotel Platform - Complete Management System

A comprehensive web platform for hotels and B&Bs that automates reservations, digital check-in/check-out, identity document upload, smart lock simulation, online payments, and email notifications.

## 🚀 Features

### Guest Features
- **Email + OTP Authentication** - Secure login system for guests
- **Booking Management** - Create, view, and manage room reservations
- **Digital Check-in/Check-out** - Contactless room access management
- **Document Upload** - Upload identity documents (PDF/photos) for verification
- **Online Payments** - Secure payment processing with Stripe integration
- **Smart Lock Integration** - Automated room access via API simulation

### Admin Features
- **Dashboard Overview** - Real-time statistics and booking summaries
- **Guest Management** - View and manage guest accounts
- **Booking Management** - Monitor all reservations and their status
- **Payment Tracking** - View payment transactions and revenue
- **Document Management** - Review uploaded identity documents
- **Email Notifications** - Automated booking confirmations and updates
- **Authority Portal Integration** - Submit guest data to compliance portals

## 🛠 Tech Stack

### Frontend
- **React** with TypeScript and Vite
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **FastAPI** (Python) with async support
- **Pydantic** for data validation
- **JWT** authentication
- **Stripe** payment integration
- **Email** service integration
- **In-memory database** (proof of concept)

### Services
- **Stripe** for payment processing (test mode)
- **Email** service for OTP and notifications
- **Smart Lock API** simulation
- **Authority Portal** data submission simulation

## 📋 Prerequisites

- Python 3.12+
- Node.js 18+
- Poetry (Python package manager)
- npm or yarn

## 🚀 Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd hotel-backend
```

2. Install dependencies:
```bash
poetry install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
poetry run fastapi dev app/main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd hotel-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# Email Configuration (optional - will simulate if not provided)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Stripe Configuration (optional - will simulate if not provided)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Smart Lock API (optional - will simulate if not provided)
SMART_LOCK_API_URL=https://api.smartlock-simulator.com

# JWT Secret
JWT_SECRET_KEY=your-super-secret-jwt-key
```

### Frontend Environment Variables (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## 📖 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation powered by FastAPI's automatic OpenAPI generation.

### Key Endpoints

- `POST /auth/request-otp` - Request OTP for authentication
- `POST /auth/verify-otp` - Verify OTP and get access token
- `POST /guests` - Register new guest
- `GET /guests/me` - Get current guest profile
- `POST /bookings` - Create new booking
- `GET /bookings` - List guest bookings
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/{payment_id}/confirm` - Confirm payment
- `POST /documents/upload` - Upload identity document
- `POST /checkin/{booking_id}` - Digital check-in
- `POST /checkout/{booking_id}` - Digital check-out

## 🧪 Testing

### Test User Account

For testing purposes, you can use:
- **Email**: test@example.com
- **Name**: Test User
- **Phone**: +1 (555) 123-4567

The system will generate a 6-digit OTP that will be displayed in the backend console logs when email service is not configured.

### Test Booking Flow

1. Register/Login with test account
2. Create a booking for any available room
3. Complete payment (uses Stripe test mode)
4. View confirmed booking in dashboard
5. Test check-in/check-out functionality
6. Upload identity documents
7. Access admin panel for management features

## 🏗 Architecture

### Database Schema

The application uses an in-memory database with the following entities:

- **Guests** - User accounts with authentication
- **Bookings** - Room reservations with dates and status
- **Payments** - Transaction records with Stripe integration
- **Documents** - Uploaded identity verification files
- **CheckInOut** - Digital access records

### Authentication Flow

1. Guest enters email address
2. System generates and sends 6-digit OTP
3. Guest verifies OTP to receive JWT token
4. Token used for all authenticated requests
5. Token expires after 24 hours

### Payment Flow

1. Guest creates booking
2. System creates Stripe payment intent
3. Guest confirms payment
4. Booking status updated to confirmed
5. Confirmation email sent

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **OTP Verification** for passwordless login
- **Input Validation** with Pydantic models
- **CORS Protection** configured for production
- **File Upload Validation** for document security
- **Payment Security** via Stripe's secure processing

## 🚀 Deployment

### Backend Deployment

The backend is configured for deployment on Fly.io:

```bash
# Deploy backend
poetry run flyctl deploy
```

### Frontend Deployment

Build and deploy the frontend:

```bash
# Build for production
npm run build

# Deploy to your preferred hosting service
# (Vercel, Netlify, etc.)
```

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the console logs for debugging
- Ensure all environment variables are properly configured
- Verify that all services are running

## 🔄 Development Workflow

1. **Backend Development**: Make changes in `hotel-backend/app/`
2. **Frontend Development**: Make changes in `hotel-frontend/src/`
3. **Testing**: Use the test account and verify all features
4. **Deployment**: Deploy backend first, then update frontend API URL

## 📊 Monitoring

The admin panel provides real-time monitoring of:
- Total guests and bookings
- Revenue tracking
- Recent booking activity
- Payment transaction status
- Document upload status

---

Built with ❤️ for the hospitality industry
