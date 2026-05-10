const bcrypt = require('bcrypt');
const pool = require('../config/database');
const vendorRepository = require('../repositories/vendorRepository');
const userRepository = require('../repositories/userRepository');
const { generateJWT } = require('../utils/helpers');
const config = require('../config/environment');
const { ConflictError, NotFoundError } = require('../middleware/errorHandler');

class VendorService {
    async signup({ fullName, email, password, vendorData }) {
        const existing = await userRepository.findByEmail(email);
        if (existing) throw new ConflictError('This email is already registered');

        const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS || 12);

        const user = await userRepository.create({ fullName, email, passwordHash, role: 'vendor' });

        const vendor = await vendorRepository.create({
            ...vendorData,
            userId: user.id,
            email,
        });

        const token = generateJWT({ userId: user.id, email: user.email });
        const expiresAt = new Date(Date.now() + (config.SESSION_TIMEOUT_MINUTES || 30) * 60 * 1000);
        await pool.query(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1,$2,$3)',
            [user.id, token, expiresAt]
        );

        return {
            user: { id: user.id, email: user.email, fullName: user.full_name, role: 'vendor' },
            token,
            vendor,
        };
    }

    async getMyProfile(userId) {
        const vendor = await vendorRepository.findByUserId(userId);
        if (!vendor) throw new NotFoundError('Vendor profile not found');
        return vendor;
    }

    async updateMyProfile(userId, updates) {
        const vendor = await vendorRepository.findByUserId(userId);
        if (!vendor) throw new NotFoundError('Vendor profile not found');
        return vendorRepository.update(vendor.id, updates);
    }

    async getAllVendors(filters) {
        return vendorRepository.findAll(filters);
    }

    async createVendor(vendorData, userId) {
        return vendorRepository.create({ ...vendorData, onboardedBy: userId });
    }

    async getVendorById(id) {
        const vendor = await vendorRepository.findById(id);
        if (!vendor) throw new NotFoundError('Vendor not found');
        return vendor;
    }

    async raiseInvoice(userId, invoiceData) {
        const vendor = await vendorRepository.findByUserId(userId);
        if (!vendor) throw new NotFoundError('Vendor profile not found');
        return vendorRepository.createInvoice({ ...invoiceData, vendorId: vendor.id });
    }

    async getMyInvoices(userId) {
        const vendor = await vendorRepository.findByUserId(userId);
        if (!vendor) throw new NotFoundError('Vendor profile not found');
        return vendorRepository.getInvoicesByVendorId(vendor.id);
    }

    async getVendorInvoices(vendorId) {
        return vendorRepository.getInvoicesByVendorId(vendorId);
    }

    async updateInvoiceStatus(invoiceId, status) {
        const invoice = await vendorRepository.updateInvoiceStatus(invoiceId, status);
        if (!invoice) throw new NotFoundError('Invoice not found');
        return invoice;
    }
}

module.exports = new VendorService();
