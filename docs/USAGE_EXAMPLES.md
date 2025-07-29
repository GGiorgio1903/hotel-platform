# Hotel Platform Usage Examples & Integration Guide

## Overview

This guide provides practical examples and step-by-step integration instructions for the Hotel Platform API and frontend components. Each example includes complete code snippets, error handling, and best practices.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Booking Management](#booking-management)
3. [Payment Processing](#payment-processing)
4. [Document Management](#document-management)
5. [Check-in/Check-out Flow](#check-in-check-out-flow)
6. [Frontend Integration](#frontend-integration)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Testing Examples](#testing-examples)

## Authentication Flow

### Complete Guest Registration and Login

This example shows the complete authentication flow from registration to accessing protected resources.

#### Backend Implementation

```python
# models.py - Define the guest registration data
from pydantic import BaseModel, EmailStr

class GuestCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str

# main.py - Registration endpoint
@app.post("/guests", response_model=Guest)
async def create_guest(guest_data: GuestCreate):
    existing_guest = db.get_guest_by_email(guest_data.email)
    if existing_guest:
        raise HTTPException(status_code=400, detail="Guest with this email already exists")
    
    guest = db.create_guest(guest_data.dict())
    return guest

# OTP request endpoint
@app.post("/auth/request-otp")
async def request_otp(otp_request: OTPRequest):
    otp = generate_otp()
    db.store_otp(otp_request.email, otp)
    
    await EmailService.send_otp_email(otp_request.email, otp)
    
    return {"message": "OTP sent to your email"}

# OTP verification endpoint
@app.post("/auth/verify-otp", response_model=AuthResponse)
async def verify_otp(verification: OTPVerification):
    if not db.verify_otp(verification.email, verification.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    guest = db.get_guest_by_email(verification.email)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found. Please register first.")
    
    access_token = create_access_token(data={"sub": guest.email})
    
    return AuthResponse(
        access_token=access_token,
        guest=guest
    )
```

#### Frontend Implementation

```typescript
// contexts/AuthContext.tsx - Complete authentication context
import React, { createContext, useContext, useState, useEffect } from 'react'

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
  register: (guestData: GuestCreateData) => Promise<boolean>
  login: (email: string, otp: string) => Promise<boolean>
  logout: () => void
  requestOTP: (email: string) => Promise<boolean>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // Register new guest
  const register = async (guestData: GuestCreateData): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/guests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guestData),
      })

      if (response.ok) {
        const newGuest = await response.json()
        console.log('Guest registered successfully:', newGuest)
        return true
      } else {
        const error = await response.json()
        console.error('Registration failed:', error.detail)
        return false
      }
    } catch (error) {
      console.error('Registration error:', error)
      return false
    }
  }

  // Request OTP for authentication
  const requestOTP = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      return response.ok
    } catch (error) {
      console.error('Error requesting OTP:', error)
      return false
    }
  }

  // Login with email and OTP
  const login = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.access_token)
        setGuest(data.guest)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch (error) {
      console.error('Error logging in:', error)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      guest,
      loading,
      register,
      login,
      logout,
      requestOTP,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### Usage Example

```typescript
// pages/RegisterPage.tsx - Registration form component
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function RegisterPage() {
  const { register, requestOTP } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Register the guest
      const registerSuccess = await register(formData)
      
      if (registerSuccess) {
        // Request OTP for immediate login
        const otpSuccess = await requestOTP(formData.email)
        
        if (otpSuccess) {
          // Redirect to login page with email pre-filled
          navigate('/login', { state: { email: formData.email } })
        } else {
          alert('Registration successful, but failed to send OTP. Please try logging in manually.')
          navigate('/login')
        }
      } else {
        alert('Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('An error occurred during registration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">First Name</label>
        <input
          type="text"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Last Name</label>
        <input
          type="text"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
}
```

## Booking Management

### Complete Booking Creation Flow

This example demonstrates creating a booking from start to finish, including validation and error handling.

#### Backend Booking Flow

```python
# main.py - Complete booking creation with validations
@app.post("/bookings", response_model=Booking)
async def create_booking(
    booking_data: BookingCreate,
    current_guest: Guest = Depends(get_current_guest)
):
    # Validate guest owns this booking
    if booking_data.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Cannot create booking for another guest")
    
    # Validate dates
    if booking_data.check_in_date >= booking_data.check_out_date:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date")
    
    # Check room availability (simplified - in production, use proper availability checking)
    existing_bookings = db.get_bookings_by_room_and_dates(
        booking_data.room_number,
        booking_data.check_in_date,
        booking_data.check_out_date
    )
    
    if existing_bookings:
        raise HTTPException(status_code=400, detail="Room not available for selected dates")
    
    # Create the booking
    booking = db.create_booking({
        **booking_data.dict(),
        "status": BookingStatus.PENDING
    })
    
    # Send confirmation email
    try:
        await EmailService.send_booking_confirmation(
            current_guest.email,
            {
                "guest_name": f"{current_guest.first_name} {current_guest.last_name}",
                "booking_id": booking.id,
                "room_number": booking.room_number,
                "check_in_date": booking.check_in_date.strftime("%Y-%m-%d"),
                "check_out_date": booking.check_out_date.strftime("%Y-%m-%d"),
                "total_amount": booking.total_amount
            }
        )
    except Exception as e:
        print(f"Failed to send confirmation email: {e}")
        # Don't fail the booking creation if email fails
    
    # Submit to authority portal
    try:
        await AuthorityService.send_guest_data(
            current_guest.dict(),
            booking.dict()
        )
    except Exception as e:
        print(f"Failed to submit to authority portal: {e}")
        # Don't fail the booking creation if authority submission fails
    
    return booking
```

#### Frontend Booking Component

```typescript
// components/BookingForm.tsx - Complete booking form
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface BookingFormData {
  room_number: string
  check_in_date: string
  check_out_date: string
  total_amount: number
  special_requests: string
}

export function BookingForm() {
  const { guest } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<BookingFormData>({
    room_number: '',
    check_in_date: '',
    check_out_date: '',
    total_amount: 0,
    special_requests: ''
  })
  const [loading, setLoading] = useState(false)

  // Calculate total amount based on dates and room
  const calculateTotal = (checkIn: string, checkOut: string, roomNumber: string) => {
    if (!checkIn || !checkOut || !roomNumber) return 0
    
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Room pricing logic (simplified)
    const roomPrices: Record<string, number> = {
      '101': 99.99,
      '102': 129.99,
      '103': 159.99,
      '201': 199.99,
      '202': 229.99
    }
    
    const pricePerNight = roomPrices[roomNumber] || 99.99
    return nights * pricePerNight
  }

  const handleDateChange = (field: 'check_in_date' | 'check_out_date', value: string) => {
    const newFormData = { ...formData, [field]: value }
    
    // Recalculate total amount
    newFormData.total_amount = calculateTotal(
      newFormData.check_in_date,
      newFormData.check_out_date,
      newFormData.room_number
    )
    
    setFormData(newFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest) return

    setLoading(true)

    try {
      const bookingData = {
        ...formData,
        guest_id: guest.id,
        check_in_date: new Date(formData.check_in_date).toISOString(),
        check_out_date: new Date(formData.check_out_date).toISOString()
      }

      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      if (response.ok) {
        const booking = await response.json()
        // Redirect to payment page
        navigate(`/payment?booking_id=${booking.id}`)
      } else {
        const error = await response.json()
        alert(`Booking failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('An error occurred while creating the booking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Booking</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Room Number</label>
          <select
            value={formData.room_number}
            onChange={(e) => {
              const newFormData = { ...formData, room_number: e.target.value }
              newFormData.total_amount = calculateTotal(
                newFormData.check_in_date,
                newFormData.check_out_date,
                newFormData.room_number
              )
              setFormData(newFormData)
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Room</option>
            <option value="101">Room 101 - €99.99/night</option>
            <option value="102">Room 102 - €129.99/night</option>
            <option value="103">Room 103 - €159.99/night</option>
            <option value="201">Room 201 - €199.99/night</option>
            <option value="202">Room 202 - €229.99/night</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Total Amount</label>
          <input
            type="text"
            value={`€${formData.total_amount.toFixed(2)}`}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Check-in Date</label>
          <input
            type="date"
            value={formData.check_in_date}
            onChange={(e) => handleDateChange('check_in_date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Check-out Date</label>
          <input
            type="date"
            value={formData.check_out_date}
            onChange={(e) => handleDateChange('check_out_date', e.target.value)}
            min={formData.check_in_date || new Date().toISOString().split('T')[0]}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Special Requests (Optional)</label>
        <textarea
          value={formData.special_requests}
          onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special requests or preferences..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || formData.total_amount === 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating Booking...' : `Book Now - €${formData.total_amount.toFixed(2)}`}
      </button>
    </form>
  )
}
```

## Payment Processing

### Complete Stripe Integration

This example shows the complete payment flow from creating a payment intent to confirming payment.

#### Backend Payment Implementation

```python
# main.py - Payment endpoints with full error handling
@app.post("/payments/create-intent")
async def create_payment_intent(
    payment_data: PaymentCreate,
    current_guest: Guest = Depends(get_current_guest)
):
    # Validate booking exists and belongs to guest
    booking = db.get_booking_by_id(payment_data.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate booking status
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not in pending status")
    
    # Validate payment amount matches booking
    if abs(payment_data.amount - booking.total_amount) > 0.01:  # Allow for small rounding differences
        raise HTTPException(status_code=400, detail="Payment amount does not match booking total")
    
    try:
        # Create payment intent
        intent_data = await PaymentService.create_payment_intent(
            payment_data.amount, 
            payment_data.currency
        )
        
        # Store payment record
        payment = db.create_payment({
            **payment_data.dict(),
            "stripe_payment_intent_id": intent_data["payment_intent_id"],
            "status": "pending"
        })
        
        return {
            "client_secret": intent_data["client_secret"],
            "payment_id": payment.id,
            "amount": payment_data.amount,
            "currency": payment_data.currency
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment creation failed: {str(e)}")

@app.post("/payments/{payment_id}/confirm")
async def confirm_payment(
    payment_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    # Get payment record
    payment = db.payments.get(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Validate booking ownership
    booking = db.get_booking_by_id(payment.booking_id)
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Confirm payment with Stripe
        success = await PaymentService.confirm_payment(payment.stripe_payment_intent_id)
        
        if success:
            # Update payment status
            db.update_payment(payment_id, {"status": "completed"})
            
            # Update booking status
            db.update_booking(payment.booking_id, {"status": BookingStatus.CONFIRMED})
            
            # Send confirmation email
            await EmailService.send_booking_confirmation(
                current_guest.email,
                {
                    "guest_name": f"{current_guest.first_name} {current_guest.last_name}",
                    "booking_id": booking.id,
                    "room_number": booking.room_number,
                    "check_in_date": booking.check_in_date.strftime("%Y-%m-%d"),
                    "check_out_date": booking.check_out_date.strftime("%Y-%m-%d"),
                    "total_amount": booking.total_amount
                }
            )
            
            return {
                "message": "Payment confirmed successfully",
                "booking_status": "confirmed",
                "payment_status": "completed"
            }
        else:
            # Update payment status to failed
            db.update_payment(payment_id, {"status": "failed"})
            raise HTTPException(status_code=400, detail="Payment confirmation failed")
            
    except Exception as e:
        # Update payment status to failed
        db.update_payment(payment_id, {"status": "failed"})
        raise HTTPException(status_code=400, detail=f"Payment confirmation error: {str(e)}")
```

#### Frontend Payment Component

```typescript
// components/PaymentForm.tsx - Stripe Elements integration
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { useSearchParams, useNavigate } from 'react-router-dom'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface BookingDetails {
  id: string
  room_number: string
  check_in_date: string
  check_out_date: string
  total_amount: number
  guest_name: string
}

function PaymentFormInner() {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id')
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentId, setPaymentId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Load booking details and create payment intent
  useEffect(() => {
    if (!bookingId) return

    const initializePayment = async () => {
      try {
        const token = localStorage.getItem('access_token')
        
        // Get booking details
        const bookingResponse = await fetch(`http://localhost:8000/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!bookingResponse.ok) {
          throw new Error('Failed to load booking details')
        }
        
        const bookingData = await bookingResponse.json()
        setBooking(bookingData)
        
        // Create payment intent
        const paymentResponse = await fetch('http://localhost:8000/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            booking_id: bookingId,
            amount: bookingData.total_amount,
            currency: 'eur'
          })
        })
        
        if (!paymentResponse.ok) {
          throw new Error('Failed to create payment intent')
        }
        
        const paymentData = await paymentResponse.json()
        setClientSecret(paymentData.client_secret)
        setPaymentId(paymentData.payment_id)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment initialization failed')
      }
    }

    initializePayment()
  }, [bookingId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)
    setError('')

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      setLoading(false)
      return
    }

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: booking?.guest_name || 'Guest'
          }
        }
      })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment with backend
        const token = localStorage.getItem('access_token')
        const confirmResponse = await fetch(`http://localhost:8000/payments/${paymentId}/confirm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (confirmResponse.ok) {
          // Redirect to success page
          navigate(`/booking-confirmation?booking_id=${bookingId}`)
        } else {
          throw new Error('Payment confirmation failed')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setLoading(false)
    }
  }

  if (!booking) {
    return <div className="text-center">Loading booking details...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
      
      {/* Booking Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Booking Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Room:</span>
            <span>{booking.room_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Check-in:</span>
            <span>{new Date(booking.check_in_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Check-out:</span>
            <span>{new Date(booking.check_out_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span>€{booking.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Card Details</label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Processing...' : `Pay €${booking.total_amount.toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}

export function PaymentForm() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner />
    </Elements>
  )
}
```

## Document Management

### File Upload with Validation

This example shows how to implement secure file upload with proper validation.

#### Backend Document Upload

```python
# main.py - Document upload with comprehensive validation
import os
import aiofiles
from fastapi import UploadFile, File, Form, HTTPException

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/jpeg', 
    'image/png',
    'image/jpg'
}

