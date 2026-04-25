const pool = require('../db');

const normalizeWorker = (worker) => ({
  id: worker.id,
  full_name: worker.full_name,
  id_number: worker.id_number,
  role: worker.role,
  phone: worker.phone,
  email: worker.email,
  created_at: worker.created_at,
  updated_at: worker.updated_at,
});

exports.getWorkers = async () => {
  const [rows] = await pool.query('SELECT * FROM workers ORDER BY created_at DESC');
  return rows.map(normalizeWorker);
};

exports.createWorker = async ({ full_name, id_number, role, phone, email }) => {
  if (!full_name || !id_number || !role || !phone) {
    const error = new Error('Worker full name, ID number, role and phone are required');
    error.status = 400;
    throw error;
  }

  const [checkRows] = await pool.query('SELECT id FROM workers WHERE id_number = ?', [id_number]);
  if (checkRows.length > 0) {
    const error = new Error('Worker with this ID number already exists');
    error.status = 409;
    throw error;
  }

  const [result] = await pool.query(
    'INSERT INTO workers (full_name, id_number, role, phone, email) VALUES (?, ?, ?, ?, ?)',
    [full_name, id_number, role, phone, email || null]
  );
  const [rows] = await pool.query('SELECT * FROM workers WHERE id = ?', [result.insertId]);
  return normalizeWorker(rows[0]);
};

exports.assignWorker = async (workerId, projectId, assigned_role) => {
  if (!projectId) {
    const error = new Error('project_id is required');
    error.status = 400;
    throw error;
  }

  const [checkWorker] = await pool.query('SELECT id FROM workers WHERE id = ?', [workerId]);
  if (checkWorker.length === 0) {
    const error = new Error('Worker not found');
    error.status = 404;
    throw error;
  }

  const [checkProject] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
  if (checkProject.length === 0) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  await pool.query(
    'INSERT IGNORE INTO project_workers (project_id, worker_id, assigned_role) VALUES (?, ?, ?)',
    [projectId, workerId, assigned_role || 'worker']
  );
  return { worker_id: Number(workerId), project_id: Number(projectId), assigned_role: assigned_role || 'worker' };
};

exports.getWorkerById = async (workerId) => {
  const [rows] = await pool.query('SELECT * FROM workers WHERE id = ?', [workerId]);
  if (rows.length === 0) {
    const error = new Error('Worker not found');
    error.status = 404;
    throw error;
  }
  return normalizeWorker(rows[0]);
};
