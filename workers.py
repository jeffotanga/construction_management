"""
Workers API Routes
Handles worker management and assignments
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, TeamMember, Project
from datetime import datetime

workers_bp = Blueprint('workers', __name__)


@workers_bp.route('/', methods=['GET'])
@jwt_required()
def list_workers():
    """Get all workers"""
    try:
        # For now, consider users with role contractor or project_manager as workers
        workers = User.query.filter(User.role.in_(['contractor', 'project_manager'])).all()
        
        return jsonify({
            'workers': [worker.to_dict() for worker in workers]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@workers_bp.route('/', methods=['POST'])
@jwt_required()
def create_worker():
    """Create a new worker (user with worker role)"""
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if current_user.role not in ['admin', 'project_manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required = ['username', 'email', 'password', 'first_name', 'last_name']
        if not all(k in data for k in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create worker user
        worker = User(
            username=data['username'],
            email=data['email'],
            password_hash=data['password'],  # Note: should hash password
            first_name=data['first_name'],
            last_name=data['last_name'],
            role='contractor'  # Default role for workers
        )
        
        db.session.add(worker)
        db.session.commit()
        
        return jsonify({
            'message': 'Worker created successfully',
            'worker': worker.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@workers_bp.route('/<int:worker_id>/assign', methods=['POST'])
@jwt_required()
def assign_worker_to_project(worker_id):
    """Assign a worker to a project"""
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if current_user.role not in ['admin', 'project_manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        project_id = data.get('project_id')
        
        if not project_id:
            return jsonify({'error': 'Project ID required'}), 400
        
        worker = User.query.get(worker_id)
        project = Project.query.get(project_id)
        
        if not worker:
            return jsonify({'error': 'Worker not found'}), 404
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Check if already assigned
        existing = TeamMember.query.filter_by(user_id=worker_id, project_id=project_id).first()
        if existing:
            return jsonify({'error': 'Worker already assigned to this project'}), 400
        
        # Add to team
        team_member = TeamMember(
            user_id=worker_id,
            project_id=project_id,
            role='worker',
            joined_at=datetime.utcnow()
        )
        
        db.session.add(team_member)
        db.session.commit()
        
        return jsonify({
            'message': 'Worker assigned successfully',
            'assignment': {
                'worker_id': worker_id,
                'project_id': project_id,
                'role': 'worker'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@workers_bp.route('/<int:worker_id>', methods=['GET'])
@jwt_required()
def get_worker(worker_id):
    """Get worker details"""
    try:
        worker = User.query.get(worker_id)
        
        if not worker:
            return jsonify({'error': 'Worker not found'}), 404
        
        # Get projects assigned
        assignments = TeamMember.query.filter_by(user_id=worker_id).all()
        projects = [Project.query.get(a.project_id) for a in assignments]
        
        worker_data = worker.to_dict()
        worker_data['assigned_projects'] = [p.to_dict() for p in projects if p]
        
        return jsonify(worker_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500