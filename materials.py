from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Material, Project, User

materials_bp = Blueprint('materials', __name__)

@materials_bp.route('/', methods=['POST'])
@jwt_required()
def create_material():
    """Create new material"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('project_id'):
        return jsonify({'error': 'Material name and project_id are required'}), 400
    
    # Check if project exists
    project = Project.query.get(data['project_id'])
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    material = Material(
        name=data['name'],
        project_id=data['project_id'],
        unit=data.get('unit', 'pieces'),
        available_quantity=data.get('available_quantity', 0.0),
        remaining_quantity=data.get('remaining_quantity', 0.0),
        used_quantity=data.get('used_quantity', 0.0),
        received_quantity=data.get('received_quantity', 0.0),
        unit_cost=data.get('unit_cost', 0.0),
        supplier=data.get('supplier')
    )
    
    try:
        db.session.add(material)
        db.session.commit()
        return jsonify({
            'message': 'Material created successfully',
            'material': material.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/', methods=['GET'])
@jwt_required()
def get_materials():
    """Get all materials"""
    project_id = request.args.get('project_id')
    
    query = Material.query
    if project_id:
        query = query.filter_by(project_id=project_id)
    
    materials = query.all()
    return jsonify({
        'materials': [mat.to_dict() for mat in materials]
    }), 200

@materials_bp.route('/<int:material_id>', methods=['GET'])
@jwt_required()
def get_material_by_id(material_id):
    """Get material by ID"""
    material = Material.query.get(material_id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    
    return jsonify({'material': material.to_dict()}), 200

@materials_bp.route('/<int:material_id>', methods=['PUT'])
@jwt_required()
def update_material(material_id):
    """Update material"""
    material = Material.query.get(material_id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    
    data = request.get_json()
    
    # Check if project exists if provided
    if data.get('project_id'):
        project = Project.query.get(data['project_id'])
        if not project:
            return jsonify({'error': 'Project not found'}), 404
    
    try:
        if 'name' in data:
            material.name = data['name']
        if 'project_id' in data:
            material.project_id = data['project_id']
        if 'unit' in data:
            material.unit = data['unit']
        if 'available_quantity' in data:
            material.available_quantity = data['available_quantity']
        if 'remaining_quantity' in data:
            material.remaining_quantity = data['remaining_quantity']
        if 'used_quantity' in data:
            material.used_quantity = data['used_quantity']
        if 'received_quantity' in data:
            material.received_quantity = data['received_quantity']
        if 'unit_cost' in data:
            material.unit_cost = data['unit_cost']
        if 'supplier' in data:
            material.supplier = data['supplier']
        
        db.session.commit()
        return jsonify({
            'message': 'Material updated successfully',
            'material': material.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/<int:material_id>', methods=['DELETE'])
@jwt_required()
def delete_material(material_id):
    """Delete material"""
    material = Material.query.get(material_id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    
    try:
        db.session.delete(material)
        db.session.commit()
        return jsonify({'message': 'Material deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@materials_bp.route('/<int:material_id>/usage', methods=['PATCH'])
@jwt_required()
def update_material_usage(material_id):
    """Update material usage quantities"""
    material = Material.query.get(material_id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    
    data = request.get_json()
    
    try:
        if 'used_quantity' in data:
            # When used quantity changes, adjust remaining
            used_change = data['used_quantity'] - material.used_quantity
            material.used_quantity = data['used_quantity']
            material.remaining_quantity = max(0, material.remaining_quantity - used_change)
        
        if 'received_quantity' in data:
            # When received quantity changes, adjust available and remaining
            received_change = data['received_quantity'] - material.received_quantity
            material.received_quantity = data['received_quantity']
            material.available_quantity += received_change
            material.remaining_quantity += received_change
        
        if 'available_quantity' in data:
            material.available_quantity = data['available_quantity']
        
        if 'remaining_quantity' in data:
            material.remaining_quantity = data['remaining_quantity']
        
        db.session.commit()
        return jsonify({
            'message': 'Material usage updated successfully',
            'material': material.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500