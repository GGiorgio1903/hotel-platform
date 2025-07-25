from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import os
from typing import List

from .models import (
    Guest, GuestCreate, Booking, BookingCreate, BookingUpdate, 
    Payment, PaymentCreate, Document, DocumentUpload, 
    OTPRequest, OTPVerification, AuthResponse, BookingStatus,
    CheckInOut, SmartLockRequest, EmailNotification
)
from .database import db
from .auth import generate_otp, create_access_token, get_current_guest
from .services import PaymentService, EmailService, SmartLockService, DocumentService, AuthorityService

app = FastAPI(title="Hotel Management Platform", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/auth/request-otp")
async def request_otp(otp_request: OTPRequest):
    otp = generate_otp()
    db.store_otp(otp_request.email, otp)
    
    await EmailService.send_otp_email(otp_request.email, otp)
    
    return {"message": "OTP sent to your email"}

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

@app.post("/guests", response_model=Guest)
async def create_guest(guest_data: GuestCreate):
    existing_guest = db.get_guest_by_email(guest_data.email)
    if existing_guest:
        raise HTTPException(status_code=400, detail="Guest with this email already exists")
    
    guest = db.create_guest(guest_data.dict())
    return guest

@app.get("/guests/me", response_model=Guest)
async def get_current_guest_info(current_guest: Guest = Depends(get_current_guest)):
    return current_guest

@app.post("/bookings", response_model=Booking)
async def create_booking(
    booking_data: BookingCreate,
    current_guest: Guest = Depends(get_current_guest)
):
    if booking_data.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Cannot create booking for another guest")
    
    booking = db.create_booking({
        **booking_data.dict(),
        "status": BookingStatus.PENDING
    })
    
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
    
    await AuthorityService.send_guest_data(
        current_guest.dict(),
        booking.dict()
    )
    
    return booking

@app.get("/bookings", response_model=List[Booking])
async def get_my_bookings(current_guest: Guest = Depends(get_current_guest)):
    bookings = db.get_bookings_by_guest(current_guest.id)
    return bookings

@app.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(
    booking_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    booking = db.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return booking

@app.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str,
    booking_update: BookingUpdate,
    current_guest: Guest = Depends(get_current_guest)
):
    booking = db.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if booking.status in [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT]:
        raise HTTPException(status_code=400, detail="Cannot modify booking after check-in")
    
    updated_booking = db.update_booking(booking_id, booking_update.dict(exclude_unset=True))
    return updated_booking

@app.delete("/bookings/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    booking = db.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if booking.status in [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT]:
        raise HTTPException(status_code=400, detail="Cannot cancel booking after check-in")
    
    db.update_booking(booking_id, {"status": BookingStatus.CANCELLED})
    return {"message": "Booking cancelled successfully"}

@app.post("/documents/upload")
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_guest: Guest = Depends(get_current_guest)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and images allowed")
    
    file_content = await file.read()
    file_path = await DocumentService.save_document(file_content, file.filename, current_guest.id)
    
    document = db.create_document({
        "guest_id": current_guest.id,
        "document_type": document_type,
        "file_path": file_path,
        "file_name": file.filename
    })
    
    return {"message": "Document uploaded successfully", "document_id": document.id}

@app.get("/documents", response_model=List[Document])
async def get_my_documents(current_guest: Guest = Depends(get_current_guest)):
    documents = db.get_documents_by_guest(current_guest.id)
    return documents

@app.post("/payments/create-intent")
async def create_payment_intent(
    payment_data: PaymentCreate,
    current_guest: Guest = Depends(get_current_guest)
):
    booking = db.get_booking_by_id(payment_data.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        intent_data = await PaymentService.create_payment_intent(
            payment_data.amount, 
            payment_data.currency
        )
        
        payment = db.create_payment({
            **payment_data.dict(),
            "stripe_payment_intent_id": intent_data["payment_intent_id"],
            "status": "pending"
        })
        
        return {
            "client_secret": intent_data["client_secret"],
            "payment_id": payment.id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/payments/{payment_id}/confirm")
async def confirm_payment(
    payment_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    payment = db.payments.get(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    booking = db.get_booking_by_id(payment.booking_id)
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    success = await PaymentService.confirm_payment(payment.stripe_payment_intent_id)
    
    if success:
        db.update_payment(payment_id, {"status": "completed"})
        db.update_booking(payment.booking_id, {"status": BookingStatus.CONFIRMED})
        return {"message": "Payment confirmed successfully"}
    else:
        db.update_payment(payment_id, {"status": "failed"})
        raise HTTPException(status_code=400, detail="Payment confirmation failed")

@app.post("/checkin/{booking_id}")
async def check_in(
    booking_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    booking = db.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Booking must be confirmed before check-in")
    
    lock_response = await SmartLockService.control_lock(
        booking.room_number, 
        "unlock", 
        current_guest.id
    )
    
    checkin = db.create_checkin({
        "booking_id": booking_id,
        "action": "check_in",
        "timestamp": datetime.now(),
        "smart_lock_response": lock_response
    })
    
    db.update_booking(booking_id, {"status": BookingStatus.CHECKED_IN})
    
    return {
        "message": "Check-in successful",
        "room_access": lock_response.get("success", False),
        "checkin_id": checkin.id
    }

@app.post("/checkout/{booking_id}")
async def check_out(
    booking_id: str,
    current_guest: Guest = Depends(get_current_guest)
):
    booking = db.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.guest_id != current_guest.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if booking.status != BookingStatus.CHECKED_IN:
        raise HTTPException(status_code=400, detail="Must be checked in to check out")
    
    lock_response = await SmartLockService.control_lock(
        booking.room_number, 
        "lock", 
        current_guest.id
    )
    
    checkout = db.create_checkin({
        "booking_id": booking_id,
        "action": "check_out",
        "timestamp": datetime.now(),
        "smart_lock_response": lock_response
    })
    
    db.update_booking(booking_id, {"status": BookingStatus.CHECKED_OUT})
    
    return {
        "message": "Check-out successful",
        "room_secured": lock_response.get("success", False),
        "checkout_id": checkout.id
    }

@app.get("/admin/bookings", response_model=List[Booking])
async def get_all_bookings():
    return list(db.bookings.values())

@app.get("/admin/guests", response_model=List[Guest])
async def get_all_guests():
    return list(db.guests.values())

@app.get("/admin/payments")
async def get_all_payments():
    return list(db.payments.values())

@app.post("/smart-lock/control")
async def control_smart_lock(request: SmartLockRequest):
    response = await SmartLockService.control_lock(
        request.room_number,
        request.action,
        request.guest_id
    )
    return response
