/**
 * Application Constants
 * Centralized constants matching workflow specification exactly
 */

module.exports = {
    // User Roles
    USER_ROLES: {
        ADMIN: 'Admin',
        ACCOUNT_MANAGER: 'Account Manager',
        FINANCE: 'Finance',
        VENDOR_MANAGER: 'vendor_manager',
    },

    // User Status
    USER_STATUS: {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
    },

    // Client Types
    CLIENT_TYPES: {
        RETAINER: 'Retainer',
        CONTRACTOR: 'Contractor',
    },

    // Client Status
    CLIENT_STATUS: {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
        AT_RISK: 'At Risk',
    },

    // Contract Status
    CONTRACT_STATUS: {
        ACTIVE: 'Active',
        EXPIRED: 'Expired',
        RENEWED: 'Renewed',
    },

    // Renewal Status (State Machine)
    RENEWAL_STATUS: {
        NOT_STARTED: 'Not Started',
        CLIENT_CONTACTED: 'Client Contacted',
        PROPOSAL_SENT: 'Proposal Sent',
        NEGOTIATING: 'Negotiating',
        AWAITING_SIGNATURE: 'Awaiting Signature',
        RENEWED: 'Renewed',
        LOST: 'Lost',
    },

    // Notification Types
    NOTIFICATION_TYPES: {
        CONTRACT_EXPIRING: 'Contract Expiring',
        AT_RISK_CLIENT: 'At-Risk Client',
        UPSELL_ALERT: 'Upsell Alert',
    },

    // Churn Reasons
    CHURN_REASONS: {
        PRICING: 'Pricing',
        SERVICE_QUALITY: 'Service Quality',
        SWITCHED_TO_COMPETITOR: 'Switched to Competitor',
        OTHER: 'Other',
    },

    // Upsell Priority
    UPSELL_PRIORITY: {
        HIGH: 'High',
        MEDIUM: 'Medium',
        LOW: 'Low',
    },

    // Report Frequencies
    REPORT_FREQUENCIES: {
        DAILY: 'Daily',
        WEEKLY: 'Weekly',
        MONTHLY: 'Monthly',
        QUARTERLY: 'Quarterly',
    },

    // Email Frequencies
    EMAIL_FREQUENCIES: {
        REAL_TIME: 'Real-time',
        DAILY_DIGEST: 'Daily Digest',
        WEEKLY_SUMMARY: 'Weekly Summary',
    },

    // Validation Constants
    VALIDATION: {
        // Password Rules (exact from spec)
        PASSWORD_MIN_LENGTH: 8,
        PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,

        // Name Rules
        NAME_MIN_LENGTH: 2,
        NAME_MAX_LENGTH: 50,
        NAME_REGEX: /^[A-Za-z\s]+$/,

        // Email Rules
        EMAIL_MAX_LENGTH: 255,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

        // Project/Client Name Rules
        PROJECT_NAME_MIN: 3,
        PROJECT_NAME_MAX: 100,
        CLIENT_NAME_MIN: 2,
        CLIENT_NAME_MAX: 100,

        // Amount Rules
        MAX_AMOUNT: 10_00_00_000, // ₹10 crore
    },

    // Security Constants (exact from spec)
    SECURITY: {
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_DURATION_MINUTES: 15,
        CAPTCHA_THRESHOLD: 3,
        SESSION_TIMEOUT_MINUTES: 30,
        INACTIVITY_WARNING_MINUTES: 28,
        PASSWORD_RESET_TOKEN_EXPIRY_HOURS: 1,
    },

    // Billing Frequencies
    BILLING_FREQUENCIES: {
        MONTHLY: 'Monthly',
        YEARLY: 'Yearly',
    },

    // Revenue Types
    REVENUE_TYPES: {
        RECURRING: 'Recurring',
        ONE_TIME: 'One-Time',
    },

    // Report Formats
    REPORT_FORMATS: {
        PDF: 'PDF',
        EXCEL: 'Excel',
        BOTH: 'Both',
    },

    // Services (matching seed data)
    SERVICES: [
        'Social Media',
        'Performance Marketing',
        'SEO',
        'Design',
        'Web Development',
        'Analytics',
        'Content Marketing',
        'Paid Ads',
        'Maintenance',
    ],
};
