"""
Payments API Routes
Handles M-Pesa payment processing and transaction management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Payment, Project, User
from app.utils.mpesa_handler import MpesaPaymentHandler, validate_phone_number
from datetime import datetime

payments_bp = Blueprint('payments', __name__)

mpesa_handler = MpesaPaymentHandler()


@payments_bp.route('/', methods=['GET'])
@jwt_required()
def get_payments():
    """Get all payments with optional filtering"""
    try:
        # Parse query parameters
        project_id = request.args.get('project_id', type=int)
        user_id = request.args.get('user_id', type=int)
        status = request.args.get('status')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        query = Payment.query
        
        if project_id:
            query = query.filter_by(project_id=project_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
        if status:
            query = query.filter_by(status=status)
        
        payments = query.order_by(Payment.created_at.desc()).limit(limit).offset(offset).all()
        
        return jsonify({
            'total': query.count(),
            'limit': limit,
            'offset': offset,
            'payments': [payment.to_dict() for payment in payments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/initiate', methods=['POST'])
@jwt_required()
def initiate_payment():
    """
    Initiate M-Pesa payment request
    
    Expected JSON:
    {
        "project_id": int,
        "amount": float,
        "phone_number": string,
        "description": string
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required = ['project_id', 'amount', 'phone_number']
        if not all(k in data for k in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        project_id = data.get('project_id')
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        description = data.get('description', 'Construction Project Payment')
        
        # Validate project
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Validate and format phone number
        formatted_phone = validate_phone_number(phone_number)
        if not formatted_phone:
            return jsonify({'error': 'Invalid phone number format'}), 400
        
        # Validate amount
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        # Create payment record
        payment = Payment(
            project_id=project_id,
            user_id=user_id,
            amount=amount,
            currency='KES',
            payment_method='mpesa',
            phone_number=formatted_phone,
            status='pending'
        )
        
        db.session.add(payment)
        db.session.commit()
        
        # Generate account reference
        account_ref = f"PROJ{project_id}_PAY{payment.id}"
        
        # Initiate M-Pesa payment
        mpesa_result = mpesa_handler.initiate_payment(
            amount=amount,
            phone_number=formatted_phone,
            account_reference=account_ref,
            description=description
        )
        
        if mpesa_result.get('success'):
            payment.mpesa_reference = mpesa_result.get('checkout_request_id')
            db.session.commit()
            
            return jsonify({
                'message': 'Payment initiated successfully',
                'payment': payment.to_dict(),
                'checkout_request_id': mpesa_result.get('checkout_request_id'),
                'customer_message': mpesa_result.get('customer_message')
            }), 201
        else:
            # Payment initiation failed
            payment.status = 'failed'
            db.session.commit()
            
            return jsonify({
                'error': mpesa_result.get('error', 'Payment initiation failed'),
                'payment': payment.to_dict()
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/<int:payment_id>/status', methods=['GET'])
@jwt_required()
def check_payment_status(payment_id):
    """Check the status of a payment"""
    try:
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # If already completed or failed, return status
        if payment.status in ['completed', 'failed']:
            return jsonify(payment.to_dict()), 200
        
        # If pending with mpesa reference, query M-Pesa
        if payment.status == 'pending' and payment.mpesa_reference:
            mpesa_status = mpesa_handler.query_payment_status(
                payment.mpesa_reference
            )
            
            if mpesa_status.get('success'):
                if mpesa_status.get('result_code') == 0:
                    payment.status = 'completed'
                    payment.mpesa_receipt_number = mpesa_status.get('mpesa_receipt_number')
                    payment.payment_date = datetime.utcnow()
                    db.session.commit()
                else:
                    payment.status = 'failed'
                    db.session.commit()
            
            return jsonify(payment.to_dict()), 200
        
        return jsonify(payment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_payments(project_id):
    """Get all payments for a project"""
    try:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        # Parse query parameters
        status = request.args.get('status')
        
        query = Payment.query.filter_by(project_id=project_id)
        
        if status:
            query = query.filter_by(status=status)
        
        payments = query.order_by(Payment.created_at.desc()).all()
        
        # Calculate statistics
        total_amount = sum(p.amount for p in payments)
        completed_amount = sum(p.amount for p in payments if p.status == 'completed')
        
        return jsonify({
            'project_id': project_id,
            'total_payments': len(payments),
            'total_amount': total_amount,
            'completed_amount': completed_amount,
            'payments': [payment.to_dict() for payment in payments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/user/<int:user_id>/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_user_payments(user_id, project_id):
    """Get payments made by a user for a project"""
    try:
        payments = Payment.query.filter_by(
            user_id=user_id,
            project_id=project_id
        ).order_by(Payment.created_at.desc()).all()
        
        return jsonify({
            'user_id': user_id,
            'project_id': project_id,
            'total_payments': len(payments),
            'payments': [payment.to_dict() for payment in payments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/callback/mpesa', methods=['POST'])
def mpesa_callback():
    """M-Pesa callback endpoint for payment confirmations"""
    try:
        data = request.get_json()
        
        # Parse callback
        callback_result = mpesa_handler.process_callback(data)
        
        if callback_result.get('success'):
            # Find payment by checkout request ID
            checkout_id = callback_result.get('checkout_request_id')
            payment = Payment.query.filter_by(mpesa_reference=checkout_id).first()
            
            if payment:
                payment.status = 'completed'
                payment.mpesa_receipt_number = callback_result.get('mpesa_reference')
                payment.payment_date = datetime.utcnow()
                db.session.commit()
        
        # Return success response to M-Pesa
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200
        
    except Exception as e:
        print(f"Callback error: {str(e)}")
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Error'}), 500


@payments_bp.route('/timeout/mpesa', methods=['POST'])
def mpesa_timeout():
    """M-Pesa timeout endpoint"""
    try:
        data = request.get_json()
        
        # Log timeout
        print(f"M-Pesa timeout: {data}")
        
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Success'}), 200
        
    except Exception as e:
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Error'}), 500


@payments_bp.route('/analytics/<int:project_id>', methods=['GET'])
@jwt_required()
def get_payment_analytics(project_id):
    """Get payment analytics for a project"""
    try:
        from sqlalchemy import func
        
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        payments = Payment.query.filter_by(project_id=project_id).all()
        
        # Statistics
        total_payments = len(payments)
        total_amount = sum(p.amount for p in payments)
        completed_amount = sum(p.amount for p in payments if p.status == 'completed')
        pending_amount = sum(p.amount for p in payments if p.status == 'pending')
        failed_amount = sum(p.amount for p in payments if p.status == 'failed')
        
        # Payments by status
        status_breakdown = {
            'completed': sum(1 for p in payments if p.status == 'completed'),
            'pending': sum(1 for p in payments if p.status == 'pending'),
            'failed': sum(1 for p in payments if p.status == 'failed')
        }
        
        return jsonify({
            'project_id': project_id,
            'total_payments': total_payments,
            'total_amount': round(total_amount, 2),
            'completed_amount': round(completed_amount, 2),
            'pending_amount': round(pending_amount, 2),
            'failed_amount': round(failed_amount, 2),
            'completion_rate': round((completed_amount / total_amount * 100) if total_amount > 0 else 0, 2),
            'status_breakdown': status_breakdown
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get payment details"""
    try:
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        return jsonify(payment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
