import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Calendar, FileText, CreditCard, Mail, Database, Settings, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Guest {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  created_at: string
}

interface Booking {
  id: string
  guest_id: string
  room_number: string
  check_in_date: string
  check_out_date: string
  total_amount: number
  status: string
  special_requests?: string
  created_at: string
  guest?: Guest
}

interface Document {
  id: string
  guest_id: string
  file_name: string
  document_type: string
  uploaded_at: string
  guest?: Guest
}

interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  booking?: Booking
}

export function AdminPage() {
  const { guest } = useAuth()
  const { toast } = useToast()
  
  const [guests, setGuests] = useState<Guest[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const [guestsRes, bookingsRes, documentsRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}/admin/guests`, { headers }),
        fetch(`${API_URL}/admin/bookings`, { headers }),
        fetch(`${API_URL}/admin/documents`, { headers }),
        fetch(`${API_URL}/admin/payments`, { headers })
      ])

      if (guestsRes.ok) setGuests(await guestsRes.json())
      if (bookingsRes.ok) setBookings(await bookingsRes.json())
      if (documentsRes.ok) setDocuments(await documentsRes.json())
      if (paymentsRes.ok) setPayments(await paymentsRes.json())
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/admin/send-test-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Test email sent successfully!",
        })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      })
    }
  }

  const submitToAuthority = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/admin/submit-to-authority`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: "Data Submitted",
          description: "Guest data submitted to authority portal successfully!",
        })
      }
    } catch (error) {
      console.error('Error submitting to authority:', error)
      toast({
        title: "Error",
        description: "Failed to submit data to authority portal",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      checked_in: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      checked_out: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
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

  const formatCurrency = (amount: number, currency: string = 'eur') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage your hotel operations and monitor guest activity
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="guests">Guests</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{guests.length}</h3>
                  <p className="text-sm text-gray-600">Total Guests</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{bookings.length}</h3>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{documents.length}</h3>
                  <p className="text-sm text-gray-600">Documents</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </h3>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">Room {booking.room_number}</p>
                      <p className="text-sm text-gray-600">
                        {booking.guest?.first_name} {booking.guest?.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(booking.status)}
                      <p className="text-sm text-gray-600 mt-1">
                        {formatCurrency(booking.total_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guest Management</CardTitle>
              <CardDescription>View and manage guest information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guests.map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{guest.first_name} {guest.last_name}</h3>
                      <p className="text-sm text-gray-600">{guest.email}</p>
                      <p className="text-sm text-gray-600">{guest.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Joined: {formatDate(guest.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>View and manage all bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Room {booking.room_number}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Guest: {booking.guest?.first_name} {booking.guest?.last_name}</p>
                        <p className="text-gray-600">Check-in: {formatDate(booking.check_in_date)}</p>
                        <p className="text-gray-600">Check-out: {formatDate(booking.check_out_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Amount: {formatCurrency(booking.total_amount)}</p>
                        <p className="text-gray-600">Created: {formatDate(booking.created_at)}</p>
                        {booking.special_requests && (
                          <p className="text-gray-600">Requests: {booking.special_requests}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>View uploaded guest documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">{document.file_name}</h3>
                        <p className="text-sm text-gray-600">
                          {document.guest?.first_name} {document.guest?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Type: {document.document_type.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Uploaded: {formatDate(document.uploaded_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>View payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Booking: {payment.booking?.room_number ? `Room ${payment.booking.room_number}` : payment.booking_id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {formatDate(payment.created_at)}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Email Notifications</span>
                </CardTitle>
                <CardDescription>
                  Send test emails and manage notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={sendTestEmail} className="w-full">
                  Send Test Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Authority Portal</span>
                </CardTitle>
                <CardDescription>
                  Submit guest data to authority portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={submitToAuthority} className="w-full">
                  Submit to Authority
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
