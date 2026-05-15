import api from './api';

const invoiceService = {
    // Check if GST portal credentials are configured & working
    getGSTStatus: () => api.get('/invoices/gst/status'),

    // Fetch invoice details from NIC IRP portal by IRN (64-char string)
    fetchByIRN: (irn) => api.post('/invoices/gst/fetch-irn', { irn }),

    // Save a GST invoice (fetched or manual) linked to a client
    saveGSTInvoice: (payload) => api.post('/invoices/gst/save', payload),

    // List all GST invoices for a client
    getClientGSTInvoices: (clientId) => api.get(`/invoices/gst/client/${clientId}`),

    // Update payment status
    updatePaymentStatus: (id, payment_status) =>
        api.patch(`/invoices/gst/${id}/payment-status`, { payment_status }),

    // Delete a GST invoice record
    deleteGSTInvoice: (id) => api.delete(`/invoices/gst/${id}`),
};

export default invoiceService;
