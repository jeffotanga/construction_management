const pool = require('../db');

const normalizeProject = (row) => ({
  id: row.id,
  name: row.name,
  location: row.location,
  budget: Number(row.budget),
  start_date: row.start_date,
  end_date: row.end_date,
  status: row.status,
  description: row.description,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

exports.getProjects = async ({ user }) => {
  const [rows] = await pool.query('SELECT * FROM projects ORDER BY start_date DESC, id DESC');
  return rows.map(normalizeProject);
};

exports.createProject = async ({ name, location, budget, start_date, end_date, status, description, owner_id }) => {
  if (!name || !location || !budget || !start_date || !end_date || !status) {
    const error = new Error('All project fields are required');
    error.status = 400;
    throw error;
  }

  const [result] = await pool.query(
    'INSERT INTO projects (name, location, budget, start_date, end_date, status, description, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, location, parseFloat(budget), start_date, end_date, status, description || '', owner_id]
  );

  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
  return normalizeProject(rows[0]);
};

exports.getProjectById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  if (rows.length === 0) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }
  const project = normalizeProject(rows[0]);
  const [workers] = await pool.query(
    'SELECT w.id, w.full_name, w.role, w.phone, pw.assigned_role, pw.assigned_at FROM project_workers pw JOIN workers w ON pw.worker_id = w.id WHERE pw.project_id = ?',
    [id]
  );
  const [documents] = await pool.query('SELECT id, filename, file_path, file_type, created_at FROM documents WHERE project_id = ?', [id]);
  const [tasks] = await pool.query('SELECT id, title, status, priority, due_date FROM tasks WHERE project_id = ?', [id]);
  return { ...project, workers, documents, tasks };
};

exports.updateProject = async (id, payload) => {
  const allowed = ['name', 'location', 'budget', 'start_date', 'end_date', 'status', 'description'];
  const updates = allowed.filter((field) => field in payload);
  if (updates.length === 0) {
    const error = new Error('No valid fields to update');
    error.status = 400;
    throw error;
  }

  const values = updates.map((key) => payload[key]);
  const setClause = updates.map((field) => `${field} = ?`).join(', ');
  values.push(id);

  await pool.query(`UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  return normalizeProject(rows[0]);
};

exports.deleteProject = async (id) => {
  const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }
  return true;
};

exports.assignWorkerToProject = async (projectId, { worker_id, assigned_role }) => {
  if (!worker_id) {
    const error = new Error('worker_id is required');
    error.status = 400;
    throw error;
  }

  const [checkProject] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
  if (checkProject.length === 0) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  const [checkWorker] = await pool.query('SELECT id FROM workers WHERE id = ?', [worker_id]);
  if (checkWorker.length === 0) {
    const error = new Error('Worker not found');
    error.status = 404;
    throw error;
  }

  await pool.query(
    'INSERT IGNORE INTO project_workers (project_id, worker_id, assigned_role) VALUES (?, ?, ?)',
    [projectId, worker_id, assigned_role || 'worker']
  );
  return { project_id: Number(projectId), worker_id: Number(worker_id), assigned_role: assigned_role || 'worker' };
};
