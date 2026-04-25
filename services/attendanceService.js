const pool = require('../db');

exports.getAttendanceRecords = async ({ worker_id, project_id, start_date, end_date }) => {
  const filters = [];
  const values = [];

  if (worker_id) {
    filters.push('worker_id = ?');
    values.push(worker_id);
  }
  if (project_id) {
    filters.push('project_id = ?');
    values.push(project_id);
  }
  if (start_date) {
    filters.push('attendance_date >= ?');
    values.push(start_date);
  }
  if (end_date) {
    filters.push('attendance_date <= ?');
    values.push(end_date);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM attendance ${whereClause} ORDER BY attendance_date DESC`, values);
  return rows;
};

exports.recordAttendance = async ({ worker_id, project_id, attendance_date, status, notes }) => {
  if (!worker_id || !project_id || !attendance_date || !status) {
    const error = new Error('worker_id, project_id, attendance_date and status are required');
    error.status = 400;
    throw error;
  }

  const [existing] = await pool.query(
    'SELECT id FROM attendance WHERE worker_id = ? AND project_id = ? AND attendance_date = ? LIMIT 1',
    [worker_id, project_id, attendance_date]
  );
  if (existing.length > 0) {
    const error = new Error('Attendance record already exists for this worker and date');
    error.status = 409;
    throw error;
  }

  const [result] = await pool.query(
    'INSERT INTO attendance (worker_id, project_id, attendance_date, status, notes) VALUES (?, ?, ?, ?, ?)',
    [worker_id, project_id, attendance_date, status, notes || '']
  );
  const [rows] = await pool.query('SELECT * FROM attendance WHERE id = ?', [result.insertId]);
  return rows[0];
};

exports.getWeeklySummary = async ({ worker_id, project_id }) => {
  const filters = [];
  const values = [];
  if (worker_id) {
    filters.push('worker_id = ?');
    values.push(worker_id);
  }
  if (project_id) {
    filters.push('project_id = ?');
    values.push(project_id);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT worker_id, project_id,
      SUM(status = 'present') AS total_present,
      SUM(status = 'absent') AS total_absent
      FROM attendance ${whereClause}
      GROUP BY worker_id, project_id`,
    values
  );
  return rows;
};
