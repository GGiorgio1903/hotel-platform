def get_otp_email_template(otp: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Hotel Platform - OTP Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333;">Hotel Platform</h1>
            <h2 style="color: #007bff;">Your Authentication Code</h2>
            <div style="background-color: white; padding: 30px; margin: 20px 0; border-radius: 8px;">
                <p style="font-size: 18px; color: #333;">Your OTP code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0;">
                    {otp}
                </div>
                <p style="color: #666;">This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_booking_confirmation_template(booking_details: dict) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Hotel Platform - Booking Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Hotel Platform</h1>
            <h2 style="color: #28a745; text-align: center;">Booking Confirmed!</h2>
            
            <div style="background-color: white; padding: 30px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #333; margin-bottom: 20px;">Booking Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Booking ID:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{booking_details.get('id', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Room:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">Room {booking_details.get('room_number', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Check-in:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{booking_details.get('check_in_date', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Check-out:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">{booking_details.get('check_out_date', 'N/A')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Total Amount:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-size: 18px; font-weight: bold; color: #28a745;">€{booking_details.get('total_amount', 0):.2f}</td>
                    </tr>
                </table>
                
                {f'<div style="margin-top: 20px;"><strong>Special Requests:</strong><br>{booking_details.get("special_requests")}</div>' if booking_details.get('special_requests') else ''}
                
                <div style="margin-top: 30px; padding: 20px; background-color: #e7f3ff; border-radius: 5px;">
                    <h4 style="color: #0066cc; margin-top: 0;">Next Steps:</h4>
                    <ul style="color: #333; margin: 10px 0;">
                        <li>You will receive check-in instructions 24 hours before your arrival</li>
                        <li>Please bring a valid ID for verification</li>
                        <li>Contact us if you need to modify your booking</li>
                    </ul>
                </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 20px;">
                <p>Thank you for choosing Hotel Platform!</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    """
