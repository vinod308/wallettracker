import api from './api';

class VendorService {
    async signup(data) {
        const response = await api.post('/vendors/signup', data);
        const token = response.data.data?.token;
        if (token) localStorage.setItem('auth_token', token);
        return response.data;
    }

    async getMyProfile() {
        const response = await api.get('/vendors/me');
        return response.data.data.vendor;
    }

    async updateMyProfile(data) {
        const response = await api.put('/vendors/me', data);
        return response.data.data.vendor;
    }

    async getAllVendors(params = {}) {
        const response = await api.get('/vendors', { params });
        return response.data.data.vendors;
    }

    async createVendor(data) {
        const response = await api.post('/vendors', data);
        return response.data.data.vendor;
    }

    async getVendorById(id) {
        const response = await api.get(`/vendors/${id}`);
        return response.data.data.vendor;
    }

    async raiseInvoice(data) {
        const response = await api.post('/vendors/me/invoices', data);
        return response.data.data.invoice;
    }

    async getMyInvoices() {
        const response = await api.get('/vendors/me/invoices');
        return response.data.data.invoices;
    }

    async getVendorInvoices(vendorId) {
        const response = await api.get(`/vendors/${vendorId}/invoices`);
        return response.data.data.invoices;
    }

    async updateInvoiceStatus(invoiceId, status) {
        const response = await api.put(`/vendors/invoices/${invoiceId}/status`, { status });
        return response.data.data.invoice;
    }
}

export default new VendorService();
