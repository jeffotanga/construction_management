"""
Site Visits API Routes
Handles GPS tagging, site visit tracking, and attendance analytics
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import SiteVisit, Project, User
from app.utils.photo_handler import LocationHandler
from datetime import datetime, timedelta

site_visits_bp = Blueprint('site_visits', __name__)


@site_visits_bp.route('/check-in', methods=['POST'])
@jwt_required()
def check_in():
    """
    User check-in with GPS coordinates
    
    Expected JSON:
    {
        "project_id": int,
        "latitude": float,
        "longitude": float,
        "notes": optional string
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['project_id', 'latitude', 'longitude']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        project_id = data.get('project_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        # Validate project
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Validate coordinates
        if not LocationHandler.validate_coordinates(latitude, longitude):
            return jsonify({'error': 'Invalid coordinates'}), 400
        
        # Check if user has active check-in (without checkout)
        active_visit = SiteVisit.query.filter_by(
            project_id=project_id,
            user_id=user_id,
            check_out_time=None
        ).first()
        
        if active_visit:
            return jsonify({'error': 'User already checked in'}), 400
        
        # Create new site visit record
        visit = SiteVisit(
            project_id=project_id,
            user_id=user_id,
            check_in_latitude=latitude,
            check_in_longitude=longitude,
            check_in_time=datetime.utcnow(),
            notes=data.get('notes', '')
        )
        
        db.session.add(visit)
        db.session.commit()
        
        return jsonify({
            'message': 'Checked in successfully',
            'visit': visit.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@site_visits_bp.route('/check-out/<int:visit_id>', methods=['POST'])
@jwt_required()
def check_out(visit_id):
    """
    User check-out with GPS coordinates
    
    Expected JSON:
    {
        "latitude": float,
        "longitude": float
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate coordinates
        if not all(k in data for k in ['latitude', 'longitude']):
            return jsonify({'error': 'Missing coordinates'}), 400
        
        if not LocationHandler.validate_coordinates(data['latitude'], data['longitude']):
            return jsonify({'error': 'Invalid coordinates'}), 400
        
        # Get visit
        visit = SiteVisit.query.get(visit_id)
        if not visit:
            return jsonify({'error': 'Visit not found'}), 404
        
        # Check ownership
        if visit.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if visit.check_out_time:
            return jsonify({'error': 'Already checked out'}), 400
        
        # Update checkout information
        visit.check_out_latitude = data['latitude']
        visit.check_out_longitude = data['longitude']
        visit.check_out_time = datetime.utcnow()
        
        # Calculate duration
        if visit.check_in_time:
            visit.duration_hours = LocationHandler.calculate_visit_duration(
                visit.check_in_time,
                visit.check_out_time
            )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Checked out successfully',
            'visit': visit.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@site_visits_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_visits(project_id):
    """Get all site visits for a project"""
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get query parameters for filtering
        user_id = request.args.get('user_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = SiteVisit.query.filter_by(project_id=project_id)
        
        if user_id:
            query = query.filter_by(user_id=int(user_id))
        
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
                query = query.filter(SiteVisit.visit_date >= start)
            except:
                pass
        
        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
                query = query.filter(SiteVisit.visit_date <= end)
            except:
                pass
        
        visits = query.order_by(SiteVisit.visit_date.desc()).all()
        
        return jsonify({
            'project_id': project_id,
            'total_visits': len(visits),
            'visits': [visit.to_dict() for visit in visits]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@site_visits_bp.route('/user/<int:user_id>/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_user_project_visits(user_id, project_id):
    """Get site visits for a specific user on a project"""
    try:
        visits = SiteVisit.query.filter_by(
            project_id=project_id,
            user_id=user_id
        ).order_by(SiteVisit.visit_date.desc()).all()
        
        return jsonify({
            'user_id': user_id,
            'project_id': project_id,
            'total_visits': len(visits),
            'visits': [visit.to_dict() for visit in visits]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@site_visits_bp.route('/analytics/<int:project_id>', methods=['GET'])
@jwt_required()
def get_visit_analytics(project_id):
    """Get site visit analytics for a project"""
    try:
        from sqlalchemy import func
        
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Total visits
        total_visits = SiteVisit.query.filter_by(project_id=project_id).count()
        
        # Unique visitors
        unique_visitors = db.session.query(
            func.count(func.distinct(SiteVisit.user_id))
        ).filter_by(project_id=project_id).scalar()
        
        # Total hours spent
        total_hours = db.session.query(
            func.sum(SiteVisit.duration_hours)
        ).filter_by(project_id=project_id).scalar() or 0
        
        # Visits by user
        user_visits = db.session.query(
            User.id,
            User.first_name,
            User.last_name,
            func.count(SiteVisit.id).label('visit_count'),
            func.sum(SiteVisit.duration_hours).label('total_hours')
        ).join(SiteVisit).filter(
            SiteVisit.project_id == project_id
        ).group_by(User.id).order_by(
            func.count(SiteVisit.id).desc()
        ).all()
        
        # Recent visits
        recent_visits = SiteVisit.query.filter_by(
            project_id=project_id
        ).order_by(SiteVisit.visit_date.desc()).limit(10).all()
        
        return jsonify({
            'project_id': project_id,
            'total_visits': total_visits,
            'unique_visitors': unique_visitors,
            'total_hours_spent': round(float(total_hours) if total_hours else 0, 2),
            'by_user': [
                {
                    'user_id': visit[0],
                    'name': f"{visit[1]} {visit[2]}",
                    'visit_count': visit[3],
                    'total_hours': round(float(visit[4]) if visit[4] else 0, 2)
                }
                for visit in user_visits
            ],
            'recent_visits': [visit.to_dict() for visit in recent_visits]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@site_visits_bp.route('/<int:visit_id>', methods=['GET'])
@jwt_required()
def get_visit(visit_id):
    """Get details of a specific site visit"""
    try:
        visit = SiteVisit.query.get(visit_id)
        if not visit:
            return jsonify({'error': 'Visit not found'}), 404
        
        return jsonify(visit.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@site_visits_bp.route('/<int:visit_id>/distance', methods=['GET'])
@jwt_required()
def get_visit_distance(visit_id):
    """Calculate distance traveled during a site visit"""
    try:
        visit = SiteVisit.query.get(visit_id)
        if not visit:
            return jsonify({'error': 'Visit not found'}), 404
        
        if not all([visit.check_in_latitude, visit.check_in_longitude, 
                   visit.check_out_latitude, visit.check_out_longitude]):
            return jsonify({'error': 'Incomplete location data'}), 400
        
        distance = LocationHandler.calculate_distance(
            visit.check_in_latitude,
            visit.check_in_longitude,
            visit.check_out_latitude,
            visit.check_out_longitude
        )
        
        return jsonify({
            'visit_id': visit_id,
            'distance_km': distance,
            'distance_miles': round(distance * 0.621371, 3)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@site_visits_bp.route('/geofence/<int:project_id>', methods=['POST'])
@jwt_required()
def validate_geofence(project_id):
    """
    Validate if coordinates are within project geofence
    
    Expected JSON:
    {
        "latitude": float,
        "longitude": float,
        "center_latitude": float,
        "center_longitude": float,
        "radius_km": float
    }
    """
    try:
        data = request.get_json()
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        center_lat = data.get('center_latitude')
        center_lon = data.get('center_longitude')
        radius = data.get('radius_km', 0.5)  # Default 500m
        
        if not all([latitude, longitude, center_lat, center_lon]):
            return jsonify({'error': 'Missing required coordinates'}), 400
        
        distance = LocationHandler.calculate_distance(
            center_lat,
            center_lon,
            latitude,
            longitude
        )
        
        within_geofence = distance <= radius
        
        return jsonify({
            'within_geofence': within_geofence,
            'distance_km': distance,
            'radius_km': radius,
            'message': 'Within geofence' if within_geofence else f'Outside geofence ({{ distance }}km away)'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
