# Hotel Platform Backend Services Reference

## Overview

The Hotel Platform backend uses a service-oriented architecture with specialized service classes handling different aspects of the business logic. All services are designed to be asynchronous and handle both real implementations and simulated fallbacks when external services are not configured.

**Service Classes:**
- `PaymentService` - Stripe payment processing
- `EmailService` - Email notifications and OTP delivery
- `SmartLockService` - Smart lock control and room access
- `DocumentService` - File upload and document management
- `AuthorityService` - Guest data submission to compliance portals

## PaymentService

Handles all payment processing through Stripe integration with fallback simulation mode.

**File:** `hotel-backend/app/services.py`

### create_payment_intent

Creates a Stripe payment intent for processing guest payments.

```python
@staticmethod
async def create_payment_intent(amount: float, currency: str = "eur") -> dict
```

**Parameters:**
- `amount` (float): Payment amount in the specified currency
- `currency` (str, optional): Currency code (default: "eur")

**Returns:**
```python
{
    "client_secret": str,      # Stripe client secret for frontend
    "payment_intent_id": str   # Stripe payment intent ID
}
```

**Behavior:**
- **With Stripe configured**: Creates real Stripe payment intent
- **Without Stripe**: Returns simulated payment data with demo IDs

**Example Usage:**
```python
# Create payment intent for €299.99
intent_data = await PaymentService.create_payment_intent(299.99, "eur")

# Use client_secret in frontend for payment confirmation
client_secret = intent_data["client_secret"]
payment_id = intent_data["payment_intent_id"]
```

**Error Handling:**
- Raises `Exception` with Stripe error details if payment creation fails
- Automatically falls back to simulation mode if Stripe is not configured

### confirm_payment

Confirms and validates a payment with Stripe.

```python
@staticmethod
async def confirm_payment(payment_intent_id: str) -> bool
```

**Parameters:**
- `payment_intent_id` (str): Stripe payment intent ID to confirm

**Returns:**
- `bool`: True if payment was successful, False otherwise

**Behavior:**
- **With Stripe configured**: Retrieves payment intent and checks status
- **Without Stripe**: Always returns True for simulation

**Example Usage:**
```python
# Confirm payment after frontend processes card
success = await PaymentService.confirm_payment("pi_1234567890")

if success:
    # Update booking status to confirmed
    db.update_booking(booking_id, {"status": "confirmed"})
else:
    # Handle payment failure
    db.update_payment(payment_id, {"status": "failed"})
```

**Payment Status Mapping:**
- Stripe `succeeded` status → `True`
- Any other status → `False`
- Simulation mode → Always `True`

## EmailService

Manages email communications including OTP delivery and booking confirmations.

### send_email

Base email sending method with SMTP configuration.

```python
@staticmethod
async def send_email(to_email: str, subject: str, body: str) -> bool
```

**Parameters:**
- `to_email` (str): Recipient email address
- `subject` (str): Email subject line
- `body` (str): Email body content (plain text)

**Returns:**
- `bool`: True if email was sent successfully

**Environment Variables:**
- `EMAIL_HOST`: SMTP server hostname (default: "smtp.gmail.com")
- `EMAIL_PORT`: SMTP server port (default: 587)
- `EMAIL_USER`: SMTP username/email
- `EMAIL_PASSWORD`: SMTP password/app password

**Behavior:**
- **With email configured**: Sends real email via SMTP
- **Without email**: Prints to console and returns True

**Example Usage:**
```python
success = await EmailService.send_email(
    "guest@example.com",
    "Welcome to Hotel Platform",
    "Thank you for registering with us!"
)
```

### send_otp_email

Sends OTP (One-Time Password) for authentication.

```python
@staticmethod
async def send_otp_email(email: str, otp: str) -> bool
```

**Parameters:**
- `email` (str): Guest email address
- `otp` (str): 6-digit OTP code

**Returns:**
- `bool`: True if OTP email was sent successfully

**Email Template:**
```
Subject: Your Hotel Booking OTP Code

Your OTP code for hotel booking authentication is: {otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.
```

**Example Usage:**
```python
otp = generate_otp()  # From auth module
success = await EmailService.send_otp_email("guest@example.com", otp)

if success:
    print("OTP sent successfully")
else:
    print("Failed to send OTP")
```

### send_booking_confirmation

Sends booking confirmation email with details.

```python
@staticmethod
async def send_booking_confirmation(email: str, booking_details: dict) -> bool
```

**Parameters:**
- `email` (str): Guest email address
- `booking_details` (dict): Booking information dictionary

**Required booking_details keys:**
- `guest_name` (str): Guest's full name
- `booking_id` (str): Booking ID
- `room_number` (str): Room number
- `check_in_date` (str): Check-in date
- `check_out_date` (str): Check-out date
- `total_amount` (float): Total booking amount

**Returns:**
- `bool`: True if confirmation email was sent successfully

**Email Template:**
```
Subject: Booking Confirmation - Hotel Platform

Dear {guest_name},

Your booking has been confirmed!

Booking Details:
- Booking ID: {booking_id}
- Room: {room_number}
- Check-in: {check_in_date}
- Check-out: {check_out_date}
- Total Amount: €{total_amount}

Thank you for choosing our hotel!
```

**Example Usage:**
```python
booking_details = {
    "guest_name": "John Doe",
    "booking_id": "booking_123",
    "room_number": "101",
    "check_in_date": "2024-01-15",
    "check_out_date": "2024-01-18",
    "total_amount": 299.99
}

success = await EmailService.send_booking_confirmation(
    "guest@example.com", 
    booking_details
)
```

## SmartLockService

Controls smart lock devices for automated room access.

### control_lock

Controls smart lock actions (unlock/lock) for guest room access.

```python
@staticmethod
async def control_lock(room_number: str, action: str, guest_id: str) -> dict
```

**Parameters:**
- `room_number` (str): Room number to control
- `action` (str): Lock action ("unlock" or "lock")
- `guest_id` (str): Guest ID for access logging

**Returns:**
```python
{
    "success": bool,           # True if action was successful
    "room_number": str,        # Room number that was controlled
    "action": str,             # Action that was performed
    "guest_id": str,           # Guest ID who performed action
    "timestamp": str,          # ISO timestamp of action
    "lock_status": str,        # Current lock status ("unlocked"/"locked")
    "message": str             # Human-readable status message
}
```

**Environment Variables:**
- `SMART_LOCK_API_URL`: Smart lock API endpoint (optional)

**Behavior:**
- Always returns simulated response (real API integration can be added)
- Logs action to console for debugging
- Includes timestamp and status information

**Example Usage:**
```python
# Unlock room during check-in
response = await SmartLockService.control_lock("101", "unlock", "guest_123")

if response["success"]:
    print(f"Room {response['room_number']} unlocked successfully")
else:
    print(f"Failed to unlock room: {response.get('message')}")

# Lock room during check-out
response = await SmartLockService.control_lock("101", "lock", "guest_123")
```

**Supported Actions:**
- `"unlock"`: Unlock the room door
- `"lock"`: Lock the room door

**Error Handling:**
```python
# On error, returns failure response
{
    "success": False,
    "error": "Error description",
    "message": "Failed to {action} room {room_number}"
}
```

## DocumentService

Handles file upload and document storage for identity verification.

### save_document

Saves uploaded document files to secure storage.

```python
@staticmethod
async def save_document(file_content: bytes, filename: str, guest_id: str) -> str
```

**Parameters:**
- `file_content` (bytes): Raw file content from upload
- `filename` (str): Original filename from upload
- `guest_id` (str): Guest ID for file organization

**Returns:**
- `str`: File path where document was saved

**Storage Location:**
- Base directory: `/tmp/documents/` (configurable)
- File naming: `{guest_id}_{filename}`
- Directory is created automatically if it doesn't exist

**Example Usage:**
```python
# In upload endpoint
file_content = await file.read()
file_path = await DocumentService.save_document(
    file_content, 
    file.filename, 
    current_guest.id
)

# Store file path in database
document = db.create_document({
    "guest_id": current_guest.id,
    "document_type": document_type,
    "file_path": file_path,
    "file_name": file.filename
})
```

**Security Considerations:**
- Files are stored outside web root
- Filename includes guest ID to prevent conflicts
- Directory permissions should be restricted
- Consider virus scanning for production

**File Organization:**
```
/tmp/documents/
├── guest_123_passport.pdf
├── guest_123_id_card.jpg
├── guest_456_driver_license.png
└── ...
```

## AuthorityService

Submits guest and booking data to compliance authorities and regulatory portals.

### send_guest_data

Submits guest and booking information to authority compliance portals.

```python
@staticmethod
async def send_guest_data(guest_data: dict, booking_data: dict) -> dict
```

**Parameters:**
- `guest_data` (dict): Guest information dictionary
- `booking_data` (dict): Booking information dictionary

**Required guest_data keys:**
- `first_name` (str): Guest's first name
- `last_name` (str): Guest's last name
- `email` (str): Guest's email address
- `phone` (str): Guest's phone number

**Required booking_data keys:**
- `id` (str): Booking ID
- `room_number` (str): Room number
- `check_in_date` (datetime): Check-in date
- `check_out_date` (datetime): Check-out date

