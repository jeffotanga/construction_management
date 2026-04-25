const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.get('/', authenticate, paymentController.listPayments);
router.post('/', authenticate, authorizeRoles('admin', 'site_manager'), paymentController.createPayment);
router.put('/:id', authenticate, authorizeRoles('admin', 'site_manager'), paymentController.updatePayment);

module.exports = router;
