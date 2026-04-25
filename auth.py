from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User
from marshmallow import ValidationError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No input data'}), 400
    
    # Validate required fields
    required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        first_name=data['first_name'],
        last_name=data['last_name'],
        role=data.get('role', 'viewer')
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Auth routes are working!'}), 200

@auth_bp.route('/routes', methods=['GET'])
def list_routes():
    from flask import current_app
    routes = []
    for rule in current_app.url_map.iter_rules():
        if rule.endpoint.startswith('auth.'):
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'url': str(rule)
            })
    return jsonify({'routes': routes}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    from flask import current_app
    try:
        current_app.logger.info("Login route called!")
        data = request.get_json()
        current_app.logger.info(f"Request data: {data}")
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing username or password'}), 400
        
        current_app.logger.info(f"Login attempt for username: {data.get('username')}")
        user = User.query.filter_by(username=data['username']).first()
        current_app.logger.info(f"User found: {user is not None}")
        
        if user:
            current_app.logger.info(f"User active: {user.is_active}")
            password_valid = check_password_hash(user.password_hash, data['password'])
            current_app.logger.info(f"Password valid: {password_valid}")
        
        if not user or not check_password_hash(user.password_hash, data['password']):
            current_app.logger.info("Returning invalid credentials")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'User account is inactive'}), 401
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        current_app.logger.error(f"Exception in login: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200
