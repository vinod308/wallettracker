/**
 * Client Validators
 * Validation rules for client operations
 */

const { body, param, query } = require('express-validator');

const clientValidators = {
    /**
     * Validation for creating a new client
     */
    createClient: [
        // Project Name (required, 3-100 chars)
        body('projectName')
            .trim()
            .notEmpty()
            .withMessage('Project name is required')
            .isLength({ min: 3 })
            .withMessage('Project name must be at least 3 characters')
            .isLength({ max: 100 })
            .withMessage('Project name cannot exceed 100 characters'),

        // Client Name (required, 2-100 chars, unique)
        body('clientName')
            .trim()
            .notEmpty()
            .withMessage('Client name is required')
            .isLength({ min: 2 })
            .withMessage('Client name must be at least 2 characters')
            .isLength({ max: 100 })
            .withMessage('Client name cannot exceed 100 characters'),

        // Client Type (required, must be Retainer or Contractor)
        body('clientType')
            .notEmpty()
            .withMessage('Please select client type')
            .isIn(['Retainer', 'Contractor'])
            .withMessage('Client type must be either Retainer or Contractor'),

        // Industry (optional, max 100 chars)
        body('industry')
            .optional({ nullable: true, checkFalsy: true })
            .trim()
            .isLength({ max: 100 })
            .withMessage('Industry cannot exceed 100 characters'),

        // Estimated Total Budget (optional, positive number, max 10 crores)
        body('estimatedTotalBudget')
            .optional({ nullable: true, checkFalsy: true })
            .isFloat({ min: 0 })
            .withMessage('Estimated budget must be a positive number')
            .custom((value) => {
                if (value > 100000000) {
                    throw new Error('Amount cannot exceed ₹10,00,00,000');
                }
                return true;
            }),

        // Contract Start Date (required, not in past)
        body('contractStartDate')
            .notEmpty()
            .withMessage('Contract start date is required')
            .isISO8601()
            .withMessage('Invalid date format')
            .custom((value) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = new Date(value);
                startDate.setHours(0, 0, 0, 0);

                if (startDate < today) {
                    throw new Error('Cannot select past dates');
                }
                return true;
            }),

        // Contract End Date (required, must be after start date)
        body('contractEndDate')
            .notEmpty()
            .withMessage('Contract end date is required')
            .isISO8601()
            .withMessage('Invalid date format')
            .custom((value, { req }) => {
                const startDate = new Date(req.body.contractStartDate);
                const endDate = new Date(value);

                if (endDate <= startDate) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),

        // Services (required, at least one)
        body('services')
            .isArray({ min: 1 })
            .withMessage('Please select at least one service'),

        // Validate each service in the array
        body('services.*.serviceId')
            .notEmpty()
            .withMessage('Service ID is required')
            .isInt()
            .withMessage('Service ID must be a valid number'),

        body('services.*.isAddon')
            .optional()
            .isBoolean()
            .withMessage('isAddon must be a boolean'),

        body('services.*.monthlyAmount')
            .optional({ nullable: true, checkFalsy: true })
            .isFloat({ min: 0 })
            .withMessage('Service amount must be greater than 0')
            .custom((value) => {
                if (value && value > 100000000) {
                    throw new Error('Amount cannot exceed ₹10,00,00,000');
                }
                return true;
            }),

        body('services.*.yearlyAmount')
            .optional({ nullable: true, checkFalsy: true })
            .isFloat({ min: 0 })
            .withMessage('Yearly amount must be greater than 0')
            .custom((value) => {
                if (value && value > 1200000000) {
                    throw new Error('Yearly amount cannot exceed ₹120,00,00,000');
                }
                return true;
            }),

        body('services.*.billingFrequency')
            .optional()
            .isIn(['Monthly', 'Yearly'])
            .withMessage('Billing frequency must be either Monthly or Yearly'),

        // MRR (required if billing frequency is monthly)
        body('mrr')
            .notEmpty()
            .withMessage('MRR (Monthly Recurring Revenue) is required')
            .isFloat({ min: 0 })
            .withMessage('MRR must be greater than 0')
            .custom((value) => {
                if (value > 100000000) {
                    throw new Error('MRR cannot exceed ₹10,00,00,000');
                }
                return true;
            }),
    ],

    /**
     * Validation for updating a client
     */
    updateClient: [
        param('id').isInt().withMessage('Invalid client ID'),

        // All fields are optional for update
        body('projectName')
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 })
            .withMessage('Project name must be between 3-100 characters'),

        body('clientName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Client name must be between 2-100 characters'),

        body('clientType')
            .optional()
            .isIn(['Retainer', 'Contractor'])
            .withMessage('Client type must be either Retainer or Contractor'),

        body('industry')
            .optional({ nullable: true })
            .trim()
            .isLength({ max: 100 })
            .withMessage('Industry cannot exceed 100 characters'),

        body('estimatedTotalBudget')
            .optional({ nullable: true })
            .isFloat({ min: 0, max: 100000000 })
            .withMessage('Estimated budget must be between 0 and ₹10,00,00,000'),

        body('status')
            .optional()
            .isIn(['Active', 'Inactive', 'At Risk'])
            .withMessage('Status must be Active, Inactive, or At Risk'),
    ],

    /**
     * Validation for deleting a client
     */
    deleteClient: [
        param('id').isInt().withMessage('Invalid client ID'),
    ],

    /**
     * Validation for getting a single client
     */
    getClient: [
        param('id').isInt().withMessage('Invalid client ID'),
    ],

    /**
     * Validation for listing clients
     */
    listClients: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),

        query('status')
            .optional()
            .isIn(['Active', 'Inactive', 'At Risk'])
            .withMessage('Invalid status value'),

        query('clientType')
            .optional()
            .isIn(['Retainer', 'Contractor'])
            .withMessage('Invalid client type'),

        query('sortBy')
            .optional()
            .isIn(['created_at', 'client_name', 'project_name', 'mrr', 'status'])
            .withMessage('Invalid sort field'),

        query('sortOrder')
            .optional()
            .isIn(['ASC', 'DESC'])
            .withMessage('Sort order must be ASC or DESC'),
    ],

    /**
     * Validation for checking duplicate client name
     */
    checkDuplicateClientName: [
        query('clientName')
            .notEmpty()
            .withMessage('Client name is required')
            .trim(),
    ],
};

module.exports = clientValidators;
