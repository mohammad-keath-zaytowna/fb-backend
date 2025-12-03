const express = require('express');
const statsController = require('../controllers/statsController');
const { auth, permitRoles } = require('../middlewares/auth');

const router = express.Router();

// All stats routes require authentication and admin/superAdmin role
router.use(auth);
router.use(permitRoles('admin', 'superAdmin'));

// GET /stats - Get dashboard statistics
router.get('/', statsController.getStats);

module.exports = router;

