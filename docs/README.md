# Hotel Platform Documentation

Welcome to the comprehensive documentation for the Hotel Platform. This directory contains all the documentation you need to understand, implement, and extend the hotel management system.

## 📋 Documentation Structure

### 🏠 Main Documentation
- **[OVERVIEW.md](./OVERVIEW.md)** - Start here! Complete project overview, setup guide, and quick start instructions

### 🔧 Technical References
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete backend API documentation with endpoints, request/response schemas, and examples
- **[COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md)** - Frontend React components, hooks, contexts, and UI library documentation
- **[SERVICES_REFERENCE.md](./SERVICES_REFERENCE.md)** - Backend service classes, business logic, and integration patterns

### 📚 Integration Guide
- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Practical code examples, integration patterns, and real-world usage scenarios

## 🚀 Quick Navigation

### For Developers New to the Project
1. Start with **[OVERVIEW.md](./OVERVIEW.md)** for project understanding and setup
2. Follow the **Installation & Setup** guide to get running locally
3. Explore **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** for practical implementation examples

### For API Integration
1. Check **[API_REFERENCE.md](./API_REFERENCE.md)** for complete endpoint documentation
2. Review authentication flow in **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#authentication-flow)**
3. Use interactive docs at `http://localhost:8000/docs` when running locally

### For Frontend Development
1. Review **[COMPONENT_REFERENCE.md](./COMPONENT_REFERENCE.md)** for React components and patterns
2. Check **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#frontend-integration)** for integration examples
3. Explore the component architecture and styling guidelines

### For Backend Development
1. Study **[API_REFERENCE.md](./API_REFERENCE.md)** for endpoint implementations
2. Review **[SERVICES_REFERENCE.md](./SERVICES_REFERENCE.md)** for service layer architecture
3. Check **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#error-handling-patterns)** for best practices

## 🏗 System Architecture

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

## 🎯 Key Features Documented

### Guest Management
- **Authentication**: OTP-based passwordless login system
- **Registration**: Guest account creation and profile management
- **Security**: JWT token handling and session management

### Booking System
- **Creation**: Room booking with date selection and pricing
- **Management**: Booking updates, cancellations, and status tracking
- **Validation**: Date validation, room availability, and business rules

### Payment Processing
- **Stripe Integration**: Secure payment processing with fallback simulation
- **Payment Flow**: Intent creation, confirmation, and status tracking
- **Security**: PCI-compliant handling and validation

### Digital Services
- **Check-in/Check-out**: Contactless room access via smart lock integration
- **Document Upload**: Identity verification with secure file handling
- **Notifications**: Email confirmations and status updates

### Administrative Features
- **Dashboard**: Real-time statistics and booking overview
- **Management**: Guest, booking, and payment administration
- **Compliance**: Authority portal integration and data submission

## 📱 Supported Platforms

### Frontend
- **Web Browsers**: Chrome, Firefox, Safari, Edge (modern versions)
- **Mobile**: Responsive design for iOS and Android browsers
- **Desktop**: Cross-platform compatibility

### Backend
- **Operating Systems**: Linux, macOS, Windows
- **Python**: 3.12+ with Poetry dependency management
- **Deployment**: Docker, cloud platforms (Fly.io configured)

## 🔧 Development Environment

### Required Tools
- **Node.js 18+** for frontend development
- **Python 3.12+** for backend development
- **Poetry** for Python dependency management
- **Git** for version control

### Optional Integrations
- **Stripe Account** for real payment processing
- **SMTP Service** for email notifications
- **Smart Lock API** for room access control

## 📖 Documentation Standards

### Code Examples
- All code examples are tested and functional
- Examples include error handling and best practices
- TypeScript interfaces and Python type hints included

### API Documentation
- Complete request/response schemas
- HTTP status codes and error responses
- Authentication requirements clearly marked
- Interactive examples available

### Component Documentation
- Props interfaces and usage examples
- State management patterns
- Styling guidelines and responsive design
- Accessibility considerations

## 🧪 Testing Information

### Test Data
- **Test User**: test@example.com (OTP displayed in console)
- **Test Cards**: Stripe test card numbers included
- **Sample Bookings**: Example booking scenarios

### Testing Tools
- **Backend**: pytest with async support
- **Frontend**: Jest and React Testing Library
- **Integration**: API endpoint testing examples

## 🔄 Updates and Maintenance

This documentation is maintained alongside the codebase. When contributing:

1. **API Changes**: Update `API_REFERENCE.md` with new endpoints or modifications
2. **Component Changes**: Update `COMPONENT_REFERENCE.md` with new components or props
3. **Service Changes**: Update `SERVICES_REFERENCE.md` with new business logic
4. **Usage Changes**: Update `USAGE_EXAMPLES.md` with new integration patterns

## 📞 Support

For questions about this documentation:
1. Check the relevant reference documentation first
2. Review the usage examples for similar scenarios
3. Consult the interactive API documentation at `/docs`
4. Check console logs for debugging information

---

**Documentation Version**: Comprehensive v1.0  
**Last Updated**: December 2024  
**Maintained by**: Hotel Platform Development Team