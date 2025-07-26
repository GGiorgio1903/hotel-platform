import os
from typing import List

class RoomConfig:
    @staticmethod
    def is_bnb_mode() -> bool:
        """Check if the system is running in single-room B&B mode"""
        return os.getenv("BNB_MODE", "false").lower() == "true"
    
    @staticmethod
    def get_single_room_name() -> str:
        """Get the name of the single room for B&B mode"""
        return os.getenv("SINGLE_ROOM_NAME", "Suite")
    
    @staticmethod
    def get_available_rooms() -> List[str]:
        """Get list of available rooms based on configuration"""
        if RoomConfig.is_bnb_mode():
            return [RoomConfig.get_single_room_name()]
        else:
            return ['101', '102', '201', '202', '301', '302']
    
    @staticmethod
    def get_base_rate_per_night() -> float:
        """Get base rate per night (can be made configurable later)"""
        return float(os.getenv("BASE_RATE_PER_NIGHT", "120"))
