from app import db
from datetime import datetime
from enum import Enum

class UserRole(Enum):
    ADMIN = "admin"
    PROJECT_MANAGER = "project_manager"
    CONTRACTOR = "contractor"
    VIEWER = "viewer"

class ProjectStatus(Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(20), default='viewer', nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projects = db.relationship('Project', backref='owner', lazy=True)
    tasks_assigned = db.relationship('Task', backref='assigned_to', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='planning', nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    budget = db.Column(db.Float, default=0.0)
    spent = db.Column(db.Float, default=0.0)
    location = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    team_members = db.relationship('TeamMember', backref='project', lazy=True, cascade='all, delete-orphan')
    documents = db.relationship('Document', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'owner_id': self.owner_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'budget': self.budget,
            'spent': self.spent,
            'location': self.location,
            'progress': round((self.spent / self.budget * 100) if self.budget > 0 else 0, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default='not_started', nullable=False)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    start_date = db.Column(db.DateTime)
    due_date = db.Column(db.DateTime)
    estimated_hours = db.Column(db.Float)
    actual_hours = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'project_id': self.project_id,
            'assigned_to_id': self.assigned_to_id,
            'status': self.status,
            'priority': self.priority,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'estimated_hours': self.estimated_hours,
            'actual_hours': self.actual_hours,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class TeamMember(db.Model):
    __tablename__ = 'team_members'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='team_memberships')

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50))
    size = db.Column(db.Integer)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    uploaded_by = db.relationship('User')

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    category = db.Column(db.String(100))
    estimated_amount = db.Column(db.Float)
    actual_amount = db.Column(db.Float, default=0.0)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = db.relationship('Project', backref='budget_items')


# NEW FEATURE MODELS

class ProgressPhoto(db.Model):
    """Model for progress photos/proof documentation"""
    __tablename__ = 'progress_photos'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    image_url = db.Column(db.String(500))
    caption = db.Column(db.Text)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    task = db.relationship('Task', backref='progress_photos')
    project = db.relationship('Project', backref='progress_photos')
    uploaded_by = db.relationship('User', backref='uploaded_photos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'project_id': self.project_id,
            'filename': self.filename,
            'image_url': self.image_url,
            'caption': self.caption,
            'uploaded_by_id': self.uploaded_by_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SiteVisit(db.Model):
    """Model for GPS-tagged site visits"""
    __tablename__ = 'site_visits'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    visit_date = db.Column(db.DateTime, default=datetime.utcnow)
    check_in_latitude = db.Column(db.Numeric(10, 8))
    check_in_longitude = db.Column(db.Numeric(10, 8))
    check_out_latitude = db.Column(db.Numeric(10, 8))
    check_out_longitude = db.Column(db.Numeric(10, 8))
    check_in_time = db.Column(db.DateTime)
    check_out_time = db.Column(db.DateTime)
    duration_hours = db.Column(db.Float)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref='site_visits')
    user = db.relationship('User', backref='site_visits')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'visit_date': self.visit_date.isoformat() if self.visit_date else None,
            'check_in_latitude': float(self.check_in_latitude) if self.check_in_latitude else None,
            'check_in_longitude': float(self.check_in_longitude) if self.check_in_longitude else None,
            'check_out_latitude': float(self.check_out_latitude) if self.check_out_latitude else None,
            'check_out_longitude': float(self.check_out_longitude) if self.check_out_longitude else None,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'duration_hours': self.duration_hours,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Payment(db.Model):
    """Model for M-Pesa payments"""
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(5), default='KES')
    payment_method = db.Column(db.String(50), default='mpesa')
    mpesa_reference = db.Column(db.String(100))
    mpesa_receipt_number = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    payment_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref='payments')
    user = db.relationship('User', backref='payments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'amount': self.amount,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'mpesa_reference': self.mpesa_reference,
            'status': self.status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AnalyticsData(db.Model):
    """Model for pre-calculated analytics metrics"""
    __tablename__ = 'analytics_data'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    metric_type = db.Column(db.String(100))  # task_completion, budget_health, team_activity, etc.
    metric_value = db.Column(db.Float)
    metric_data = db.Column(db.JSON)
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref='analytics')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'metric_type': self.metric_type,
            'metric_value': self.metric_value,
            'metric_data': self.metric_data,
            'calculated_at': self.calculated_at.isoformat() if self.calculated_at else None,
        }


class Report(db.Model):
    """Model for generated reports (PDF, Excel, etc.)"""
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    report_type = db.Column(db.String(100))  # project_summary, financial, progress, etc.
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    generated_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(255))
    file_type = db.Column(db.String(20), default='pdf')  # pdf, xlsx, csv
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref='reports')
    generated_by = db.relationship('User', backref='generated_reports')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'report_type': self.report_type,
            'title': self.title,
            'description': self.description,
            'generated_by_id': self.generated_by_id,
            'file_path': self.file_path,
            'file_type': self.file_type,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Equipment(db.Model):
    """Model for construction equipment"""
    __tablename__ = 'equipment'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='available')  # available, in_use, maintenance, retired
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    serial_number = db.Column(db.String(100))
    purchase_date = db.Column(db.DateTime)
    last_maintenance = db.Column(db.DateTime)
    next_maintenance = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref='equipment')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'project_id': self.project_id,
            'serial_number': self.serial_number,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'last_maintenance': self.last_maintenance.isoformat() if self.last_maintenance else None,
            'next_maintenance': self.next_maintenance.isoformat() if self.next_maintenance else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Material(db.Model):
    """Model for construction materials inventory"""
    __tablename__ = 'materials'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    unit = db.Column(db.String(50), default='pieces')  # pieces, kg, liters, meters, etc.
    available_quantity = db.Column(db.Float, default=0.0)
    remaining_quantity = db.Column(db.Float, default=0.0)
    used_quantity = db.Column(db.Float, default=0.0)
    received_quantity = db.Column(db.Float, default=0.0)
    unit_cost = db.Column(db.Float, default=0.0)
    supplier = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = db.relationship('Project', backref='materials')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'project_id': self.project_id,
            'unit': self.unit,
            'available_quantity': self.available_quantity,
            'remaining_quantity': self.remaining_quantity,
            'used_quantity': self.used_quantity,
            'received_quantity': self.received_quantity,
            'unit_cost': self.unit_cost,
            'supplier': self.supplier,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EquipmentPhoto(db.Model):
    """Model for equipment photos"""
    __tablename__ = 'equipment_photos'
    
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.Text)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    equipment = db.relationship('Equipment', backref='photos')
    uploaded_by = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'caption': self.caption,
            'uploaded_by_id': self.uploaded_by_id,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class MaterialPhoto(db.Model):
    """Model for material photos"""
    __tablename__ = 'material_photos'
    
    id = db.Column(db.Integer, primary_key=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.Text)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    material = db.relationship('Material', backref='photos')
    uploaded_by = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'material_id': self.material_id,
            'filename': self.filename,
            'file_path': self.file_path,
            'caption': self.caption,
            'uploaded_by_id': self.uploaded_by_id,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }

