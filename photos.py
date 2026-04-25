"""
Progress Photos API Routes
Handles photo uploads, retrieval, and management for progress documentation
"""

from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import ProgressPhoto, Project, Task, User, Equipment, Material, EquipmentPhoto, MaterialPhoto
from app.utils.photo_handler import PhotoHandler
import os

photos_bp = Blueprint('photos', __name__)


@photos_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_photo():
    """
    Upload a progress photo for a project/task
    
    Expected form data:
    - file: Image file
    - project_id: Project ID
    - task_id: Optional Task ID
    - caption: Optional photo caption
    """
    try:
        user_id = get_jwt_identity()
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        project_id = request.form.get('project_id')
        task_id = request.form.get('task_id')
        caption = request.form.get('caption', '')
        
        # Validate project_id
        if not project_id:
            return jsonify({'error': 'project_id is required'}), 400
        
        # Check project exists and user has access
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Save photo using PhotoHandler
        save_result = PhotoHandler.save_photo(file, project_id, user_id, caption)
        
        if not save_result['success']:
            return jsonify({'error': save_result.get('error', 'Upload failed')}), 400
        
        # Create database record
        photo = ProgressPhoto(
            project_id=int(project_id),
            task_id=int(task_id) if task_id else None,
            filename=save_result['filename'],
            file_path=save_result['filepath'],
            image_url=f"/api/photos/view/{save_result['filename']}",
            caption=caption,
            uploaded_by_id=user_id
        )
        
        db.session.add(photo)
        db.session.commit()
        
        return jsonify({
            'message': 'Photo uploaded successfully',
            'photo': photo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/equipment/<int:equipment_id>/upload', methods=['POST'])
@jwt_required()
def upload_equipment_photo(equipment_id):
    """
    Upload a photo for equipment
    
    Expected form data:
    - file: Image file
    - caption: Optional photo caption
    """
    try:
        user_id = get_jwt_identity()
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        caption = request.form.get('caption', '')
        
        # Validate equipment exists
        equipment = Equipment.query.get(equipment_id)
        if not equipment:
            return jsonify({'error': 'Equipment not found'}), 404
        
        # Save photo using PhotoHandler
        save_result = PhotoHandler.save_photo(file, f"equipment_{equipment_id}", user_id, caption)
        
        if not save_result.get('success'):
            return jsonify({'error': save_result.get('error', 'Upload failed')}), 400
        
        # Create photo record
        photo = EquipmentPhoto(
            equipment_id=equipment_id,
            filename=save_result['filename'],
            file_path=f"/api/photos/view/{save_result['filename']}",
            caption=caption,
            uploaded_by_id=user_id
        )
        
        db.session.add(photo)
        db.session.commit()
        
        return jsonify({
            'message': 'Equipment photo uploaded successfully',
            'photo': photo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/material/<int:material_id>/upload', methods=['POST'])
@jwt_required()
def upload_material_photo(material_id):
    """
    Upload a photo for material
    
    Expected form data:
    - file: Image file
    - caption: Optional photo caption
    """
    try:
        user_id = get_jwt_identity()
        
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        caption = request.form.get('caption', '')
        
        # Validate material exists
        material = Material.query.get(material_id)
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        # Save photo using PhotoHandler
        save_result = PhotoHandler.save_photo(file, f"material_{material_id}", user_id, caption)
        
        if not save_result.get('success'):
            return jsonify({'error': save_result.get('error', 'Upload failed')}), 400
        
        # Create photo record
        photo = MaterialPhoto(
            material_id=material_id,
            filename=save_result['filename'],
            file_path=f"/api/photos/view/{save_result['filename']}",
            caption=caption,
            uploaded_by_id=user_id
        )
        
        db.session.add(photo)
        db.session.commit()
        
        return jsonify({
            'message': 'Material photo uploaded successfully',
            'photo': photo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_photos(project_id):
    """Get all photos for a project"""
    try:
        user_id = get_jwt_identity()
        
        # Check project exists
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get photos
        photos = ProgressPhoto.query.filter_by(project_id=project_id).order_by(
            ProgressPhoto.created_at.desc()
        ).all()
        
        return jsonify({
            'project_id': project_id,
            'total': len(photos),
            'photos': [photo.to_dict() for photo in photos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/task/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task_photos(task_id):
    """Get all photos for a specific task"""
    try:
        # Check task exists
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Get photos
        photos = ProgressPhoto.query.filter_by(task_id=task_id).order_by(
            ProgressPhoto.created_at.desc()
        ).all()
        
        return jsonify({
            'task_id': task_id,
            'total': len(photos),
            'photos': [photo.to_dict() for photo in photos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@photos_bp.route('/equipment/<int:equipment_id>', methods=['GET'])
@jwt_required()
def get_equipment_photos(equipment_id):
    """Get all photos for an equipment"""
    try:
        # Validate equipment exists
        equipment = Equipment.query.get(equipment_id)
        if not equipment:
            return jsonify({'error': 'Equipment not found'}), 404
        
        photos = EquipmentPhoto.query.filter_by(equipment_id=equipment_id).order_by(EquipmentPhoto.uploaded_at.desc()).all()
        
        return jsonify({
            'equipment_id': equipment_id,
            'photos': [photo.to_dict() for photo in photos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/material/<int:material_id>', methods=['GET'])
@jwt_required()
def get_material_photos(material_id):
    """Get all photos for a material"""
    try:
        # Validate material exists
        material = Material.query.get(material_id)
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        
        photos = MaterialPhoto.query.filter_by(material_id=material_id).order_by(MaterialPhoto.uploaded_at.desc()).all()
        
        return jsonify({
            'material_id': material_id,
            'photos': [photo.to_dict() for photo in photos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@photos_bp.route('/<int:photo_id>', methods=['GET'])
@jwt_required()
def get_photo(photo_id):
    """Get photo details"""
    try:
        photo = ProgressPhoto.query.get(photo_id)
        if not photo:
            return jsonify({'error': 'Photo not found'}), 404
        
        return jsonify(photo.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/<int:photo_id>', methods=['PUT'])
@jwt_required()
def update_photo(photo_id):
    """Update photo caption or details"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        photo = ProgressPhoto.query.get(photo_id)
        if not photo:
            return jsonify({'error': 'Photo not found'}), 404
        
        # Only owner or admin can update
        user = User.query.get(user_id)
        if photo.uploaded_by_id != user_id and user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        if 'caption' in data:
            photo.caption = data['caption']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Photo updated successfully',
            'photo': photo.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_photo(photo_id):
    """Delete a photo"""
    try:
        user_id = get_jwt_identity()
        
        photo = ProgressPhoto.query.get(photo_id)
        if not photo:
            return jsonify({'error': 'Photo not found'}), 404
        
        # Only owner or admin can delete
        user = User.query.get(user_id)
        if photo.uploaded_by_id != user_id and user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Delete file
        if PhotoHandler.delete_photo(photo.file_path):
            db.session.delete(photo)
            db.session.commit()
            
            return jsonify({'message': 'Photo deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete photo file'}), 500
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/view/<filename>', methods=['GET'])
def view_photo(filename):
    """View a photo (public endpoint)"""
    try:
        # Find photo record to get project folder
        photo = ProgressPhoto.query.filter_by(filename=filename).first()
        if not photo:
            return jsonify({'error': 'Photo not found'}), 404
        
        folder = os.path.join(PhotoHandler.UPLOAD_FOLDER, f'project_{photo.project_id}')
        return send_from_directory(folder, filename), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@photos_bp.route('/stats/<int:project_id>', methods=['GET'])
@jwt_required()
def get_photo_statistics(project_id):
    """Get photo upload statistics for a project"""
    try:
        # Check project exists
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get stats
        total_photos = ProgressPhoto.query.filter_by(project_id=project_id).count()
        
        # Photos by uploader
        from sqlalchemy import func
        uploader_stats = db.session.query(
            User.first_name,
            User.last_name,
            func.count(ProgressPhoto.id).label('count')
        ).join(ProgressPhoto).filter(
            ProgressPhoto.project_id == project_id
        ).group_by(User.id).all()
        
        # Recent uploads
        recent_photos = ProgressPhoto.query.filter_by(
            project_id=project_id
        ).order_by(ProgressPhoto.created_at.desc()).limit(5).all()
        
        return jsonify({
            'project_id': project_id,
            'total_photos': total_photos,
            'by_uploader': [
                {
                    'name': f"{stat[0]} {stat[1]}",
                    'count': stat[2]
                }
                for stat in uploader_stats
            ],
            'recent_uploads': [photo.to_dict() for photo in recent_photos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
