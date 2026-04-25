const pool = require('../db');

exports.getPayments = async ({ worker_id, project_id, method, status }) => {
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
  if (method) {
    filters.push('method = ?');
    values.push(method);
  }
  if (status) {
    filters.push('status = ?');
    values.push(status);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM payments ${whereClause} ORDER BY payment_date DESC, created_at DESC`, values);
  return rows;
};

exports.createPayment = async ({ worker_id, project_id, amount, method, status, transaction_reference, bank_name, account_number, reference, proof_path, payment_date }) => {
  if (!worker_id || !project_id || !amount || !method || !transaction_reference) {
    const error = new Error('worker_id, project_id, amount, method, and transaction_reference are required');
    error.status = 400;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [duplicate] = await connection.query(
      'SELECT id FROM payments WHERE worker_id = ? AND project_id = ? AND transaction_reference = ? LIMIT 1',
      [worker_id, project_id, transaction_reference]
    );
    if (duplicate.length > 0) {
      const error = new Error('Duplicate payment record detected');
      error.status = 409;
      throw error;
    }

    const [result] = await connection.query(
      'INSERT INTO payments (worker_id, project_id, amount, method, status, transaction_reference, bank_name, account_number, reference, proof_path, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [worker_id, project_id, parseFloat(amount), method, status || 'pending', transaction_reference, bank_name || null, account_number || null, reference || null, proof_path || null, payment_date || new Date()]
    );

    await connection.commit();
    const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    return rows[0];
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.updatePayment = async (id, payload) => {
  const allowed = ['status', 'amount', 'method', 'bank_name', 'account_number', 'reference', 'proof_path', 'payment_date'];
  const updates = allowed.filter((field) => field in payload);
  if (!updates.length) {
    const error = new Error('No valid payment fields were supplied');
    error.status = 400;
    throw error;
  }
  const values = updates.map((field) => payload[field]);
  values.push(id);
  const setClause = updates.map((field) => `${field} = ?`).join(', ');
  await pool.query(`UPDATE payments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id]);
  if (!rows.length) {
    const error = new Error('Payment not found');
    error.status = 404;
    throw error;
  }
  return rows[0];
};
