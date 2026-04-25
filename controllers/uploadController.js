const path = require('path');
const fs = require('fs');
const pool = require('../db');

const safeFolder = (folder) => {
  const base = path.join(__dirname, '..', 'uploads');
  const target = path.join(base, folder);
  if (!target.startsWith(base)) throw new Error('Invalid upload folder');
  fs.mkdirSync(target, { recursive: true });
  return target;
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.files || !req.files.photo) {
      const error = new Error('Photo file is required');
      error.status = 400;
      throw error;
    }

    const photo = req.files.photo;
    const projectId = req.body.project_id;
    if (!projectId) {
      const error = new Error('project_id is required');
      error.status = 400;
      throw error;
    }

    const filename = `${Date.now()}-${photo.name}`;
    const uploadPath = path.join(safeFolder('photos'), filename);
    await photo.mv(uploadPath);

    const [result] = await pool.query(
      'INSERT INTO documents (project_id, filename, file_path, file_type, uploaded_by_id) VALUES (?, ?, ?, ?, ?)',
      [projectId, photo.name, `/uploads/photos/${filename}`, photo.mimetype, req.user.id]
    );

    res.status(201).json({ id: result.insertId, file_path: `/uploads/photos/${filename}`, filename: photo.name });
  } catch (error) {
    next(error);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.files || !req.files.document) {
      const error = new Error('Document file is required');
      error.status = 400;
      throw error;
    }

    const document = req.files.document;
    const projectId = req.body.project_id;
    if (!projectId) {
      const error = new Error('project_id is required');
      error.status = 400;
      throw error;
    }

    const filename = `${Date.now()}-${document.name}`;
    const uploadPath = path.join(safeFolder('documents'), filename);
    await document.mv(uploadPath);

    const [result] = await pool.query(
      'INSERT INTO documents (project_id, filename, file_path, file_type, uploaded_by_id) VALUES (?, ?, ?, ?, ?)',
      [projectId, document.name, `/uploads/documents/${filename}`, document.mimetype, req.user.id]
    );

    res.status(201).json({ id: result.insertId, file_path: `/uploads/documents/${filename}`, filename: document.name });
  } catch (error) {
    next(error);
  }
};
