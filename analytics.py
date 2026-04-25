"""
Analytics API Routes
Provides dashboard metrics and project analytics
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Project, Task, TeamMember, SiteVisit, Payment, ProgressPhoto, User
from sqlalchemy import func
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/dashboard/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_dashboard(project_id):
    """Get complete dashboard metrics for a project"""
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get all dashboard data
        dashboard_data = {
            'project': project.to_dict(),
            'task_metrics': get_task_metrics(project_id),
            'budget_metrics': get_budget_metrics(project_id),
            'team_metrics': get_team_metrics(project_id),
            'activity_metrics': get_activity_metrics(project_id),
            'progress_metrics': get_progress_metrics(project_id),
            'site_visit_metrics': get_site_visit_metrics(project_id),
            'payment_metrics': get_payment_metrics(project_id)
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_task_metrics(project_id):
    """Calculate task metrics"""
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == 'completed')
    in_progress_tasks = sum(1 for t in tasks if t.status == 'in_progress')
    not_started_tasks = sum(1 for t in tasks if t.status == 'not_started')
    
    total_estimated_hours = sum(t.estimated_hours or 0 for t in tasks)
    total_actual_hours = sum(t.actual_hours or 0 for t in tasks)
    
    return {
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'in_progress_tasks': in_progress_tasks,
        'not_started_tasks': not_started_tasks,
        'completion_percentage': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2),
        'total_estimated_hours': round(total_estimated_hours, 2),
        'total_actual_hours': round(total_actual_hours, 2),
        'hour_variance': round(total_actual_hours - total_estimated_hours, 2),
        'by_priority': {
            'critical': sum(1 for t in tasks if t.priority == 'critical'),
            'high': sum(1 for t in tasks if t.priority == 'high'),
            'medium': sum(1 for t in tasks if t.priority == 'medium'),
            'low': sum(1 for t in tasks if t.priority == 'low')
        }
    }


def get_budget_metrics(project_id):
    """Calculate budget metrics"""
    project = Project.query.get(project_id)
    
    from app.models import Budget
    budget_items = Budget.query.filter_by(project_id=project_id).all()
    
    total_estimated = sum(b.estimated_amount or 0 for b in budget_items)
    total_actual = sum(b.actual_amount or 0 for b in budget_items)
    remaining = total_estimated - total_actual
    
    return {
        'budget_total': round(project.budget, 2),
        'amount_spent': round(project.spent, 2),
        'remaining_budget': round(project.budget - project.spent, 2),
        'budget_utilization_percentage': round((project.spent / project.budget * 100) if project.budget > 0 else 0, 2),
        'estimated_vs_actual': {
            'estimated': round(total_estimated, 2),
            'actual': round(total_actual, 2),
            'variance': round(total_estimated - total_actual, 2)
        },
        'by_category': [
            {
                'category': item.category or 'General',
                'estimated': round(item.estimated_amount or 0, 2),
                'actual': round(item.actual_amount or 0, 2),
                'variance': round((item.estimated_amount or 0) - (item.actual_amount or 0), 2)
            }
            for item in budget_items
        ]
    }


def get_team_metrics(project_id):
    """Calculate team metrics"""
    team_members = TeamMember.query.filter_by(project_id=project_id).all()
    assigned_tasks = Task.query.filter_by(project_id=project_id).filter(
        Task.assigned_to_id.isnot(None)
    ).all()
    
    unique_members = set(t.assigned_to_id for t in assigned_tasks)
    
    workload = {}
    for member_id in unique_members:
        member = User.query.get(member_id)
        member_tasks = [t for t in assigned_tasks if t.assigned_to_id == member_id]
        workload[f"{member.first_name} {member.last_name}"] = {
            'total_tasks': len(member_tasks),
            'completed_tasks': sum(1 for t in member_tasks if t.status == 'completed'),
            'estimated_hours': round(sum(t.estimated_hours or 0 for t in member_tasks), 2)
        }
    
    return {
        'total_team_members': len(team_members),
        'assigned_members': len(unique_members),
        'unassigned_members': len(team_members) - len(unique_members),
        'workload': workload
    }


def get_activity_metrics(project_id):
    """Calculate activity metrics"""
    activities = ProgressPhoto.query.filter_by(project_id=project_id).all()
    
    # Group by date
    activity_by_date = {}
    for activity in activities:
        date = activity.created_at.strftime('%Y-%m-%d') if activity.created_at else 'Unknown'
        if date not in activity_by_date:
            activity_by_date[date] = 0
        activity_by_date[date] += 1
    
    # Activity by uploader
    activity_by_uploader = db.session.query(
        User.first_name,
        User.last_name,
        func.count(ProgressPhoto.id).label('count')
    ).join(ProgressPhoto).filter(
        ProgressPhoto.project_id == project_id
    ).group_by(User.id).all()
    
    return {
        'total_uploads': len(activities),
        'recent_uploads': len([a for a in activities if a.created_at > datetime.utcnow() - timedelta(days=7)]),
        'by_date': activity_by_date,
        'by_uploader': [
            {
                'name': f"{item[0]} {item[1]}",
                'uploads': item[2]
            }
            for item in activity_by_uploader
        ]
    }


def get_progress_metrics(project_id):
    """Calculate overall progress"""
    project = Project.query.get(project_id)
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == 'completed')
    
    # Timeline progress
    if project.start_date and project.end_date:
        total_days = (project.end_date - project.start_date).days
        elapsed_days = (datetime.utcnow() - project.start_date).days
        timeline_percentage = round((elapsed_days / total_days * 100) if total_days > 0 else 0, 2)
    else:
        timeline_percentage = 0
    
    return {
        'overall_progress_percentage': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2),
        'timeline_progress_percentage': timeline_percentage,
        'status': project.status,
        'start_date': project.start_date.strftime('%Y-%m-%d') if project.start_date else None,
        'end_date': project.end_date.strftime('%Y-%m-%d') if project.end_date else None
    }


def get_site_visit_metrics(project_id):
    """Calculate site visit metrics"""
    visits = SiteVisit.query.filter_by(project_id=project_id).all()
    
    # Visitors
    unique_visitors = len(set(v.user_id for v in visits))
    total_visits = len(visits)
    total_hours = sum(v.duration_hours or 0 for v in visits)
    
    # Visits by user
    visits_by_user = db.session.query(
        User.first_name,
        User.last_name,
        func.count(SiteVisit.id).label('visit_count'),
        func.sum(SiteVisit.duration_hours).label('total_hours')
    ).join(SiteVisit).filter(
        SiteVisit.project_id == project_id
    ).group_by(User.id).all()
    
    return {
        'total_site_visits': total_visits,
        'unique_visitors': unique_visitors,
        'total_hours_onsite': round(total_hours, 2),
        'average_visit_duration': round((total_hours / total_visits) if total_visits > 0 else 0, 2),
        'by_visitor': [
            {
                'name': f"{v[0]} {v[1]}",
                'visits': v[2],
                'total_hours': round(float(v[3]) if v[3] else 0, 2)
            }
            for v in visits_by_user
        ],
        'recent_visits': [v.to_dict() for v in sorted(visits, key=lambda x: x.visit_date, reverse=True)[:5]]
    }


def get_payment_metrics(project_id):
    """Calculate payment metrics"""
    payments = Payment.query.filter_by(project_id=project_id).all()
    
    total_amount = sum(p.amount for p in payments)
    completed_amount = sum(p.amount for p in payments if p.status == 'completed')
    pending_amount = sum(p.amount for p in payments if p.status == 'pending')
    failed_amount = sum(p.amount for p in payments if p.status == 'failed')
    
    return {
        'total_transactions': len(payments),
        'total_amount': round(total_amount, 2),
        'completed_amount': round(completed_amount, 2),
        'pending_amount': round(pending_amount, 2),
        'failed_amount': round(failed_amount, 2),
        'completion_rate': round((completed_amount / total_amount * 100) if total_amount > 0 else 0, 2),
        'by_status': {
            'completed': sum(1 for p in payments if p.status == 'completed'),
            'pending': sum(1 for p in payments if p.status == 'pending'),
            'failed': sum(1 for p in payments if p.status == 'failed')
        }
    }


@analytics_bp.route('/comparison', methods=['POST'])
@jwt_required()
def compare_projects():
    """
    Compare metrics across multiple projects
    
    Expected JSON:
    {
        "project_ids": [list of project IDs]
    }
    """
    try:
        data = request.get_json()
        project_ids = data.get('project_ids', [])
        
        if not project_ids:
            return jsonify({'error': 'No project IDs provided'}), 400
        
        comparison = {}
        for project_id in project_ids:
            project = Project.query.get(project_id)
            if project:
                comparison[f"Project {project_id}"] = {
                    'name': project.name,
                    'tasks': get_task_metrics(project_id),
                    'budget': get_budget_metrics(project_id),
                    'progress': get_progress_metrics(project_id)
                }
        
        return jsonify({
            'comparison': comparison,
            'total_projects': len(comparison)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
