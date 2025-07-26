import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Booking {
  id: string
  room_number: string
  check_in_date: string
  check_out_date: string
  total_amount: number
  status: string
  guest_id: string
}

export function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending')
  const [roomConfig, setRoomConfig] = useState({
    bnb_mode: false,
    available_rooms: ['101', '102', '201', '202', '301', '302']
  })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
      fetchRoomConfig()
    }
  }, [bookingId])

  const fetchRoomConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/config/rooms`)
      if (response.ok) {
        const config = await response.json()
        setRoomConfig(config)
      }
    } catch (error) {
      console.error('Failed to fetch room config:', error)
    }
  }

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBooking(data)
      } else {
        setError('Booking not found')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!booking) return

    setProcessing(true)
    setPaymentStatus('processing')
    setError('')

    try {
      const token = localStorage.getItem('access_token')
      
      const paymentResponse = await fetch(`${API_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: booking.id,
          amount: booking.total_amount,
          currency: 'eur'
        }),
      })

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json()
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const confirmResponse = await fetch(`${API_URL}/payments/${paymentData.payment_id}/confirm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (confirmResponse.ok) {
          setPaymentStatus('success')
          toast({
            title: "Payment Successful",
            description: "Your booking has been confirmed!",
          })
          
          setTimeout(() => {
            navigate('/')
          }, 3000)
        } else {
          throw new Error('Payment confirmation failed')
        }
      } else {
        throw new Error('Payment creation failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('failed')
      setError('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Not Found</h3>
            <p className="text-gray-600 mb-4">
              The booking you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
        <p className="text-gray-600">
          Secure your booking with payment
        </p>
      </div>

      {/* Booking Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
          <CardDescription>Review your booking details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-medium">{booking.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Room:</span>
              <span className="font-medium">
                {roomConfig.bnb_mode ? booking.room_number : `Room ${booking.room_number}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">{formatDate(booking.check_in_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium">{formatDate(booking.check_out_date)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>€{booking.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment</span>
          </CardTitle>
          <CardDescription>
            Complete your payment to confirm the booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'success' && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Payment successful! Your booking has been confirmed. Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'failed' && (
            <Alert className="mb-6" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Payment failed. Please try again or contact support.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Test Mode</h4>
              <p className="text-sm text-blue-700">
                This is a demo payment system. In production, this would integrate with Stripe for secure payment processing.
              </p>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1"
                disabled={processing || paymentStatus === 'success'}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentStatus === 'success' ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Payment Complete
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay €{booking.total_amount.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
