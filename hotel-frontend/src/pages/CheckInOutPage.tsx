import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Key, Loader2, CheckCircle, Clock, Lock, Unlock } from 'lucide-react'
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

interface CheckInOut {
  id: string
  booking_id: string
  action: string
  timestamp: string
  smart_lock_response: any
}

export function CheckInOutPage() {
  const { toast } = useToast()
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [checkInOuts, setCheckInOuts] = useState<CheckInOut[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [roomConfig, setRoomConfig] = useState({
    bnb_mode: false,
    available_rooms: ['101', '102', '201', '202', '301', '302']
  })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchData()
    fetchRoomConfig()
  }, [])

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

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      
      const bookingsResponse = await fetch(`${API_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const checkInOutResponse = await fetch(`${API_URL}/checkin-checkout`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json()
        setBookings(bookingsData.filter((b: Booking) => 
          b.status === 'confirmed' || b.status === 'checked_in'
        ))
      }

      if (checkInOutResponse.ok) {
        const checkInOutData = await checkInOutResponse.json()
        setCheckInOuts(checkInOutData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (bookingId: string, roomNumber: string) => {
    setProcessing(bookingId)
    setError('')

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/checkin-checkout/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          room_number: roomNumber,
          action: 'check_in'
        }),
      })

      if (response.ok) {
        await response.json()
        toast({
          title: "Check-in Successful",
          description: `Welcome! ${roomConfig.bnb_mode ? roomNumber : `Room ${roomNumber}`} is now unlocked.`,
        })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Check-in failed')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setError('Check-in failed. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const handleCheckOut = async (bookingId: string, roomNumber: string) => {
    setProcessing(bookingId)
    setError('')

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/checkin-checkout/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          room_number: roomNumber,
          action: 'check_out'
        }),
      })

      if (response.ok) {
        await response.json()
        toast({
          title: "Check-out Successful",
          description: `Thank you for your stay! ${roomConfig.bnb_mode ? roomNumber : `Room ${roomNumber}`} is now locked.`,
        })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Check-out failed')
      }
    } catch (error) {
      console.error('Check-out error:', error)
      setError('Check-out failed. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Ready for Check-in' },
      checked_in: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Checked In' },
      checked_out: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Checked Out' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.text}</span>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isCheckInAvailable = (booking: Booking) => {
    const checkInDate = new Date(booking.check_in_date)
    const now = new Date()
    return booking.status === 'confirmed' && now >= checkInDate
  }

  const isCheckOutAvailable = (booking: Booking) => {
    return booking.status === 'checked_in'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Check-in/Check-out</h1>
        <p className="text-gray-600">
          Manage your room access with our smart lock system
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Active Bookings */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Bookings</h2>
        
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active bookings</h3>
              <p className="text-gray-600">
                You don't have any confirmed bookings available for check-in/check-out.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {roomConfig.bnb_mode ? booking.room_number : `Room ${booking.room_number}`}
                    </CardTitle>
                    {getStatusBadge(booking.status)}
                  </div>
                  <CardDescription>
                    Booking ID: {booking.id.slice(0, 8)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Check-in:</span>
                      <span className="text-sm font-medium">
                        {formatDate(booking.check_in_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Check-out:</span>
                      <span className="text-sm font-medium">
                        {formatDate(booking.check_out_date)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    {isCheckInAvailable(booking) && (
                      <Button
                        onClick={() => handleCheckIn(booking.id, booking.room_number)}
                        disabled={processing === booking.id}
                        className="flex-1"
                      >
                        {processing === booking.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Unlock className="mr-2 h-4 w-4" />
                            Check In
                          </>
                        )}
                      </Button>
                    )}

                    {isCheckOutAvailable(booking) && (
                      <Button
                        onClick={() => handleCheckOut(booking.id, booking.room_number)}
                        disabled={processing === booking.id}
                        variant="outline"
                        className="flex-1"
                      >
                        {processing === booking.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Check Out
                          </>
                        )}
                      </Button>
                    )}

                    {!isCheckInAvailable(booking) && !isCheckOutAvailable(booking) && (
                      <div className="flex-1 text-center text-sm text-gray-500 py-2">
                        {booking.status === 'confirmed' ? 'Check-in not yet available' : 'Already checked out'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Check-in/Check-out History */}
      {checkInOuts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <Card>
            <CardHeader>
              <CardTitle>Check-in/Check-out History</CardTitle>
              <CardDescription>Your recent room access activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkInOuts.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center space-x-3">
                      {activity.action === 'check_in' ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {activity.action === 'check_in' ? 'Checked In' : 'Checked Out'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Booking: {activity.booking_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
