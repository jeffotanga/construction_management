const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

router.get('/', authenticate, attendanceController.listAttendance);
router.post('/', authenticate, authorizeRoles('admin', 'site_manager'), attendanceController.recordAttendance);
router.get('/summary', authenticate, attendanceController.getAttendanceSummary);

module.exports = router;
