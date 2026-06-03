import api from './api';

// ── Bank Reconciliation ───────────────────────────────────────────────────────
export const bankReconService = {
    uploadStatement:  (payload)  => api.post('/bank-recon/upload', payload),
    getStatements:    ()         => api.get('/bank-recon/statements'),
    getStatement:     (id, filter) => api.get(`/bank-recon/statements/${id}`, { params: { filter } }),
    linkTransaction:  (txnId, invoiceId) => api.patch(`/bank-recon/transactions/${txnId}/link`, { invoiceId }),
    deleteStatement:  (id)       => api.delete(`/bank-recon/statements/${id}`),
};

// ── Reimbursements ───────────────────────────────────────────────────────────
export const reimbursementService = {
    getAll:       (params)  => api.get('/reimbursements', { params }),
    create:       (payload) => api.post('/reimbursements', payload),
    bulkImport:   (records) => api.post('/reimbursements/bulk', { records }),
    updateStatus: (id, status, rejectionReason) => api.patch(`/reimbursements/${id}/status`, { status, rejectionReason }),
    remove:       (id)      => api.delete(`/reimbursements/${id}`),
    getCategories:()        => api.get('/reimbursements/categories/summary'),
};

// ── Balance Sheet ────────────────────────────────────────────────────────────
export const balanceSheetService = {
    getData:   (fy, period) => api.get('/balance-sheet', { params: { fy, period } }),
    getYears:  ()           => api.get('/balance-sheet/years'),
};
