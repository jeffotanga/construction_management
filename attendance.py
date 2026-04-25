"""
Attendance API Routes
Handles worker attendance tracking
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User
from datetime import datetime, date

# Since no Attendance model, we'll create a simple in-memory or basic implementation
# In production, you'd want a proper Attendance model

attendance_bp = Blueprint('attendance', __name__)

# Simple in-memory storage for demo (replace with database model)
attendance_records = []


@attendance_bp.route('/', methods=['GET'])
@jwt_required()
def list_attendance():
    """Get attendance records"""
    try:
        # Parse query parameters
        worker_id = request.args.get('worker_id', type=int)
        date_str = request.args.get('date')
        project_id = request.args.get('project_id', type=int)
        
        records = attendance_records
        
        if worker_id:
            records = [r for r in records if r['worker_id'] == worker_id]
        if date_str:
            records = [r for r in records if r['date'] == date_str]
        if project_id:
            records = [r for r in records if r.get('project_id') == project_id]
        
        return jsonify({
            'attendance': records
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/', methods=['POST'])
@jwt_required()
def record_attendance():
    """Record attendance for a worker"""
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)
        
        if current_user.role not in ['admin', 'project_manager']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required = ['worker_id', 'date', 'status']
        if not all(k in data for k in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        worker_id = data['worker_id']
        attendance_date = data['date']
        status = data['status']  # 'present', 'absent', 'late'
        project_id = data.get('project_id')
        notes = data.get('notes', '')
        
        # Check if worker exists
        worker = User.query.get(worker_id)
        if not worker:
            return jsonify({'error': 'Worker not found'}), 404
        
        # Check if record already exists for this date
        existing = next((r for r in attendance_records 
                        if r['worker_id'] == worker_id and r['date'] == attendance_date), None)
        
        if existing:
            return jsonify({'error': 'Attendance already recorded for this date'}), 400
        
        # Create attendance record
        record = {
            'id': len(attendance_records) + 1,
            'worker_id': worker_id,
            'worker_name': f"{worker.first_name} {worker.last_name}",
            'date': attendance_date,
            'status': status,
            'project_id': project_id,
            'notes': notes,
            'recorded_by': user_id,
            'recorded_at': datetime.utcnow().isoformat()
        }
        
        attendance_records.append(record)
        
        return jsonify({
            'message': 'Attendance recorded successfully',
            'attendance': record
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_attendance_summary():
    """Get attendance summary"""
    try:
        # Parse query parameters
        worker_id = request.args.get('worker_id', type=int)
        project_id = request.args.get('project_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        records = attendance_records
        
        if worker_id:
            records = [r for r in records if r['worker_id'] == worker_id]
        if project_id:
            records = [r for r in records if r.get('project_id') == project_id]
        if start_date:
            records = [r for r in records if r['date'] >= start_date]
        if end_date:
            records = [r for r in records if r['date'] <= end_date]
        
        # Calculate summary
        total_days = len(set(r['date'] for r in records))
        present_days = len([r for r in records if r['status'] == 'present'])
        absent_days = len([r for r in records if r['status'] == 'absent'])
        late_days = len([r for r in records if r['status'] == 'late'])
        
        attendance_rate = (present_days / total_days * 100) if total_days > 0 else 0
        
        return jsonify({
            'summary': {
                'total_days': total_days,
                'present_days': present_days,
                'absent_days': absent_days,
                'late_days': late_days,
                'attendance_rate': round(attendance_rate, 2)
            },
            'records': records
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500