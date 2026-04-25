const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const workerController = require('../controllers/workerController');

router.get('/', authenticate, workerController.listWorkers);
router.post('/', authenticate, authorizeRoles('admin', 'site_manager'), workerController.createWorker);
router.post('/:workerId/assign', authenticate, authorizeRoles('admin', 'site_manager'), workerController.assignWorkerToProject);
router.get('/:workerId', authenticate, workerController.getWorker);

module.exports = router;
