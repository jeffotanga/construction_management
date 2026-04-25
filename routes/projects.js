const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

router.get('/', authenticate, projectController.listProjects);
router.post('/', authenticate, authorizeRoles('admin', 'site_manager'), projectController.createProject);
router.get('/:id', authenticate, projectController.getProject);
router.put('/:id', authenticate, authorizeRoles('admin', 'site_manager'), projectController.updateProject);
router.delete('/:id', authenticate, authorizeRoles('admin', 'site_manager'), projectController.deleteProject);
router.post('/:id/assign-worker', authenticate, authorizeRoles('admin', 'site_manager'), projectController.assignWorker);

module.exports = router;
