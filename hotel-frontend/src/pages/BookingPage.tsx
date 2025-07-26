import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function BookingPage() {
  const { guest } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    room_number: 'Suite',
    total_amount: 0,
    special_requests: ''
  })
  
  
  const checkInRef = useRef<HTMLInputElement>(null)
  const checkOutRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const checkInValue = checkInRef.current?.value || ''
    const checkOutValue = checkOutRef.current?.value || ''
    
    console.log('Debug - checkInValue from ref:', checkInValue)
    console.log('Debug - checkOutValue from ref:', checkOutValue)
    
    const checkIn = new Date(checkInValue)
    const checkOut = new Date(checkOutValue)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(checkInValue)) {
      setError('Check-in date must be in YYYY-MM-DD format')
      setLoading(false)
      return
    }
    
    if (!dateRegex.test(checkOutValue)) {
      setError('Check-out date must be in YYYY-MM-DD format')
      setLoading(false)
      return
    }

    if (checkIn < today) {
      setError('Check-in date cannot be in the past')
      setLoading(false)
      return
    }

    if (checkOut <= checkIn) {
      setError('Check-out date must be after check-in date')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_number: formData.room_number,
          check_in_date: checkInValue,
          check_out_date: checkOutValue,
          total_amount: formData.total_amount,
          special_requests: formData.special_requests,
          guest_id: guest?.id,
        }),
      })

      if (response.ok) {
        const booking = await response.json()
        toast({
          title: "Booking Created",
          description: "Your booking has been created successfully!",
        })
        navigate(`/payment/${booking.id}`)
      } else {
        const errorData = await response.json()
        let errorMessage = 'Failed to create booking'
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => err.msg || err).join(', ')
          } else {
            errorMessage = JSON.stringify(errorData.detail)
          }
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    console.log(`handleChange: ${name} = ${value}`)
    
    let processedValue: string | number = value
    if (name === 'total_amount') {
      processedValue = parseFloat(value) || 0
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
  }
  
  const handleDateChange = () => {
    const checkInValue = checkInRef.current?.value || ''
    const checkOutValue = checkOutRef.current?.value || ''
    
    if (checkInValue && checkOutValue) {
      const checkIn = new Date(checkInValue)
      const checkOut = new Date(checkOutValue)
      if (checkIn < checkOut) {
        const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const calculatedTotal = diffDays * 120
        setFormData(prev => ({
          ...prev,
          total_amount: calculatedTotal
        }))
      }
    }
  }

  const calculateNights = () => {
    const checkInValue = checkInRef.current?.value || ''
    const checkOutValue = checkOutRef.current?.value || ''
    
    if (checkInValue && checkOutValue) {
      const checkIn = new Date(checkInValue)
      const checkOut = new Date(checkOutValue)
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return 0
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Make a Booking</h1>
        <p className="text-gray-600">
          Reserve your room and enjoy your stay with us
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Booking Details</span>
          </CardTitle>
          <CardDescription>
            Fill in the details for your reservation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Booking for: Suite</h3>
              <p className="text-sm text-blue-700">Our beautiful single room accommodation</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_date">Check-in Date</Label>
                <input
                  ref={checkInRef}
                  id="check_in_date"
                  name="check_in_date"
                  type="text"
                  placeholder="YYYY-MM-DD"
                  onChange={handleDateChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="check_out_date">Check-out Date</Label>
                <input
                  ref={checkOutRef}
                  id="check_out_date"
                  name="check_out_date"
                  type="text"
                  placeholder="YYYY-MM-DD"
                  onChange={handleDateChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {calculateNights() > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="font-medium">{calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-600">Rate per night:</span>
                  <span className="font-medium">€120</span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-blue-200">
                  <span className="font-semibold">Estimated Total:</span>
                  <span className="font-bold text-lg">€{(calculateNights() * 120).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="total_amount">Total Amount (€)</Label>
              <Input
                id="total_amount"
                name="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={handleChange}
                required
                className="mt-1"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="special_requests">Special Requests (Optional)</Label>
              <Textarea
                id="special_requests"
                name="special_requests"
                value={formData.special_requests}
                onChange={handleChange}
                placeholder="Any special requests or preferences..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  'Create Booking'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
