import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Document {
  id: string
  guest_id: string
  document_type: string
  file_name: string
  file_path: string
  uploaded_at: string
}

export function DocumentsPage() {
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<string>('passport')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid file type (JPEG, PNG, or PDF)')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')

    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('document_type', documentType)

      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        await response.json()
        toast({
          title: "Upload Successful",
          description: "Your document has been uploaded successfully.",
        })
        setSelectedFile(null)
        setDocumentType('passport')
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        fetchDocuments() // Refresh documents list
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getDocumentTypeBadge = (type: string) => {
    const typeConfig = {
      passport: { color: 'bg-blue-100 text-blue-800', text: 'Passport' },
      id_card: { color: 'bg-green-100 text-green-800', text: 'ID Card' },
      driver_license: { color: 'bg-purple-100 text-purple-800', text: 'Driver License' },
    }

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.passport

    return (
      <Badge className={config.color}>
        {config.text}
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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    return extension === 'pdf' ? (
      <FileText className="w-5 h-5 text-red-600" />
    ) : (
      <FileText className="w-5 h-5 text-blue-600" />
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Documents</h1>
        <p className="text-gray-600">
          Upload your identity documents for verification and compliance
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Document</span>
          </CardTitle>
          <CardDescription>
            Upload a clear photo or scan of your identity document (JPEG, PNG, or PDF, max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document_type">Document Type</Label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="passport">Passport</option>
                <option value="id_card">ID Card</option>
                <option value="driver_license">Driver License</option>
              </select>
            </div>

            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Ensure the document is clearly visible and readable</li>
                <li>• All corners of the document should be visible</li>
                <li>• Avoid glare, shadows, or blurry images</li>
                <li>• Personal information will be handled securely and in compliance with privacy laws</li>
              </ul>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Documents</h2>
        
        {documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents uploaded</h3>
              <p className="text-gray-600">
                Upload your first identity document to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getFileIcon(document.file_name)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{document.file_name}</h3>
                        <p className="text-sm text-gray-600">
                          Uploaded on {formatDate(document.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getDocumentTypeBadge(document.document_type)}
                      <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Uploaded</span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Notice */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Data Protection & Compliance</h4>
              <p className="text-sm text-blue-700">
                Your documents are securely stored and processed in compliance with local regulations. 
                Document data may be shared with relevant authorities as required by law for guest registration 
                and security purposes. We implement industry-standard security measures to protect your personal information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
