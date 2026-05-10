const vendorService = require('../services/vendorService');
const { asyncHandler } = require('../middleware/errorHandler');

const signup = asyncHandler(async (req, res) => {
    const result = await vendorService.signup(req.body);
    res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000,
    });
    res.status(201).json({
        success: true,
        message: 'Vendor account created successfully',
        data: { user: result.user, vendor: result.vendor, token: result.token },
    });
});

const getMyProfile = asyncHandler(async (req, res) => {
    const vendor = await vendorService.getMyProfile(req.user.id);
    res.json({ success: true, data: { vendor } });
});

const updateMyProfile = asyncHandler(async (req, res) => {
    const vendor = await vendorService.updateMyProfile(req.user.id, req.body);
    res.json({ success: true, data: { vendor } });
});

const getAllVendors = asyncHandler(async (req, res) => {
    const vendors = await vendorService.getAllVendors(req.query);
    res.json({ success: true, data: { vendors } });
});

const createVendor = asyncHandler(async (req, res) => {
    const vendor = await vendorService.createVendor(req.body, req.user.id);
    res.status(201).json({ success: true, data: { vendor } });
});

const getVendorById = asyncHandler(async (req, res) => {
    const vendor = await vendorService.getVendorById(parseInt(req.params.id));
    res.json({ success: true, data: { vendor } });
});

const raiseInvoice = asyncHandler(async (req, res) => {
    const invoice = await vendorService.raiseInvoice(req.user.id, req.body);
    res.status(201).json({ success: true, data: { invoice } });
});

const getMyInvoices = asyncHandler(async (req, res) => {
    const invoices = await vendorService.getMyInvoices(req.user.id);
    res.json({ success: true, data: { invoices } });
});

const getVendorInvoices = asyncHandler(async (req, res) => {
    const invoices = await vendorService.getVendorInvoices(parseInt(req.params.id));
    res.json({ success: true, data: { invoices } });
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const invoice = await vendorService.updateInvoiceStatus(parseInt(req.params.invoiceId), req.body.status);
    res.json({ success: true, data: { invoice } });
});

module.exports = {
    signup, getMyProfile, updateMyProfile,
    getAllVendors, createVendor, getVendorById,
    raiseInvoice, getMyInvoices, getVendorInvoices, updateInvoiceStatus,
};
