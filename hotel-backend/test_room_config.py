#!/usr/bin/env python3
"""
Test room configuration functionality
"""

import os
import sys
sys.path.append('/home/ubuntu/hotel-platform/hotel-backend')

from app.room_config import RoomConfig

def test_multi_room_mode():
    """Test default multi-room configuration"""
    print("=== Testing Multi-Room Mode (Default) ===")
    
    if 'BNB_MODE' in os.environ:
        del os.environ['BNB_MODE']
    if 'SINGLE_ROOM_NAME' in os.environ:
        del os.environ['SINGLE_ROOM_NAME']
    
    print(f"BNB Mode: {RoomConfig.is_bnb_mode()}")
    print(f"Available Rooms: {RoomConfig.get_available_rooms()}")
    print(f"Base Rate: {RoomConfig.get_base_rate_per_night()}")
    print()

def test_bnb_mode():
    """Test single-room B&B configuration"""
    print("=== Testing B&B Mode (Single Room) ===")
    
    os.environ['BNB_MODE'] = 'true'
    os.environ['SINGLE_ROOM_NAME'] = 'Suite'
    os.environ['BASE_RATE_PER_NIGHT'] = '150'
    
    print(f"BNB Mode: {RoomConfig.is_bnb_mode()}")
    print(f"Available Rooms: {RoomConfig.get_available_rooms()}")
    print(f"Base Rate: {RoomConfig.get_base_rate_per_night()}")
    print()

if __name__ == "__main__":
    test_multi_room_mode()
    test_bnb_mode()
    print("✅ Room configuration tests completed!")
