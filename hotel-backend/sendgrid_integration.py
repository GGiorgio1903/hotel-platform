#!/usr/bin/env python3
"""
SendGrid Integration Script
Run this after getting SendGrid API key to update Fly.io deployment
"""

import os
import subprocess

def update_sendgrid_config(api_key: str):
    """Update Fly.io deployment with SendGrid SMTP configuration"""
    
    sendgrid_env_vars = {
        "EMAIL_HOST": "smtp.sendgrid.net",
        "EMAIL_PORT": "587", 
        "EMAIL_USER": "apikey",
        "EMAIL_PASSWORD": api_key,
        "EMAIL_USE_TLS": "true",
        "EMAIL_FROM_NAME": "Hotel Platform",
        "EMAIL_FROM": "noreply@hotel-platform.com"
    }
    
    print("🔧 Updating Fly.io deployment with SendGrid SMTP configuration...")
    
    for key, value in sendgrid_env_vars.items():
        cmd = f'flyctl secrets set {key}="{value}" --app hotel-platform-backend'
        print(f"Setting {key}...")
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ {key} set successfully")
            else:
                print(f"❌ Failed to set {key}: {result.stderr}")
        except Exception as e:
            print(f"❌ Error setting {key}: {str(e)}")
    
    print("\n🚀 Redeploying backend with new SMTP configuration...")
    try:
        deploy_cmd = "flyctl deploy --app hotel-platform-backend"
        result = subprocess.run(deploy_cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Backend redeployed successfully with SendGrid SMTP!")
            print("🌐 Backend URL: https://hotel-platform-backend.fly.dev/")
        else:
            print(f"❌ Deployment failed: {result.stderr}")
    except Exception as e:
        print(f"❌ Deployment error: {str(e)}")

if __name__ == "__main__":
    api_key = input("Enter your SendGrid API key: ").strip()
    if api_key:
        update_sendgrid_config(api_key)
    else:
        print("❌ No API key provided")
