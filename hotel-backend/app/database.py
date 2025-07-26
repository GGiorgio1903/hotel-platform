from typing import Dict, List, Optional
from datetime import datetime
import uuid
import os
from .models import Guest, Booking, Document, Payment, CheckInOut

class InMemoryDatabase:
    def __init__(self):
        self.guests: Dict[str, Guest] = {}
        self.bookings: Dict[str, Booking] = {}
        self.documents: Dict[str, Document] = {}
        self.payments: Dict[str, Payment] = {}
        self.checkins: Dict[str, CheckInOut] = {}
        self.otps: Dict[str, str] = {}  # email -> otp
        
    def create_guest(self, guest_data: dict) -> Guest:
        guest_id = str(uuid.uuid4())
        guest = Guest(
            id=guest_id,
            created_at=datetime.now(),
            **guest_data
        )
        self.guests[guest_id] = guest
        return guest
    
    def get_guest_by_email(self, email: str) -> Optional[Guest]:
        for guest in self.guests.values():
            if guest.email == email:
                return guest
        return None
    
    def get_guest_by_id(self, guest_id: str) -> Optional[Guest]:
        return self.guests.get(guest_id)
    
    def create_booking(self, booking_data: dict) -> Booking:
        booking_id = str(uuid.uuid4())
        booking = Booking(
            id=booking_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            **booking_data
        )
        self.bookings[booking_id] = booking
        return booking
    
    def get_booking_by_id(self, booking_id: str) -> Optional[Booking]:
        return self.bookings.get(booking_id)
    
    def get_bookings_by_guest(self, guest_id: str) -> List[Booking]:
        return [booking for booking in self.bookings.values() if booking.guest_id == guest_id]
    
    def update_booking(self, booking_id: str, update_data: dict) -> Optional[Booking]:
        if booking_id in self.bookings:
            booking = self.bookings[booking_id]
            for key, value in update_data.items():
                if hasattr(booking, key) and value is not None:
                    setattr(booking, key, value)
            booking.updated_at = datetime.now()
            return booking
        return None
    
    def delete_booking(self, booking_id: str) -> bool:
        if booking_id in self.bookings:
            del self.bookings[booking_id]
            return True
        return False
    
    def create_document(self, document_data: dict) -> Document:
        document_id = str(uuid.uuid4())
        document = Document(
            id=document_id,
            uploaded_at=datetime.now(),
            **document_data
        )
        self.documents[document_id] = document
        return document
    
    def get_documents_by_guest(self, guest_id: str) -> List[Document]:
        return [doc for doc in self.documents.values() if doc.guest_id == guest_id]
    
    def create_payment(self, payment_data: dict) -> Payment:
        payment_id = str(uuid.uuid4())
        payment = Payment(
            id=payment_id,
            created_at=datetime.now(),
            **payment_data
        )
        self.payments[payment_id] = payment
        return payment
    
    def get_payment_by_booking(self, booking_id: str) -> Optional[Payment]:
        for payment in self.payments.values():
            if payment.booking_id == booking_id:
                return payment
        return None
    
    def update_payment(self, payment_id: str, update_data: dict) -> Optional[Payment]:
        if payment_id in self.payments:
            payment = self.payments[payment_id]
            for key, value in update_data.items():
                if hasattr(payment, key):
                    setattr(payment, key, value)
            return payment
        return None
    
    def create_checkin(self, checkin_data: dict) -> CheckInOut:
        checkin_id = str(uuid.uuid4())
        checkin = CheckInOut(
            id=checkin_id,
            **checkin_data
        )
        self.checkins[checkin_id] = checkin
        return checkin
    
    def get_checkins_by_booking(self, booking_id: str) -> List[CheckInOut]:
        return [checkin for checkin in self.checkins.values() if checkin.booking_id == booking_id]
    
    def store_otp(self, email: str, otp: str):
        self.otps[email] = otp
    
    def verify_otp(self, email: str, otp: str) -> bool:
        stored_otp = self.otps.get(email)
        print(f"OTP Verification Debug: email={email}, provided_otp={otp}, stored_otp={stored_otp}")
        if stored_otp and stored_otp == otp:
            del self.otps[email]  # Remove OTP after verification
            print(f"OTP Verification: SUCCESS for {email}")
            return True
        print(f"OTP Verification: FAILED for {email}")
        return False

def get_database():
    if os.getenv("DATABASE_URL"):
        from .database_postgres import PostgreSQLDatabase
        return PostgreSQLDatabase()
    else:
        return InMemoryDatabase()

db = get_database()
