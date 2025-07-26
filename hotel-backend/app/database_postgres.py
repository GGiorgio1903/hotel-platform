from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import uuid
import os
from .models import Guest, Booking, Document, Payment, CheckInOut
from .models_db import Base, GuestTable, BookingTable, DocumentTable, PaymentTable, CheckInOutTable, OTPTable

class PostgreSQLDatabase:
    def __init__(self):
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
        
        self.engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self) -> Session:
        return self.SessionLocal()
    
    def create_guest(self, guest_data: dict) -> Guest:
        with self.get_session() as session:
            guest_table = GuestTable(**guest_data)
            session.add(guest_table)
            session.commit()
            session.refresh(guest_table)
            
            return Guest(
                id=str(guest_table.id),
                email=guest_table.email,
                first_name=guest_table.first_name,
                last_name=guest_table.last_name,
                phone=guest_table.phone,
                created_at=guest_table.created_at
            )
    
    def get_guest_by_email(self, email: str) -> Optional[Guest]:
        with self.get_session() as session:
            guest_table = session.query(GuestTable).filter(GuestTable.email == email).first()
            if guest_table:
                return Guest(
                    id=str(guest_table.id),
                    email=guest_table.email,
                    first_name=guest_table.first_name,
                    last_name=guest_table.last_name,
                    phone=guest_table.phone,
                    created_at=guest_table.created_at
                )
            return None
    
    def get_guest_by_id(self, guest_id: str) -> Optional[Guest]:
        with self.get_session() as session:
            guest_table = session.query(GuestTable).filter(GuestTable.id == guest_id).first()
            if guest_table:
                return Guest(
                    id=str(guest_table.id),
                    email=guest_table.email,
                    first_name=guest_table.first_name,
                    last_name=guest_table.last_name,
                    phone=guest_table.phone,
                    created_at=guest_table.created_at
                )
            return None
    
    def check_room_availability(self, room_number: str, check_in_date: datetime, check_out_date: datetime, exclude_booking_id: str = None) -> bool:
        """Check if a room is available for the given date range"""
        with self.get_session() as session:
            query = session.query(BookingTable).filter(
                BookingTable.room_number == room_number,
                BookingTable.status.in_(['pending', 'confirmed', 'checked_in']),
                BookingTable.check_in_date < check_out_date,
                BookingTable.check_out_date > check_in_date
            )
            
            if exclude_booking_id:
                query = query.filter(BookingTable.id != exclude_booking_id)
            
            conflicting_bookings = query.all()
            return len(conflicting_bookings) == 0

    def create_booking(self, booking_data: dict) -> Booking:
        if not self.check_room_availability(
            booking_data['room_number'], 
            booking_data['check_in_date'], 
            booking_data['check_out_date']
        ):
            raise ValueError(f"Room {booking_data['room_number']} is not available for the selected dates")
            
        with self.get_session() as session:
            booking_table = BookingTable(**booking_data)
            session.add(booking_table)
            session.commit()
            session.refresh(booking_table)
            
            return Booking(
                id=str(booking_table.id),
                guest_id=str(booking_table.guest_id),
                room_number=booking_table.room_number,
                check_in_date=booking_table.check_in_date,
                check_out_date=booking_table.check_out_date,
                total_amount=booking_table.total_amount,
                status=booking_table.status,
                special_requests=booking_table.special_requests,
                created_at=booking_table.created_at,
                updated_at=booking_table.updated_at
            )
    
    def get_booking_by_id(self, booking_id: str) -> Optional[Booking]:
        with self.get_session() as session:
            booking_table = session.query(BookingTable).filter(BookingTable.id == booking_id).first()
            if booking_table:
                return Booking(
                    id=str(booking_table.id),
                    guest_id=str(booking_table.guest_id),
                    room_number=booking_table.room_number,
                    check_in_date=booking_table.check_in_date,
                    check_out_date=booking_table.check_out_date,
                    total_amount=booking_table.total_amount,
                    status=booking_table.status,
                    special_requests=booking_table.special_requests,
                    created_at=booking_table.created_at,
                    updated_at=booking_table.updated_at
                )
            return None
    
    def get_bookings_by_guest(self, guest_id: str) -> List[Booking]:
        with self.get_session() as session:
            booking_tables = session.query(BookingTable).filter(BookingTable.guest_id == guest_id).all()
            return [
                Booking(
                    id=str(booking_table.id),
                    guest_id=str(booking_table.guest_id),
                    room_number=booking_table.room_number,
                    check_in_date=booking_table.check_in_date,
                    check_out_date=booking_table.check_out_date,
                    total_amount=booking_table.total_amount,
                    status=booking_table.status,
                    special_requests=booking_table.special_requests,
                    created_at=booking_table.created_at,
                    updated_at=booking_table.updated_at
                )
                for booking_table in booking_tables
            ]
    
    def update_booking(self, booking_id: str, update_data: dict) -> Optional[Booking]:
        with self.get_session() as session:
            booking_table = session.query(BookingTable).filter(BookingTable.id == booking_id).first()
            if booking_table:
                if any(key in update_data for key in ['room_number', 'check_in_date', 'check_out_date']):
                    room_number = update_data.get('room_number', booking_table.room_number)
                    check_in_date = update_data.get('check_in_date', booking_table.check_in_date)
                    check_out_date = update_data.get('check_out_date', booking_table.check_out_date)
                    
                    if not self.check_room_availability(room_number, check_in_date, check_out_date, booking_id):
                        raise ValueError(f"Room {room_number} is not available for the selected dates")
                
                for key, value in update_data.items():
                    if hasattr(booking_table, key) and value is not None:
                        setattr(booking_table, key, value)
                booking_table.updated_at = datetime.utcnow()
                session.commit()
                session.refresh(booking_table)
                
                return Booking(
                    id=str(booking_table.id),
                    guest_id=str(booking_table.guest_id),
                    room_number=booking_table.room_number,
                    check_in_date=booking_table.check_in_date,
                    check_out_date=booking_table.check_out_date,
                    total_amount=booking_table.total_amount,
                    status=booking_table.status,
                    special_requests=booking_table.special_requests,
                    created_at=booking_table.created_at,
                    updated_at=booking_table.updated_at
                )
            return None
    
    def delete_booking(self, booking_id: str) -> bool:
        with self.get_session() as session:
            booking_table = session.query(BookingTable).filter(BookingTable.id == booking_id).first()
            if booking_table:
                session.delete(booking_table)
                session.commit()
                return True
            return False
    
    def create_document(self, document_data: dict) -> Document:
        with self.get_session() as session:
            document_table = DocumentTable(**document_data)
            session.add(document_table)
            session.commit()
            session.refresh(document_table)
            
            return Document(
                id=str(document_table.id),
                guest_id=str(document_table.guest_id),
                document_type=document_table.document_type,
                file_name=document_table.file_name,
                file_path=document_table.file_path,
                uploaded_at=document_table.uploaded_at
            )
    
    def get_documents_by_guest(self, guest_id: str) -> List[Document]:
        with self.get_session() as session:
            document_tables = session.query(DocumentTable).filter(DocumentTable.guest_id == guest_id).all()
            return [
                Document(
                    id=str(document_table.id),
                    guest_id=str(document_table.guest_id),
                    document_type=document_table.document_type,
                    file_name=document_table.file_name,
                    file_path=document_table.file_path,
                    uploaded_at=document_table.uploaded_at
                )
                for document_table in document_tables
            ]
    
    def create_payment(self, payment_data: dict) -> Payment:
        with self.get_session() as session:
            payment_table = PaymentTable(**payment_data)
            session.add(payment_table)
            session.commit()
            session.refresh(payment_table)
            
            return Payment(
                id=str(payment_table.id),
                booking_id=str(payment_table.booking_id),
                amount=payment_table.amount,
                currency=payment_table.currency,
                status=payment_table.status,
                stripe_payment_intent_id=payment_table.stripe_payment_intent_id,
                created_at=payment_table.created_at
            )
    
    def get_payment_by_booking(self, booking_id: str) -> Optional[Payment]:
        with self.get_session() as session:
            payment_table = session.query(PaymentTable).filter(PaymentTable.booking_id == booking_id).first()
            if payment_table:
                return Payment(
                    id=str(payment_table.id),
                    booking_id=str(payment_table.booking_id),
                    amount=payment_table.amount,
                    currency=payment_table.currency,
                    status=payment_table.status,
                    stripe_payment_intent_id=payment_table.stripe_payment_intent_id,
                    created_at=payment_table.created_at
                )
            return None
    
    def update_payment(self, payment_id: str, update_data: dict) -> Optional[Payment]:
        with self.get_session() as session:
            payment_table = session.query(PaymentTable).filter(PaymentTable.id == payment_id).first()
            if payment_table:
                for key, value in update_data.items():
                    if hasattr(payment_table, key):
                        setattr(payment_table, key, value)
                session.commit()
                session.refresh(payment_table)
                
                return Payment(
                    id=str(payment_table.id),
                    booking_id=str(payment_table.booking_id),
                    amount=payment_table.amount,
                    currency=payment_table.currency,
                    status=payment_table.status,
                    stripe_payment_intent_id=payment_table.stripe_payment_intent_id,
                    created_at=payment_table.created_at
                )
            return None
    
    def create_checkin(self, checkin_data: dict) -> CheckInOut:
        with self.get_session() as session:
            checkin_table = CheckInOutTable(**checkin_data)
            session.add(checkin_table)
            session.commit()
            session.refresh(checkin_table)
            
            return CheckInOut(
                id=str(checkin_table.id),
                booking_id=str(checkin_table.booking_id),
                action=checkin_table.action,
                timestamp=checkin_table.timestamp,
                room_number=checkin_table.room_number
            )
    
    def get_checkins_by_booking(self, booking_id: str) -> List[CheckInOut]:
        with self.get_session() as session:
            checkin_tables = session.query(CheckInOutTable).filter(CheckInOutTable.booking_id == booking_id).all()
            return [
                CheckInOut(
                    id=str(checkin_table.id),
                    booking_id=str(checkin_table.booking_id),
                    action=checkin_table.action,
                    timestamp=checkin_table.timestamp,
                    room_number=checkin_table.room_number
                )
                for checkin_table in checkin_tables
            ]
    
    def store_otp(self, email: str, otp: str):
        with self.get_session() as session:
            expires_at = datetime.utcnow() + timedelta(minutes=10)
            
            existing_otp = session.query(OTPTable).filter(
                OTPTable.email == email,
                OTPTable.used == False,
                OTPTable.expires_at > datetime.utcnow()
            ).first()
            
            if existing_otp:
                existing_otp.otp_code = otp
                existing_otp.created_at = datetime.utcnow()
                existing_otp.expires_at = expires_at
            else:
                otp_table = OTPTable(
                    email=email,
                    otp_code=otp,
                    expires_at=expires_at
                )
                session.add(otp_table)
            
            session.commit()
    
    def verify_otp(self, email: str, otp: str) -> bool:
        with self.get_session() as session:
            otp_table = session.query(OTPTable).filter(
                OTPTable.email == email,
                OTPTable.otp_code == otp,
                OTPTable.used == False,
                OTPTable.expires_at > datetime.utcnow()
            ).first()
            
            print(f"OTP Verification Debug: email={email}, provided_otp={otp}, found_otp={otp_table is not None}")
            
            if otp_table:
                otp_table.used = True
                session.commit()
                print(f"OTP Verification: SUCCESS for {email}")
                return True
            
            print(f"OTP Verification: FAILED for {email}")
            return False
    
    def get_all_guests(self) -> List[Guest]:
        with self.get_session() as session:
            guest_tables = session.query(GuestTable).all()
            return [
                Guest(
                    id=str(guest_table.id),
                    email=guest_table.email,
                    first_name=guest_table.first_name,
                    last_name=guest_table.last_name,
                    phone=guest_table.phone,
                    created_at=guest_table.created_at
                )
                for guest_table in guest_tables
            ]
    
    def get_all_bookings(self) -> List[Booking]:
        with self.get_session() as session:
            booking_tables = session.query(BookingTable).all()
            return [
                Booking(
                    id=str(booking_table.id),
                    guest_id=str(booking_table.guest_id),
                    room_number=booking_table.room_number,
                    check_in_date=booking_table.check_in_date,
                    check_out_date=booking_table.check_out_date,
                    total_amount=booking_table.total_amount,
                    status=booking_table.status,
                    special_requests=booking_table.special_requests,
                    created_at=booking_table.created_at,
                    updated_at=booking_table.updated_at
                )
                for booking_table in booking_tables
            ]
    
    def get_all_payments(self) -> List[Payment]:
        with self.get_session() as session:
            payment_tables = session.query(PaymentTable).all()
            return [
                Payment(
                    id=str(payment_table.id),
                    booking_id=str(payment_table.booking_id),
                    amount=payment_table.amount,
                    currency=payment_table.currency,
                    status=payment_table.status,
                    stripe_payment_intent_id=payment_table.stripe_payment_intent_id,
                    created_at=payment_table.created_at
                )
                for payment_table in payment_tables
            ]
    
    def get_payment_by_id(self, payment_id: str) -> Optional[Payment]:
        with self.get_session() as session:
            payment_table = session.query(PaymentTable).filter(PaymentTable.id == payment_id).first()
            if payment_table:
                return Payment(
                    id=str(payment_table.id),
                    booking_id=str(payment_table.booking_id),
                    amount=payment_table.amount,
                    currency=payment_table.currency,
                    status=payment_table.status,
                    stripe_payment_intent_id=payment_table.stripe_payment_intent_id,
                    created_at=payment_table.created_at
                )
            return None
