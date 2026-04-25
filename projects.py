from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Project, User, TeamMember
from datetime import datetime

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    """Create a new project"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Project name is required'}), 400
    
    project = Project(
        name=data['name'],
        description=data.get('description'),
        owner_id=user_id,
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None,
        budget=data.get('budget', 0),
        location=data.get('location'),
        status=data.get('status', 'planning')
    )
    
    try:
        db.session.add(project)
        db.session.commit()
        return jsonify({
            'message': 'Project created successfully',
            'project': project.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    """Get all projects for current user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Admin sees all, others see their projects
    if user.role == 'admin':
        projects = Project.query.all()
    else:
        projects = Project.query.filter_by(owner_id=user_id).all()
    
    return jsonify([p.to_dict() for p in projects]), 200

@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """Get project details"""
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    return jsonify(project.to_dict()), 200

@projects_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """Update project"""
    user_id = get_jwt_identity()
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    if project.owner_id != user_id and User.query.get(user_id).role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    for key, value in data.items():
        if key in ['name', 'description', 'status', 'budget', 'location']:
            setattr(project, key, value)
    
    project.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Project updated successfully',
            'project': project.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/<int:project_id>/team', methods=['POST'])
@jwt_required()
def add_team_member(project_id):
    """Add team member to project"""
    user_id = get_jwt_identity()
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    if project.owner_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    member_user_id = data.get('user_id')
    role = data.get('role', 'contractor')
    
    member = User.query.get(member_user_id)
    if not member:
        return jsonify({'error': 'User not found'}), 404
    
    team_member = TeamMember(
        project_id=project_id,
        user_id=member_user_id,
        role=role
    )
    
    try:
        db.session.add(team_member)
        db.session.commit()
        return jsonify({
            'message': 'Team member added successfully'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