def validate_file(file: UploadFile) -> None:
    """Validate uploaded file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file content type"
        )

@app.post("/documents/upload")
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_guest: Guest = Depends(get_current_guest)
):
    # Validate file
    validate_file(file)
    
    # Validate document type
    valid_doc_types = ['passport', 'id_card', 'driver_license']
    if document_type not in valid_doc_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: {', '.join(valid_doc_types)}"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Check file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Save document
        file_path = await DocumentService.save_document(
            file_content, 
            file.filename, 
            current_guest.id
        )
        
        # Create document record
        document = db.create_document({
            "guest_id": current_guest.id,
            "document_type": document_type,
            "file_path": file_path,
            "file_name": file.filename
        })
        
        return {
            "message": "Document uploaded successfully",
            "document_id": document.id,
            "document_type": document_type,
            "file_name": file.filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
```

#### Frontend Document Upload Component

```typescript
// components/DocumentUpload.tsx - File upload with drag & drop
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface Document {
  id: string
  document_type: string
  file_name: string
  uploaded_at: string
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('passport')

  // Load existing documents
  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const docs = await response.json()
        setDocuments(docs)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  // Upload file
  const uploadFile = async (file: File, documentType: string) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', documentType)

      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        alert('Document uploaded successfully!')
        loadDocuments() // Refresh document list
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('An error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0], selectedType)
    }
  }, [selectedType])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  // Load documents on component mount
  React.useEffect(() => {
    loadDocuments()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Identity Documents</h2>

      {/* Document Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Document Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="passport">Passport</option>
          <option value="id_card">ID Card</option>
          <option value="driver_license">Driver's License</option>
        </select>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Uploading...</p>
          </div>
        ) : isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <div>
            <p className="text-lg mb-2">Drop your document here, or click to select</p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, JPG, PNG (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{doc.file_name}</p>
                  <p className="text-sm text-gray-500">
                    Type: {doc.document_type} • 
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    Uploaded
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## Check-in/Check-out Flow

### Complete Digital Check-in Implementation

This example shows the complete check-in flow with smart lock integration.

#### Backend Check-in Implementation

```python
# main.py - Digital check-in with comprehensive validation
@app.post("/checkin/{booking_id}")
async def check_in(
    booking_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    # Get booking
    booking = db.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Validate ownership
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate booking status
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=400, 
            detail="Booking must be confirmed before check-in"
        )
    
    # Check if check-in date is valid (not too early)
    today = datetime.now().date()
    checkin_date = booking.check_in_date.date()
    
    if checkin_date > today:
        raise HTTPException(
            status_code=400,
            detail=f"Check-in not available until {checkin_date}"
        )
    
    # Check if already checked in
    existing_checkin = db.get_checkin_by_booking(booking_id)
    if existing_checkin and existing_checkin.action == "check_in":
        raise HTTPException(
            status_code=400,
            detail="Already checked in"
        )
    
    try:
        # Control smart lock
        lock_response = await SmartLockService.control_lock(
            booking.room_number, 
            "unlock", 
            current_guest.id
        )
        
        # Create check-in record
        checkin = db.create_checkin({
            "booking_id": booking_id,
            "action": "check_in",
            "timestamp": datetime.now(),
            "smart_lock_response": lock_response
        })
        
        # Update booking status
        db.update_booking(booking_id, {"status": BookingStatus.CHECKED_IN})
        
        # Send check-in confirmation email
        await EmailService.send_email(
            current_guest.email,
            "Check-in Confirmation",
            f"""
            Dear {current_guest.first_name},
            
            You have successfully checked in!
            
            Room: {booking.room_number}
            Check-in time: {datetime.now().strftime('%Y-%m-%d %H:%M')}
            
            Enjoy your stay!
            """
        )
        
        return {
            "message": "Check-in successful",
            "room_number": booking.room_number,
            "room_access": lock_response.get("success", False),
            "checkin_id": checkin.id,
            "checkin_time": checkin.timestamp.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Check-in failed: {str(e)}"
        )

@app.post("/checkout/{booking_id}")
async def check_out(
    booking_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    # Get booking
    booking = db.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Validate ownership
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate booking status
    if booking.status != BookingStatus.CHECKED_IN:
        raise HTTPException(
            status_code=400,
            detail="Must be checked in to check out"
        )
    
    try:
        # Control smart lock (lock the room)
        lock_response = await SmartLockService.control_lock(
            booking.room_number, 
            "lock", 
            current_guest.id
        )
        
        # Create check-out record
        checkout = db.create_checkin({
            "booking_id": booking_id,
            "action": "check_out",
            "timestamp": datetime.now(),
            "smart_lock_response": lock_response
        })
        
        # Update booking status
        db.update_booking(booking_id, {"status": BookingStatus.CHECKED_OUT})
        
        # Send check-out confirmation email
        await EmailService.send_email(
            current_guest.email,
            "Check-out Confirmation",
            f"""
            Dear {current_guest.first_name},
            
            You have successfully checked out!
            
            Room: {booking.room_number}
            Check-out time: {datetime.now().strftime('%Y-%m-%d %H:%M')}
            
            Thank you for staying with us!
            """
        )
        
        return {
            "message": "Check-out successful",
            "room_number": booking.room_number,
            "room_secured": lock_response.get("success", False),
            "checkout_id": checkout.id,
            "checkout_time": checkout.timestamp.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Check-out failed: {str(e)}"
        )
```

#### Frontend Check-in/Check-out Component

```typescript
// components/CheckInOut.tsx - Digital room access interface
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Booking {
  id: string
  room_number: string
  check_in_date: string
  check_out_date: string
  status: string
  total_amount: number
}

export function CheckInOut() {
  const { guest } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load guest bookings
  const loadBookings = async () => {
    if (!guest) return

    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter to show only relevant bookings
        const relevantBookings = data.filter((booking: Booking) => 
          ['confirmed', 'checked_in'].includes(booking.status)
        )
        setBookings(relevantBookings)
      }
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Perform check-in
  const handleCheckIn = async (bookingId: string) => {
    setActionLoading(bookingId)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/checkin/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Check-in successful! Room ${result.room_number} is now accessible.`)
        loadBookings() // Refresh bookings
      } else {
        const error = await response.json()
        alert(`Check-in failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Check-in error:', error)
      alert('An error occurred during check-in.')
    } finally {
      setActionLoading(null)
    }
  }

  // Perform check-out
  const handleCheckOut = async (bookingId: string) => {
    setActionLoading(bookingId)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`http://localhost:8000/checkout/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Check-out successful! Room ${result.room_number} has been secured.`)
        loadBookings() // Refresh bookings
      } else {
        const error = await response.json()
        alert(`Check-out failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Check-out error:', error)
      alert('An error occurred during check-out.')
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [guest])

  if (loading) {
    return <div className="text-center">Loading your bookings...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Digital Check-in/Check-out</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No bookings available for check-in/check-out.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Room {booking.room_number}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.check_in_date).toLocaleDateString()} - {' '}
                    {new Date(booking.check_out_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : booking.status === 'checked_in'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {booking.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex space-x-3">
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCheckIn(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {actionLoading === booking.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Checking In...</span>
                      </>
                    ) : (
                      <>
                        <span>🔓</span>
                        <span>Check In</span>
                      </>
                    )}
                  </button>
                )}

                {booking.status === 'checked_in' && (
                  <button
                    onClick={() => handleCheckOut(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {actionLoading === booking.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Checking Out...</span>
                      </>
                    ) : (
                      <>
                        <span>🔒</span>
                        <span>Check Out</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {booking.status === 'confirmed' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    ✅ Your booking is confirmed. You can check in starting from your check-in date.
                  </p>
                </div>
              )}

              {booking.status === 'checked_in' && (
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-700">
                    🏨 You are currently checked in. You can check out anytime before your check-out date.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Error Handling Patterns

### Comprehensive Error Handling

This section shows best practices for handling errors throughout the application.

#### Backend Error Handling

```python
# Custom exception classes
class HotelPlatformException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class BookingNotAvailableException(HotelPlatformException):
    def __init__(self, room_number: str, dates: str):
        super().__init__(
            f"Room {room_number} is not available for {dates}",
            status_code=409
        )

class PaymentProcessingException(HotelPlatformException):
    def __init__(self, details: str):
        super().__init__(
            f"Payment processing failed: {details}",
            status_code=402
        )

# Global exception handler
@app.exception_handler(HotelPlatformException)
async def hotel_exception_handler(request, exc: HotelPlatformException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "type": "hotel_platform_error"}
    )

# Validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "type": "validation_error"
        }
    )

# Example endpoint with comprehensive error handling
@app.post("/bookings", response_model=Booking)
async def create_booking_with_error_handling(
    booking_data: BookingCreate,
    current_guest: Guest = Depends(get_current_guest)
):
    try:
        # Validate guest ownership
        if booking_data.guest_id != current_guest.id:
            raise HotelPlatformException("Cannot create booking for another guest", 403)
        
        # Validate dates
        if booking_data.check_in_date >= booking_data.check_out_date:
            raise HotelPlatformException("Check-out date must be after check-in date")
        
        # Check availability
        if not db.is_room_available(booking_data.room_number, booking_data.check_in_date, booking_data.check_out_date):
            raise BookingNotAvailableException(
                booking_data.room_number,
                f"{booking_data.check_in_date} to {booking_data.check_out_date}"
            )
        
        # Create booking
        booking = db.create_booking({
            **booking_data.dict(),
            "status": BookingStatus.PENDING
        })
        
        # Send emails (non-blocking)
        try:
            await EmailService.send_booking_confirmation(current_guest.email, booking_details)
        except Exception as e:
            # Log email error but don't fail the booking
            print(f"Email notification failed: {e}")
        
        return booking
        
    except HotelPlatformException:
        raise  # Re-raise our custom exceptions
    except Exception as e:
        # Log unexpected errors
        print(f"Unexpected error in create_booking: {e}")
        raise HotelPlatformException("Internal server error occurred", 500)
```

#### Frontend Error Handling

```typescript
// utils/api.ts - API client with error handling
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public type?: string,
    public errors?: any[]
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class APIClient {
  private baseURL: string
  
  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('access_token')
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Handle specific error types
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        throw new APIError('Authentication required', 401)
      }
      
      throw new APIError(
        errorData.detail || `HTTP ${response.status}`,
        response.status,
        errorData.type,
        errorData.errors
      )
    }

    return response.json()
  }

  async createBooking(bookingData: BookingCreateData): Promise<Booking> {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    })
  }

  async uploadDocument(file: File, documentType: string): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)

    return this.request<DocumentUploadResponse>('/documents/upload', {
      method: 'POST',
      headers: {}, // Don't set Content-Type for FormData
      body: formData,
    })
  }
}

// Error boundary component
import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
    
    // Report to error tracking service
    // reportError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h1>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for handling async operations with error states
import { useState, useCallback } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null })

    try {
      const result = await asyncFunction()
      setState({ data: result, loading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : 'An unexpected error occurred'
      
      setState({ data: null, loading: false, error: errorMessage })
      throw error
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { ...state, execute, reset }
}

// Usage example
function BookingForm() {
  const { data: booking, loading, error, execute } = useAsync<Booking>()
  const api = new APIClient('http://localhost:8000')

  const handleSubmit = async (formData: BookingCreateData) => {
    try {
      await execute(() => api.createBooking(formData))
      // Handle success
      alert('Booking created successfully!')
    } catch (error) {
      // Error is already in state, component will show it
      console.error('Booking failed:', error)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(formData)
      }}>
        {/* Form fields */}
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  )
}
```

This comprehensive documentation provides developers with everything they need to understand, integrate, and extend the Hotel Platform APIs and components. Each example includes complete, working code with proper error handling and best practices.