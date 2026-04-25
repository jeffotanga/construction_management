const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.get('/project-summary/:projectId', authenticate, reportController.projectSummary);
router.get('/financial/:projectId', authenticate, reportController.financialReport);
router.get('/attendance/:projectId', authenticate, reportController.attendanceReport);
module.exports = router;
