from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Task, Project, User
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    """Create a new task"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('project_id'):
        return jsonify({'error': 'Title and project_id are required'}), 400
    
    project = Project.query.get(data['project_id'])
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    task = Task(
        title=data['title'],
        description=data.get('description'),
        project_id=data['project_id'],
        assigned_to_id=data.get('assigned_to_id'),
        status=data.get('status', 'not_started'),
        priority=data.get('priority', 'medium'),
        start_date=datetime.fromisoformat(data['start_date']) if data.get('start_date') else None,
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        estimated_hours=data.get('estimated_hours')
    )
    
    try:
        db.session.add(task)
        db.session.commit()
        return jsonify({
            'message': 'Task created successfully',
            'task': task.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_tasks(project_id):
    """Get all tasks for a project"""
    project = Project.query.get(project_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    tasks = Task.query.filter_by(project_id=project_id).all()
    return jsonify([t.to_dict() for t in tasks]), 200

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get task details"""
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify(task.to_dict()), 200

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Update task"""
    user_id = get_jwt_identity()
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    for key, value in data.items():
        if key in ['title', 'description', 'status', 'priority', 'assigned_to_id', 'estimated_hours', 'actual_hours']:
            setattr(task, key, value)
    
    task.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Task updated successfully',
            'task': task.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete task"""
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
