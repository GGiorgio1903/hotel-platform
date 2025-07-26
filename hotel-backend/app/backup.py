import os
import subprocess
import boto3
from datetime import datetime, timedelta
import structlog
import asyncio

logger = structlog.get_logger()

class BackupService:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.backup_enabled = os.getenv("BACKUP_ENABLED", "false").lower() == "true"
        self.retention_days = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.s3_bucket = os.getenv("BACKUP_S3_BUCKET")
        
    async def create_database_backup(self):
        if not self.backup_enabled:
            logger.info("Backup disabled, skipping")
            return
            
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"hotel_platform_backup_{timestamp}.sql"
            
            logger.info("Starting database backup", filename=backup_filename)
            
            subprocess.run([
                "pg_dump", 
                self.db_url, 
                "-f", backup_filename,
                "--no-owner", "--no-privileges"
            ], check=True)
            
            if self.s3_bucket and self.aws_access_key and self.aws_secret_key:
                await self.upload_to_s3(backup_filename)
            
            os.remove(backup_filename)
            
            await self.cleanup_old_backups()
            
            logger.info("Database backup completed successfully", filename=backup_filename)
            
        except Exception as e:
            logger.error("Backup failed", error=str(e))
            raise
    
    async def upload_to_s3(self, filename: str):
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key
            )
            
            s3_key = f"database-backups/{filename}"
            s3_client.upload_file(filename, self.s3_bucket, s3_key)
            
            logger.info("Backup uploaded to S3", s3_key=s3_key)
            
        except Exception as e:
            logger.error("S3 upload failed", error=str(e))
            raise
    
    async def cleanup_old_backups(self):
        if not self.s3_bucket:
            return
            
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key
            )
            
            cutoff_date = datetime.now() - timedelta(days=self.retention_days)
            
            response = s3_client.list_objects_v2(
                Bucket=self.s3_bucket,
                Prefix="database-backups/"
            )
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                        s3_client.delete_object(Bucket=self.s3_bucket, Key=obj['Key'])
                        logger.info("Deleted old backup", key=obj['Key'])
                        
        except Exception as e:
            logger.error("Backup cleanup failed", error=str(e))

backup_service = BackupService()
