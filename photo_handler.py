"""
Photo Upload and Image Handler
Handles progress photo uploads, image processing, and file management
"""

import os
import uuid
from datetime import datetime
from PIL import Image
from werkzeug.utils import secure_filename
import hashlib


class PhotoHandler:
    """Handle photo uploads and processing"""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    UPLOAD_FOLDER = 'uploads/progress_photos'
    THUMBNAIL_SIZE = (400, 300)
    
    @staticmethod
    def allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in PhotoHandler.ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_upload(file, max_size=None):
        """
        Validate file before upload
        
        Args:
            file: File object from request
            max_size: Maximum file size in bytes
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not file or file.filename == '':
            return False, 'No file selected'
        
        if not PhotoHandler.allowed_file(file.filename):
            return False, f'File type not allowed. Allowed types: {", ".join(PhotoHandler.ALLOWED_EXTENSIONS)}'
        
        max_size = max_size or PhotoHandler.MAX_FILE_SIZE
        if file.content_length and file.content_length > max_size:
            return False, f'File size exceeds {max_size / (1024*1024):.0f}MB limit'
        
        return True, None
    
    @staticmethod
    def save_photo(file, project_id, user_id, caption=''):
        """
        Save uploaded photo and create thumbnail
        
        Args:
            file: File object from request
            project_id: Project ID
            user_id: User ID of uploader
            caption: Photo caption
            
        Returns:
            dict: Contains file info or error details
        """
        try:
            # Validate file
            is_valid, error = PhotoHandler.validate_upload(file)
            if not is_valid:
                return {'success': False, 'error': error}
            
            # Create directory if not exists
            os.makedirs(PhotoHandler.UPLOAD_FOLDER, exist_ok=True)
            project_folder = os.path.join(PhotoHandler.UPLOAD_FOLDER, f'project_{project_id}')
            os.makedirs(project_folder, exist_ok=True)
            
            # Generate unique filename
            original_name = secure_filename(file.filename)
            file_extension = original_name.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
            filepath = os.path.join(project_folder, unique_filename)
            
            # Save original file
            file.save(filepath)
            
            # Get file size
            file_size = os.path.getsize(filepath)
            
            # Create thumbnail
            try:
                thumbnail_filename = f"thumb_{unique_filename}"
                thumbnail_path = os.path.join(project_folder, thumbnail_filename)
                thumbnail_url = PhotoHandler.create_thumbnail(filepath, thumbnail_path)
            except Exception as e:
                print(f"Warning: Could not create thumbnail: {str(e)}")
                thumbnail_url = None
            
            return {
                'success': True,
                'original_filename': original_name,
                'filename': unique_filename,
                'filepath': filepath,
                'thumbnail_url': thumbnail_url,
                'file_size': file_size,
                'upload_date': datetime.now().isoformat(),
                'caption': caption
            }
            
        except Exception as e:
            print(f"Error saving photo: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def create_thumbnail(source_path, thumb_path, size=None):
        """
        Create thumbnail from image
        
        Args:
            source_path: Path to source image
            thumb_path: Path to save thumbnail
            size: Thumbnail size tuple (width, height)
            
        Returns:
            str: Relative path to thumbnail
        """
        size = size or PhotoHandler.THUMBNAIL_SIZE
        
        img = Image.open(source_path)
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Add white background if transparency
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            background.save(thumb_path, 'JPEG', quality=85)
        else:
            img.save(thumb_path, 'JPEG', quality=85)
        
        return thumb_path.replace('\\', '/')
    
    @staticmethod
    def delete_photo(filepath):
        """
        Delete photo file
        
        Args:
            filepath: Path to photo
            
        Returns:
            bool: Success status
        """
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                
                # Try to delete thumbnail
                directory = os.path.dirname(filepath)
                filename = os.path.basename(filepath)
                thumb_path = os.path.join(directory, f'thumb_{filename}')
                
                if os.path.exists(thumb_path):
                    os.remove(thumb_path)
                
                return True
        except Exception as e:
            print(f"Error deleting photo: {str(e)}")
        
        return False
    
    @staticmethod
    def get_project_photos(project_id):
        """
        List all photos for a project
        
        Args:
            project_id: Project ID
            
        Returns:
            list: List of photo filenames
        """
        project_folder = os.path.join(PhotoHandler.UPLOAD_FOLDER, f'project_{project_id}')
        
        if not os.path.exists(project_folder):
            return []
        
        photos = []
        for filename in os.listdir(project_folder):
            if not filename.startswith('thumb_') and PhotoHandler.allowed_file(filename):
                photos.append(filename)
        
        return photos
    
    @staticmethod
    def compress_image(source_path, quality=85, max_width=1920):
        """
        Compress and resize image
        
        Args:
            source_path: Path to source image
            quality: JPEG quality (1-100)
            max_width: Maximum width in pixels
            
        Returns:
            bool: Success status
        """
        try:
            img = Image.open(source_path)
            
            # Resize if too wide
            if img.width > max_width:
                ratio = max_width / img.width
                new_size = (max_width, int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Convert RGBA to RGB if JPEG
            if source_path.lower().endswith('.jpg') or source_path.lower().endswith('.jpeg'):
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
            
            img.save(source_path, quality=quality, optimize=True)
            return True
            
        except Exception as e:
            print(f"Error compressing image: {str(e)}")
            return False


class LocationHandler:
    """Handle GPS location tagging and analytics"""
    
    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """
        Calculate distance between two GPS coordinates in kilometers
        Using Haversine formula
        
        Args:
            lat1, lon1: First location coordinates
            lat2, lon2: Second location coordinates
            
        Returns:
            float: Distance in kilometers
        """
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth radius in km
        
        lat1_rad = radians(float(lat1))
        lon1_rad = radians(float(lon1))
        lat2_rad = radians(float(lat2))
        lon2_rad = radians(float(lon2))
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        return round(distance, 3)
    
    @staticmethod
    def validate_coordinates(latitude, longitude):
        """
        Validate GPS coordinates
        
        Args:
            latitude: Latitude value
            longitude: Longitude value
            
        Returns:
            bool: True if valid
        """
        try:
            lat = float(latitude)
            lon = float(longitude)
            
            return -90 <= lat <= 90 and -180 <= lon <= 180
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def calculate_visit_duration(check_in_time, check_out_time):
        """
        Calculate visit duration in hours
        
        Args:
            check_in_time: Check-in datetime
            check_out_time: Check-out datetime
            
        Returns:
            float: Duration in hours
        """
        if not check_in_time or not check_out_time:
            return 0
        
        duration = check_out_time - check_in_time
        hours = duration.total_seconds() / 3600
        
        return round(hours, 2)
