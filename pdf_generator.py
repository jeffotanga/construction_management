"""
PDF Report Generation Utilities
Handles generation of project reports, invoices, and progress summaries in PDF format
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
import os
from io import BytesIO


class ReportGenerator:
    """Generate PDF reports for construction projects"""
    
    def __init__(self, filename=None):
        self.filename = filename or f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
        
    def setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a5490'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1a5490'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        )
        
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['BodyText'],
            fontSize=10,
            alignment=TA_LEFT,
            spaceAfter=6
        )
    
    def generate_project_summary(self, project, tasks, budget_items, output_path='uploads/reports/'):
        """
        Generate a project summary report
        
        Args:
            project: Project object
            tasks: List of Task objects
            budget_items: List of Budget objects
            output_path: Path to save PDF
            
        Returns:
            Full path to generated PDF
        """
        os.makedirs(output_path, exist_ok=True)
        filepath = os.path.join(output_path, self.filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        story = []
        
        # Title
        story.append(Paragraph(f"Project Report: {project.name}", self.title_style))
        story.append(Spacer(1, 0.3 * inch))
        
        # Project Info Section
        story.append(Paragraph("Project Information", self.heading_style))
        
        project_info = [
            ['Field', 'Value'],
            ['Project Name', project.name],
            ['Status', project.status.upper()],
            ['Location', project.location or 'N/A'],
            ['Start Date', project.start_date.strftime('%Y-%m-%d') if project.start_date else 'N/A'],
            ['End Date', project.end_date.strftime('%Y-%m-%d') if project.end_date else 'N/A'],
            ['Budget', f'${project.budget:,.2f}'],
            ['Amount Spent', f'${project.spent:,.2f}'],
        ]
        
        project_table = Table(project_info, colWidths=[2*inch, 4*inch])
        project_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(project_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Tasks Section
        story.append(Paragraph("Task Summary", self.heading_style))
        
        task_summary = [
            ['Task', 'Status', 'Priority', 'Assigned To', 'Progress'],
        ]
        
        for task in tasks:
            task_summary.append([
                task.title[:30],
                task.status,
                task.priority,
                task.assigned_to.first_name if task.assigned_to else 'Unassigned',
                f"{(task.actual_hours / task.estimated_hours * 100) if task.estimated_hours else 0:.0f}%"
            ])
        
        if len(task_summary) > 1:
            task_table = Table(task_summary, colWidths=[2*inch, 1*inch, 1*inch, 1.5*inch, 1*inch])
            task_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            story.append(task_table)
        
        story.append(Spacer(1, 0.3 * inch))
        
        # Budget Section
        story.append(Paragraph("Budget Breakdown", self.heading_style))
        
        budget_summary = [
            ['Category', 'Estimated', 'Actual', 'Variance'],
        ]
        
        total_estimated = 0
        total_actual = 0
        
        for item in budget_items:
            total_estimated += item.estimated_amount or 0
            total_actual += item.actual_amount or 0
            variance = (item.actual_amount or 0) - (item.estimated_amount or 0)
            
            budget_summary.append([
                item.category or 'General',
                f"${item.estimated_amount:,.2f}" if item.estimated_amount else '$0.00',
                f"${item.actual_amount:,.2f}" if item.actual_amount else '$0.00',
                f"${variance:,.2f}"
            ])
        
        budget_summary.append([
            'TOTAL',
            f"${total_estimated:,.2f}",
            f"${total_actual:,.2f}",
            f"${total_actual - total_estimated:,.2f}"
        ])
        
        budget_table = Table(budget_summary, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        budget_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, -1), (-1, -1), colors.grey),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(budget_table)
        
        # Footer
        story.append(Spacer(1, 0.5 * inch))
        footer_text = f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(footer_text, self.normal_style))
        
        # Build PDF
        doc.build(story)
        
        return filepath
    
    def generate_financial_report(self, project, payments, output_path='uploads/reports/'):
        """
        Generate financial/payment report
        
        Args:
            project: Project object
            payments: List of Payment objects
            output_path: Path to save PDF
            
        Returns:
            Full path to generated PDF
        """
        os.makedirs(output_path, exist_ok=True)
        filepath = os.path.join(output_path, self.filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=letter)
        story = []
        
        # Title
        story.append(Paragraph(f"Financial Report: {project.name}", self.title_style))
        story.append(Spacer(1, 0.2 * inch))
        
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d')}", self.normal_style))
        story.append(Spacer(1, 0.3 * inch))
        
        # Payment Details
        story.append(Paragraph("Payment Transactions", self.heading_style))
        
        payment_data = [
            ['Date', 'Amount', 'Method', 'Reference', 'Status'],
        ]
        
        total_amount = 0
        
        for payment in payments:
            total_amount += payment.amount
            payment_data.append([
                payment.created_at.strftime('%Y-%m-%d') if payment.created_at else 'N/A',
                f"{payment.currency} {payment.amount:,.2f}",
                payment.payment_method,
                payment.mpesa_reference or 'N/A',
                payment.status.upper()
            ])
        
        # Add total row
        payment_data.append([
            'TOTAL',
            f"{payments[0].currency if payments else 'KES'} {total_amount:,.2f}",
            '',
            '',
            ''
        ])
        
        payment_table = Table(payment_data, colWidths=[1.2*inch, 1.2*inch, 1*inch, 1.5*inch, 1*inch])
        payment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, -1), (-1, -1), colors.grey),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.lightgrey]),
        ]))
        
        story.append(payment_table)
        
        # Build PDF
        doc.build(story)
        
        return filepath