**Returns:**
```python
{
    "success": bool,           # True if submission was successful
    "submission_id": str,      # Authority submission ID
    "data": dict              # Submitted data structure
}
```

**Authority Data Structure:**
```python
{
    "guest_info": {
        "name": str,           # Full name
        "email": str,          # Email address
        "phone": str           # Phone number
    },
    "booking_info": {
        "booking_id": str,     # Booking ID
        "room_number": str,    # Room number
        "check_in_date": str,  # ISO date string
        "check_out_date": str  # ISO date string
    },
    "submission_timestamp": str,  # ISO timestamp
    "status": "submitted"
}
```

**Example Usage:**
```python
# Submit data after booking creation
guest_data = {
    "first_name": "John",
    "last_name": "Doe", 
    "email": "john@example.com",
    "phone": "+1234567890"
}

booking_data = {
    "id": "booking_123",
    "room_number": "101",
    "check_in_date": datetime(2024, 1, 15),
    "check_out_date": datetime(2024, 1, 18)
}

result = await AuthorityService.send_guest_data(guest_data, booking_data)

if result["success"]:
    print(f"Data submitted with ID: {result['submission_id']}")
else:
    print(f"Submission failed: {result.get('error')}")
```

**Compliance Features:**
- Automatic data submission on booking creation
- Submission ID tracking for auditing
- Structured data format for authority requirements
- Error handling and retry capabilities

**Error Response:**
```python
{
    "success": False,
    "error": "Error description"
}
```

## Service Integration Patterns

### Dependency Injection

Services are imported and used directly in FastAPI endpoints:

```python
from .services import PaymentService, EmailService, SmartLockService

@app.post("/bookings")
async def create_booking(booking_data: BookingCreate):
    # Create booking
    booking = db.create_booking(booking_data.dict())
    
    # Send confirmation email
    await EmailService.send_booking_confirmation(
        guest.email, 
        booking_details
    )
    
    # Submit to authorities
    await AuthorityService.send_guest_data(
        guest.dict(), 
        booking.dict()
    )
    
    return booking
```

### Error Handling

All services include comprehensive error handling:

```python
try:
    result = await PaymentService.create_payment_intent(amount)
    return {"success": True, "data": result}
except Exception as e:
    print(f"Payment service error: {str(e)}")
    raise HTTPException(status_code=400, detail=str(e))
```

### Configuration Management

Services check environment variables for configuration:

```python
# Check if service is configured
stripe_key = os.getenv("STRIPE_SECRET_KEY")
if not stripe_key:
    # Use simulation mode
    return simulate_payment()
else:
    # Use real service
    return process_real_payment()
```

### Async/Await Patterns

All service methods are asynchronous for optimal performance:

```python
# Sequential operations
result1 = await EmailService.send_otp_email(email, otp)
result2 = await AuthorityService.send_guest_data(guest, booking)

# Concurrent operations
results = await asyncio.gather(
    EmailService.send_booking_confirmation(email, details),
    AuthorityService.send_guest_data(guest, booking),
    SmartLockService.control_lock(room, "unlock", guest_id)
)
```

## Testing Services

### Unit Testing

Each service method should be tested independently:

```python
import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_payment_service_create_intent():
    with patch('stripe.PaymentIntent.create') as mock_create:
        mock_create.return_value.client_secret = "test_secret"
        mock_create.return_value.id = "test_id"
        
        result = await PaymentService.create_payment_intent(100.0)
        
        assert result["client_secret"] == "test_secret"
        assert result["payment_intent_id"] == "test_id"
```

### Integration Testing

Test service interactions with external APIs:

```python
@pytest.mark.asyncio
async def test_email_service_integration():
    # Test with real SMTP configuration
    success = await EmailService.send_email(
        "test@example.com",
        "Test Subject", 
        "Test Body"
    )
    assert success is True
```

### Mock Testing

Mock external services for reliable testing:

```python
@pytest.mark.asyncio 
async def test_smart_lock_service_mock():
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value.json.return_value = {
            "success": True,
            "status": "unlocked"
        }
        
        result = await SmartLockService.control_lock("101", "unlock", "guest_123")
        assert result["success"] is True
```

## Production Considerations

### Security

- Store sensitive configuration in environment variables
- Use secure file storage with proper permissions
- Implement rate limiting for external API calls
- Validate all input data before processing

### Performance

- Use connection pooling for database and HTTP clients
- Implement caching for frequently accessed data
- Monitor service response times and error rates
- Use async/await for all I/O operations

### Monitoring

- Log all service interactions for debugging
- Track success/failure rates for each service
- Monitor external service availability
- Implement health checks for critical services

### Scalability

- Design services to be stateless
- Use message queues for heavy operations
- Implement circuit breakers for external services
- Consider service-to-service authentication