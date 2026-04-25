const PDFDocument = require('pdfkit');
const pool = require('../db');

const attachProjectData = async (projectId) => {
  const [[project]] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  const [workers] = await pool.query(
    'SELECT w.full_name, w.role, pw.assigned_role FROM project_workers pw JOIN workers w ON pw.worker_id = w.id WHERE pw.project_id = ?',
    [projectId]
  );
  const [payments] = await pool.query('SELECT * FROM payments WHERE project_id = ?', [projectId]);
  const [attendance] = await pool.query('SELECT * FROM attendance WHERE project_id = ?', [projectId]);
  return { project, workers, payments, attendance };
};

const sendPdf = (res, doc, filename) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);
  doc.end();
};

exports.projectSummary = async (req, res, next) => {
  try {
    const { project, workers, payments, attendance } = await attachProjectData(req.params.projectId);
    const doc = new PDFDocument({ margin: 40 });
    doc.fontSize(20).text(`Project Summary: ${project.name}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Location: ${project.location}`);
    doc.text(`Budget: ${project.budget}`);
    doc.text(`Start: ${project.start_date}`);
    doc.text(`End: ${project.end_date}`);
    doc.text(`Status: ${project.status}`);
    doc.moveDown();
    doc.text('Assigned Workers:', { underline: true });
    workers.forEach((worker) => {
      doc.text(`- ${worker.full_name} (${worker.role}) assigned as ${worker.assigned_role}`);
    });
    doc.moveDown();
    doc.text('Payments:', { underline: true });
    payments.forEach((payment) => {
      doc.text(`- ${payment.method} ${payment.amount} (${payment.status}) ref: ${payment.transaction_reference}`);
    });
    doc.moveDown();
    doc.text('Attendance records:', { underline: true });
    attendance.forEach((record) => {
      doc.text(`- ${record.attendance_date}: worker ${record.worker_id} ${record.status}`);
    });
    sendPdf(res, doc, `project-summary-${project.id}`);
  } catch (error) {
    next(error);
  }
};

exports.financialReport = async (req, res, next) => {
  try {
    const { project, payments } = await attachProjectData(req.params.projectId);
    const doc = new PDFDocument({ margin: 40 });
    doc.fontSize(20).text(`Financial Report: ${project.name}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Budget: ${project.budget}`);
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    doc.text(`Total paid: ${totalPaid}`);
    doc.text(`Remaining budget: ${project.budget - totalPaid}`);
    doc.moveDown();
    payments.forEach((payment) => {
      doc.text(`- ${payment.method} ${payment.amount} ${payment.status}`);
    });
    sendPdf(res, doc, `financial-report-${project.id}`);
  } catch (error) {
    next(error);
  }
};

exports.attendanceReport = async (req, res, next) => {
  try {
    const { project, attendance } = await attachProjectData(req.params.projectId);
    const doc = new PDFDocument({ margin: 40 });
    doc.fontSize(20).text(`Attendance Report: ${project.name}`, { underline: true });
    doc.moveDown();
    const summary = attendance.reduce(
      (agg, row) => {
        if (row.status === 'present') agg.present += 1;
        if (row.status === 'absent') agg.absent += 1;
        return agg;
      },
      { present: 0, absent: 0 }
    );
    doc.text(`Total present: ${summary.present}`);
    doc.text(`Total absent: ${summary.absent}`);
    doc.moveDown();
    attendance.forEach((record) => {
      doc.text(`- ${record.attendance_date}: worker ${record.worker_id} ${record.status}`);
    });
    sendPdf(res, doc, `attendance-report-${project.id}`);
  } catch (error) {
    next(error);
  }
};
