from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"

class DocumentType(str, Enum):
    PASSPORT = "passport"
    ID_CARD = "id_card"
    DRIVER_LICENSE = "driver_license"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class Guest(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    created_at: Optional[datetime] = None

class GuestCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str

class Document(BaseModel):
    id: Optional[str] = None
    guest_id: str
    document_type: DocumentType
    file_path: str
    file_name: str
    uploaded_at: Optional[datetime] = None

class DocumentUpload(BaseModel):
    document_type: DocumentType

class Booking(BaseModel):
    id: Optional[str] = None
    guest_id: str
    room_number: str
    check_in_date: datetime
    check_out_date: datetime
    total_amount: float
    status: BookingStatus
    special_requests: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class BookingCreate(BaseModel):
    guest_id: str
    room_number: str
    check_in_date: datetime
    check_out_date: datetime
    total_amount: float
    special_requests: Optional[str] = None

class BookingUpdate(BaseModel):
    room_number: Optional[str] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    special_requests: Optional[str] = None

class Payment(BaseModel):
    id: Optional[str] = None
    booking_id: str
    amount: float
    currency: str = "eur"
    stripe_payment_intent_id: Optional[str] = None
    status: PaymentStatus
    created_at: Optional[datetime] = None

class PaymentCreate(BaseModel):
    booking_id: str
    amount: float
    currency: str = "eur"

class CheckInOut(BaseModel):
    id: Optional[str] = None
    booking_id: str
    action: str  # "check_in" or "check_out"
    timestamp: datetime
    smart_lock_response: Optional[dict] = None

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

class OTPRequest(BaseModel):
    email: EmailStr

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    guest: Guest

class SmartLockRequest(BaseModel):
    room_number: str
    action: str  # "unlock" or "lock"
    guest_id: str

class EmailNotification(BaseModel):
    to_email: str
    subject: str
    body: str
    booking_id: Optional[str] = None
