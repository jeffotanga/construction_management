"""
Reports API Routes
Handles report generation, PDF export, and download
"""

from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Report, Project, Task, Budget, Payment, User
from app.utils.pdf_generator import ReportGenerator
from datetime import datetime
import os

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/project-summary/<int:project_id>', methods=['POST'])
@jwt_required()
def generate_project_summary_report(project_id):
    """
    Generate a project summary report (PDF)
    """
    try:
        user_id = get_jwt_identity()
        
        # Validate project
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get project data
        tasks = Task.query.filter_by(project_id=project_id).all()
        budget_items = Budget.query.filter_by(project_id=project_id).all()
        
        # Generate PDF
        filename = f"project_summary_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        generator = ReportGenerator(filename)
        output_path = 'uploads/reports/'
        filepath = generator.generate_project_summary(project, tasks, budget_items, output_path)
        
        # Create database record
        report = Report(
            project_id=project_id,
            report_type='project_summary',
            title=f"Project Summary Report - {project.name}",
            description=f"Summary report for {project.name} generated on {datetime.now().strftime('%Y-%m-%d')}",
            generated_by_id=user_id,
            file_path=filepath,
            file_type='pdf'
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'message': 'Report generated successfully',
            'report': report.to_dict(),
            'download_url': f'/api/reports/{report.id}/download'
        }), 201
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/financial/<int:project_id>', methods=['POST'])
@jwt_required()
def generate_financial_report(project_id):
    """
    Generate a financial/payment report (PDF)
    """
    try:
        user_id = get_jwt_identity()
        
        # Validate project
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get payment data
        payments = Payment.query.filter_by(project_id=project_id).all()
        
        if not payments:
            return jsonify({'error': 'No payment records found for this project'}), 400
        
        # Generate PDF
        filename = f"financial_report_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        generator = ReportGenerator(filename)
        output_path = 'uploads/reports/'
        filepath = generator.generate_financial_report(project, payments, output_path)
        
        # Create database record
        report = Report(
            project_id=project_id,
            report_type='financial',
            title=f"Financial Report - {project.name}",
            description=f"Payment and financial summary for {project.name}",
            generated_by_id=user_id,
            file_path=filepath,
            file_type='pdf'
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'message': 'Financial report generated successfully',
            'report': report.to_dict(),
            'download_url': f'/api/reports/{report.id}/download'
        }), 201
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/progress/<int:project_id>', methods=['POST'])
@jwt_required()
def generate_progress_report(project_id):
    """
    Generate a progress/task report (PDF)
    """
    try:
        user_id = get_jwt_identity()
        
        # Validate project
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Get task data
        tasks = Task.query.filter_by(project_id=project_id).all()
        
        # Calculate progress metrics
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.status == 'completed')
        in_progress_tasks = sum(1 for t in tasks if t.status == 'in_progress')
        not_started_tasks = sum(1 for t in tasks if t.status == 'not_started')
        
        progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Generate simple PDF report using ReportGenerator
        filename = f"progress_report_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        generator = ReportGenerator(filename)
        output_path = 'uploads/reports/'
        filepath = generator.generate_project_summary(project, tasks, [], output_path)
        
        # Create database record
        report = Report(
            project_id=project_id,
            report_type='progress',
            title=f"Progress Report - {project.name}",
            description=f"Task completion report: {progress_percentage:.1f}% complete ({completed_tasks}/{total_tasks} tasks)",
            generated_by_id=user_id,
            file_path=filepath,
            file_type='pdf'
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'message': 'Progress report generated successfully',
            'report': report.to_dict(),
            'progress_metrics': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'not_started_tasks': not_started_tasks,
                'progress_percentage': round(progress_percentage, 2)
            },
            'download_url': f'/api/reports/{report.id}/download'
        }), 201
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/<int:report_id>/download', methods=['GET'])
@jwt_required()
def download_report(report_id):
    """Download a generated report"""
    try:
        report = Report.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        if not os.path.exists(report.file_path):
            return jsonify({'error': 'Report file not found'}), 404
        
        directory = os.path.dirname(report.file_path)
        filename = os.path.basename(report.file_path)
        
        return send_from_directory(directory, filename, as_attachment=True), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_reports(project_id):
    """Get all reports for a project"""
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Parse query parameters
        report_type = request.args.get('type')
        
        query = Report.query.filter_by(project_id=project_id)
        
        if report_type:
            query = query.filter_by(report_type=report_type)
        
        reports = query.order_by(Report.generated_at.desc()).all()
        
        return jsonify({
            'project_id': project_id,
            'total_reports': len(reports),
            'reports': [report.to_dict() for report in reports]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/<int:report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    """Get report details"""
    try:
        report = Report.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        return jsonify(report.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/<int:report_id>', methods=['DELETE'])
@jwt_required()
def delete_report(report_id):
    """Delete a report"""
    try:
        user_id = get_jwt_identity()
        
        report = Report.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        # Check permissions (only admin or generator can delete)
        user = User.query.get(user_id)
        if report.generated_by_id != user_id and user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Delete file
        if report.file_path and os.path.exists(report.file_path):
            try:
                os.remove(report.file_path)
            except:
                pass
        
        db.session.delete(report)
        db.session.commit()
        
        return jsonify({'message': 'Report deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/scheduled/<int:project_id>', methods=['POST'])
@jwt_required()
def create_scheduled_report(project_id):
    """
    Create a scheduled report generation
    
    Expected JSON:
    {
        "report_type": "project_summary|financial|progress",
        "schedule": "daily|weekly|monthly",
        "email_recipients": [list of emails]
    }
    """
    try:
        data = request.get_json()
        
        # This would integrate with a task queue like Celery
        # For now, just acknowledge the request
        return jsonify({
            'message': 'Scheduled report created',
            'note': 'Scheduled report functionality requires Celery task queue implementation'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
