const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/vendorController');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');
const planLimiter      = require('../middleware/planLimiter');

const isStaff = requireRole(['Admin', 'Account Manager', 'Finance', 'vendor_manager']);
const isVendor = requireRole(['vendor']);

// Public — vendor self-registration
router.post('/signup', ctrl.signup);

// Vendor — own profile and invoices (must be before /:id to avoid Express param collision)
router.get('/me',              authenticate, isVendor, ctrl.getMyProfile);
router.put('/me',              authenticate, isVendor, ctrl.updateMyProfile);
router.post('/me/invoices',    authenticate, isVendor, ctrl.raiseInvoice);
router.get('/me/invoices',     authenticate, isVendor, ctrl.getMyInvoices);

// Staff — view/manage all vendors and their invoices
router.get('/',        authenticate, isStaff, ctrl.getAllVendors);
router.post('/',       authenticate, isStaff, planLimiter('vendor'), ctrl.createVendor);
router.put('/invoices/:invoiceId/status', authenticate, isStaff, ctrl.updateInvoiceStatus);
router.get('/:id/invoices', authenticate, isStaff, ctrl.getVendorInvoices);
router.get('/:id',     authenticate, isStaff, ctrl.getVendorById);

module.exports = router;
