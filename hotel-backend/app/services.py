import os
import stripe
import smtplib
import aiofiles
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import httpx
from .database import db
from .models import PaymentStatus, SmartLockRequest

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PaymentService:
    @staticmethod
    async def create_payment_intent(amount: float, currency: str = "eur") -> dict:
        stripe_key = os.getenv("STRIPE_SECRET_KEY")
        
        if not stripe_key:
            import uuid
            fake_intent_id = f"pi_demo_{str(uuid.uuid4())[:8]}"
            fake_client_secret = f"{fake_intent_id}_secret_demo"
            
            print(f"Payment Simulation: Created payment intent for {amount} {currency.upper()}")
            return {
                "client_secret": fake_client_secret,
                "payment_intent_id": fake_intent_id
            }
        
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Stripe expects amount in cents
                currency=currency,
                metadata={"integration_check": "accept_a_payment"}
            )
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id
            }
        except Exception as e:
            raise Exception(f"Stripe error: {str(e)}")

    @staticmethod
    async def confirm_payment(payment_intent_id: str) -> bool:
        stripe_key = os.getenv("STRIPE_SECRET_KEY")
        
        if not stripe_key:
            print(f"Payment Simulation: Confirmed payment {payment_intent_id}")
            return True
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return intent.status == "succeeded"
        except Exception:
            return False

class EmailService:
    @staticmethod
    async def send_email(to_email: str, subject: str, body: str) -> bool:
        try:
            smtp_server = os.getenv("EMAIL_HOST", "smtp.gmail.com")
            smtp_port = int(os.getenv("EMAIL_PORT", "587"))
            email_user = os.getenv("EMAIL_USER")
            email_password = os.getenv("EMAIL_PASSWORD")
            
            if not email_user or not email_password:
                print(f"Email simulation: Would send to {to_email}")
                print(f"Subject: {subject}")
                print(f"Body: {body}")
                return True
            
            msg = MIMEMultipart()
            msg['From'] = email_user
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(email_user, email_password)
            text = msg.as_string()
            server.sendmail(email_user, to_email, text)
            server.quit()
            return True
        except Exception as e:
            print(f"Email error: {str(e)}")
            print(f"Email simulation: Would send to {to_email}")
            return True

    @staticmethod
    async def send_otp_email(email: str, otp: str) -> bool:
        subject = "Your Hotel Booking OTP Code"
        body = f"""
        Your OTP code for hotel booking authentication is: {otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        """
        return await EmailService.send_email(email, subject, body)

    @staticmethod
    async def send_booking_confirmation(email: str, booking_details: dict) -> bool:
        subject = "Booking Confirmation - Hotel Platform"
        body = f"""
        Dear {booking_details.get('guest_name', 'Guest')},
        
        Your booking has been confirmed!
        
        Booking Details:
        - Booking ID: {booking_details.get('booking_id')}
        - Room: {booking_details.get('room_number')}
        - Check-in: {booking_details.get('check_in_date')}
        - Check-out: {booking_details.get('check_out_date')}
        - Total Amount: €{booking_details.get('total_amount')}
        
        Thank you for choosing our hotel!
        """
        return await EmailService.send_email(email, subject, body)

class SmartLockService:
    @staticmethod
    async def control_lock(room_number: str, action: str, guest_id: str) -> dict:
        try:
            api_url = os.getenv("SMART_LOCK_API_URL", "https://api.smartlock-simulator.com")
            
            response_data = {
                "success": True,
                "room_number": room_number,
                "action": action,
                "guest_id": guest_id,
                "timestamp": "2024-01-01T12:00:00Z",
                "lock_status": "unlocked" if action == "unlock" else "locked",
                "message": f"Room {room_number} {action}ed successfully"
            }
            
            print(f"Smart Lock Simulation: {action.upper()} room {room_number} for guest {guest_id}")
            return response_data
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to {action} room {room_number}"
            }

class DocumentService:
    @staticmethod
    async def save_document(file_content: bytes, filename: str, guest_id: str) -> str:
        upload_dir = "/tmp/documents"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, f"{guest_id}_{filename}")
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)
        
        return file_path

class AuthorityService:
    @staticmethod
    async def send_guest_data(guest_data: dict, booking_data: dict) -> dict:
        try:
            authority_data = {
                "guest_info": {
                    "name": f"{guest_data.get('first_name')} {guest_data.get('last_name')}",
                    "email": guest_data.get('email'),
                    "phone": guest_data.get('phone')
                },
                "booking_info": {
                    "booking_id": booking_data.get('id'),
                    "room_number": booking_data.get('room_number'),
                    "check_in_date": str(booking_data.get('check_in_date')),
                    "check_out_date": str(booking_data.get('check_out_date'))
                },
                "submission_timestamp": "2024-01-01T12:00:00Z",
                "status": "submitted"
            }
            
            print(f"Authority Portal Simulation: Submitted data for guest {guest_data.get('email')}")
            return {
                "success": True,
                "submission_id": f"AUTH_{str(booking_data.get('id', ''))[:8]}",
                "data": authority_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
