const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');

router.post('/photos', authenticate, authorizeRoles('admin', 'site_manager'), uploadController.uploadPhoto);
router.post('/documents', authenticate, authorizeRoles('admin', 'site_manager'), uploadController.uploadDocument);

module.exports = router;
