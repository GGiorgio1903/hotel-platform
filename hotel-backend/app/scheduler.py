import asyncio
import schedule
import time
from datetime import datetime
from .backup import backup_service
import structlog

logger = structlog.get_logger()

class SchedulerService:
    def __init__(self):
        self.running = False
        
    async def start_scheduler(self):
        self.running = True
        logger.info("Scheduler service started")
        
        schedule.every().day.at("02:00").do(self._schedule_backup)
        
        while self.running:
            schedule.run_pending()
            await asyncio.sleep(60)
    
    def _schedule_backup(self):
        asyncio.create_task(backup_service.create_database_backup())
        logger.info("Scheduled backup triggered")
    
    def stop_scheduler(self):
        self.running = False
        logger.info("Scheduler service stopped")

scheduler_service = SchedulerService()
