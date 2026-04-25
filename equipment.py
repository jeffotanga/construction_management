from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Equipment, Project, User
from datetime import datetime

equipment_bp = Blueprint('equipment', __name__)

@equipment_bp.route('/', methods=['POST'])
@jwt_required()
def create_equipment():
    """Create new equipment"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Equipment name is required'}), 400
    
    # Check if project exists if provided
    if data.get('project_id'):
        project = Project.query.get(data['project_id'])
        if not project:
            return jsonify({'error': 'Project not found'}), 404
    
    equipment = Equipment(
        name=data['name'],
        description=data.get('description'),
        status=data.get('status', 'available'),
        project_id=data.get('project_id'),
        serial_number=data.get('serial_number'),
        purchase_date=datetime.fromisoformat(data['purchase_date']) if data.get('purchase_date') else None,
        last_maintenance=datetime.fromisoformat(data['last_maintenance']) if data.get('last_maintenance') else None,
        next_maintenance=datetime.fromisoformat(data['next_maintenance']) if data.get('next_maintenance') else None
    )
    
    try:
        db.session.add(equipment)
        db.session.commit()
        return jsonify({
            'message': 'Equipment created successfully',
            'equipment': equipment.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@equipment_bp.route('/', methods=['GET'])
@jwt_required()
def get_equipment():
    """Get all equipment"""
    project_id = request.args.get('project_id')
    
    query = Equipment.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    
    equipment = query.all()
    return jsonify({
        'equipment': [eq.to_dict() for eq in equipment]
    }), 200

@equipment_bp.route('/<int:equipment_id>', methods=['GET'])
@jwt_required()
def get_equipment_by_id(equipment_id):
    """Get equipment by ID"""
    equipment = Equipment.query.get(equipment_id)
    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404
    
    return jsonify({'equipment': equipment.to_dict()}), 200

@equipment_bp.route('/<int:equipment_id>', methods=['PUT'])
@jwt_required()
def update_equipment(equipment_id):
    """Update equipment"""
    equipment = Equipment.query.get(equipment_id)
    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404
    
    data = request.get_json()
    
    # Check if project exists if provided
    if data.get('project_id'):
        project = Project.query.get(data['project_id'])
        if not project:
            return jsonify({'error': 'Project not found'}), 404
    
    try:
        if 'name' in data:
            equipment.name = data['name']
        if 'description' in data:
            equipment.description = data['description']
        if 'status' in data:
            equipment.status = data['status']
        if 'project_id' in data:
            equipment.project_id = data['project_id']
        if 'serial_number' in data:
            equipment.serial_number = data['serial_number']
        if 'purchase_date' in data:
            equipment.purchase_date = datetime.fromisoformat(data['purchase_date']) if data['purchase_date'] else None
        if 'last_maintenance' in data:
            equipment.last_maintenance = datetime.fromisoformat(data['last_maintenance']) if data['last_maintenance'] else None
        if 'next_maintenance' in data:
            equipment.next_maintenance = datetime.fromisoformat(data['next_maintenance']) if data['next_maintenance'] else None
        
        db.session.commit()
        return jsonify({
            'message': 'Equipment updated successfully',
            'equipment': equipment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@equipment_bp.route('/<int:equipment_id>', methods=['DELETE'])
@jwt_required()
def delete_equipment(equipment_id):
    """Delete equipment"""
    equipment = Equipment.query.get(equipment_id)
    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404
    
    try:
        db.session.delete(equipment)
        db.session.commit()
        return jsonify({'message': 'Equipment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@equipment_bp.route('/<int:equipment_id>/status', methods=['PATCH'])
@jwt_required()
def update_equipment_status(equipment_id):
    """Update equipment status"""
    equipment = Equipment.query.get(equipment_id)
    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404
    
    data = request.get_json()
    if not data or not data.get('status'):
        return jsonify({'error': 'Status is required'}), 400
    
    valid_statuses = ['available', 'in_use', 'maintenance', 'retired']
    if data['status'] not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    try:
        equipment.status = data['status']
        db.session.commit()
        return jsonify({
            'message': 'Equipment status updated successfully',
            'equipment': equipment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500