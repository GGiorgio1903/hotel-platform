# Hotel Platform API Reference

## Overview

The Hotel Platform API is a RESTful web service built with FastAPI that provides comprehensive hotel management functionality including guest authentication, booking management, payment processing, document upload, and smart lock integration.

**Base URL:** `http://localhost:8000` (development)  
**Authentication:** JWT Bearer Token (after OTP verification)  
**Content-Type:** `application/json`

## Quick Start

1. Register a guest account
2. Request OTP for authentication
3. Verify OTP to get access token
4. Use token in Authorization header: `Bearer <token>`

## Authentication Endpoints

### Request OTP

Initiates the authentication process by sending a 6-digit OTP to the guest's email.

**Endpoint:** `POST /auth/request-otp`

**Request Body:**
```json
{
  "email": "guest@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email"
}
```

**Example Usage:**
```bash
curl -X POST "http://localhost:8000/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Verify OTP

Verifies the OTP and returns an access token for authenticated requests.

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "guest@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "guest": {
    "id": "guest_123",
    "email": "guest@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid or expired OTP
- `404`: Guest not found (need to register first)

## Guest Management

### Create Guest

Registers a new guest account in the system.

**Endpoint:** `POST /guests`

**Request Body:**
```json
{
  "email": "guest@example.com",
  "first_name": "John",
  "last_name": "Doe", 
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "id": "guest_123",
  "email": "guest@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "created_at": "2024-01-01T12:00:00Z"
}
```

**Error Responses:**
- `400`: Guest with this email already exists

### Get Current Guest

Retrieves the authenticated guest's profile information.

**Endpoint:** `GET /guests/me`  
**Authentication:** Required

**Response:**
```json
{
  "id": "guest_123",
  "email": "guest@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "created_at": "2024-01-01T12:00:00Z"
}
```

## Booking Management

### Create Booking

Creates a new room booking for the authenticated guest.

**Endpoint:** `POST /bookings`  
**Authentication:** Required

**Request Body:**
```json
{
  "guest_id": "guest_123",
  "room_number": "101",
  "check_in_date": "2024-01-15T15:00:00Z",
  "check_out_date": "2024-01-18T11:00:00Z",
  "total_amount": 299.99,
  "special_requests": "Late check-in preferred"
}
```

**Response:**
```json
{
  "id": "booking_456",
  "guest_id": "guest_123",
  "room_number": "101",
  "check_in_date": "2024-01-15T15:00:00Z",
  "check_out_date": "2024-01-18T11:00:00Z",
  "total_amount": 299.99,
  "status": "pending",
  "special_requests": "Late check-in preferred",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**Booking Status Flow:**
- `pending` → `confirmed` (after payment)
- `confirmed` → `checked_in` (during check-in)
- `checked_in` → `checked_out` (during check-out)
- Any status → `cancelled` (cancellation)

### Get Guest Bookings

Retrieves all bookings for the authenticated guest.

**Endpoint:** `GET /bookings`  
**Authentication:** Required

**Response:**
```json
[
  {
    "id": "booking_456",
    "guest_id": "guest_123",
    "room_number": "101",
    "check_in_date": "2024-01-15T15:00:00Z",
    "check_out_date": "2024-01-18T11:00:00Z",
    "total_amount": 299.99,
    "status": "confirmed",
    "special_requests": null,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
]
```

### Get Specific Booking

Retrieves a specific booking by ID (guest can only access their own bookings).

**Endpoint:** `GET /bookings/{booking_id}`  
**Authentication:** Required

**Path Parameters:**
- `booking_id` (string): The booking ID

**Response:** Same as single booking object above

**Error Responses:**
- `404`: Booking not found
- `403`: Access denied (not guest's booking)

### Update Booking

Updates an existing booking (only allowed before check-in).

**Endpoint:** `PUT /bookings/{booking_id}`  
**Authentication:** Required

**Request Body:**
```json
{
  "room_number": "102",
  "check_in_date": "2024-01-16T15:00:00Z",
  "total_amount": 349.99,
  "special_requests": "Ground floor preferred"
}
```

**Response:** Updated booking object

**Error Responses:**
- `400`: Cannot modify booking after check-in
- `403`: Access denied
- `404`: Booking not found

### Cancel Booking

Cancels an existing booking (only allowed before check-in).

**Endpoint:** `DELETE /bookings/{booking_id}`  
**Authentication:** Required

**Response:**
```json
{
  "message": "Booking cancelled successfully"
}
```

## Payment Processing

### Create Payment Intent

Creates a Stripe payment intent for a booking.

**Endpoint:** `POST /payments/create-intent`  
**Authentication:** Required

**Request Body:**
```json
{
  "booking_id": "booking_456",
  "amount": 299.99,
  "currency": "eur"
}
```

**Response:**
```json
{
  "client_secret": "pi_1234567890_secret_abcdef",
  "payment_id": "payment_789"
}
```

**Notes:**
- If Stripe is not configured, returns simulated payment data
- Amount should match the booking total
- Client secret is used for frontend payment confirmation

### Confirm Payment

Confirms a payment and updates the booking status to confirmed.

**Endpoint:** `POST /payments/{payment_id}/confirm`  
**Authentication:** Required

**Path Parameters:**
- `payment_id` (string): The payment ID

**Response:**
```json
{
  "message": "Payment confirmed successfully"
}
```

**Error Responses:**
- `400`: Payment confirmation failed
- `404`: Payment not found
- `403`: Access denied

## Document Management

### Upload Document

Uploads an identity document (PDF or image) for verification.

**Endpoint:** `POST /documents/upload`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `document_type` (string): Type of document (`passport`, `id_card`, `driver_license`)
- `file` (file): Document file (PDF, JPG, PNG, JPEG)

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document_id": "doc_123"
}
```

**File Restrictions:**
- Maximum file size: Depends on server configuration
- Allowed types: PDF, JPEG, PNG, JPG
- Files are stored securely on the server

### Get Guest Documents

Retrieves all documents uploaded by the authenticated guest.

**Endpoint:** `GET /documents`  
**Authentication:** Required

**Response:**
```json
[
  {
    "id": "doc_123",
    "guest_id": "guest_123",
    "document_type": "passport",
    "file_path": "/secure/documents/guest_123_passport.pdf",
    "file_name": "passport.pdf",
    "uploaded_at": "2024-01-01T12:00:00Z"
  }
]
```

## Check-in/Check-out

### Digital Check-in

Performs digital check-in and unlocks the room via smart lock integration.

**Endpoint:** `POST /checkin/{booking_id}`  
**Authentication:** Required

**Path Parameters:**
- `booking_id` (string): The booking ID

**Response:**
```json
{
  "message": "Check-in successful",
  "room_access": true,
  "checkin_id": "checkin_999"
}
```

**Requirements:**
- Booking must be in `confirmed` status
- Payment must be completed
- Guest must be the booking owner

**Error Responses:**
- `400`: Booking must be confirmed before check-in
- `403`: Access denied
- `404`: Booking not found

### Digital Check-out

Performs digital check-out and locks the room via smart lock integration.

**Endpoint:** `POST /checkout/{booking_id}`  
**Authentication:** Required

**Path Parameters:**
- `booking_id` (string): The booking ID

**Response:**
```json
{
  "message": "Check-out successful",
  "room_secured": true,
  "checkout_id": "checkout_888"
}
```

**Requirements:**
- Booking must be in `checked_in` status
- Guest must be the booking owner

## Smart Lock Integration

### Control Smart Lock

Directly controls a smart lock (unlock/lock a room).

**Endpoint:** `POST /smart-lock/control`

**Request Body:**
```json
{
  "room_number": "101",
  "action": "unlock",
  "guest_id": "guest_123"
}
```

**Response:**
```json
{
  "success": true,
  "room_number": "101",
  "action": "unlock",
  "guest_id": "guest_123",
  "timestamp": "2024-01-01T12:00:00Z",
  "lock_status": "unlocked",
  "message": "Room 101 unlocked successfully"
}
```

**Actions:**
- `unlock`: Unlock the room
- `lock`: Lock the room

## Admin Endpoints

### Get All Bookings

Retrieves all bookings in the system (admin access).

**Endpoint:** `GET /admin/bookings`

**Response:** Array of all booking objects

### Get All Guests

Retrieves all guests in the system (admin access).

**Endpoint:** `GET /admin/guests`

**Response:** Array of all guest objects

### Get All Payments

Retrieves all payments in the system (admin access).

**Endpoint:** `GET /admin/payments`

**Response:** Array of all payment objects

## Health Check

### Health Status

Simple health check endpoint to verify API availability.

**Endpoint:** `GET /healthz`

**Response:**
```json
{
  "status": "ok"
}
```

## Data Models

### Guest
```json
{
  "id": "string",
  "email": "string (email format)",
  "first_name": "string",
  "last_name": "string", 
  "phone": "string",
  "created_at": "datetime"
}
```

### Booking
```json
{
  "id": "string",
  "guest_id": "string",
  "room_number": "string",
  "check_in_date": "datetime",
  "check_out_date": "datetime",
  "total_amount": "number",
  "status": "pending|confirmed|checked_in|checked_out|cancelled",
  "special_requests": "string|null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Payment
```json
{
  "id": "string",
  "booking_id": "string",
  "amount": "number",
  "currency": "string",
  "stripe_payment_intent_id": "string|null",
  "status": "pending|completed|failed|refunded",
  "created_at": "datetime"
}
```

### Document
```json
{
  "id": "string",
  "guest_id": "string",
  "document_type": "passport|id_card|driver_license",
  "file_path": "string",
  "file_name": "string",
  "uploaded_at": "datetime"
}
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "detail": "Error message description"
}
```

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting for:
- OTP requests (max 3 per hour per email)
- Authentication attempts (max 5 per minute per IP)
- File uploads (max 10 per hour per guest)

## Security

- **JWT Tokens**: Expire after 30 minutes
- **OTP Codes**: Expire after 10 minutes  
- **HTTPS**: Required in production
- **File Validation**: Strict file type checking for uploads
- **Access Control**: Guests can only access their own data

## Interactive Documentation

When running the server locally, visit `http://localhost:8000/docs` for interactive API documentation powered by FastAPI's automatic OpenAPI generation.