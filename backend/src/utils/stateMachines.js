/**
 * State Machines
 * Explicit state machine definitions from specification
 */

const CONSTANTS = require('./constants');

/**
 * Authentication & Lockout State Machine
 * States: Authenticated, Unauthenticated, Locked, SessionExpired
 */
const AuthStateMachine = {
    states: {
        UNAUTHENTICATED: 'Unauthenticated',
        AUTHENTICATED: 'Authenticated',
        LOCKED: 'Locked',
        SESSION_EXPIRED: 'SessionExpired',
    },

    transitions: {
        LOGIN_SUCCESS: {
            from: 'Unauthenticated',
            to: 'Authenticated',
        },
        LOGIN_FAIL_UNDER_5: {
            from: 'Unauthenticated',
            to: 'Unauthenticated', // Increment counter
        },
        LOGIN_FAIL_OVER_5: {
            from: 'Unauthenticated',
            to: 'Locked',
        },
        LOCKOUT_EXPIRES: {
            from: 'Locked',
            to: 'Unauthenticated',
        },
        SESSION_EXPIRES: {
            from: 'Authenticated',
            to: 'SessionExpired',
        },
        LOGOUT: {
            from: 'Authenticated',
            to: 'Unauthenticated',
        },
        INACTIVITY_TIMEOUT: {
            from: 'Authenticated',
            to: 'SessionExpired',
        },
    },
};

/**
 * Password Reset Lifecycle State Machine
 * States: Idle, RequestSent, TokenValid, TokenExpired, TokenUsed, PasswordReset
 */
const PasswordResetStateMachine = {
    states: {
        IDLE: 'Idle',
        REQUEST_SENT: 'RequestSent',
        TOKEN_VALID: 'TokenValid',
        TOKEN_EXPIRED: 'TokenExpired',
        TOKEN_USED: 'TokenUsed',
        PASSWORD_RESET: 'PasswordReset',
    },

    transitions: {
        REQUEST_RESET: {
            from: 'Idle',
            to: 'RequestSent',
        },
        TOKEN_GENERATED: {
            from: 'RequestSent',
            to: 'TokenValid',
        },
        TOKEN_EXPIRED: {
            from: 'TokenValid',
            to: 'TokenExpired',
        },
        TOKEN_VALIDATED: {
            from: 'TokenValid',
            to: 'TokenValid',
        },
        PASSWORD_UPDATED: {
            from: 'TokenValid',
            to: 'PasswordReset',
            next: 'Idle',
        },
        TOKEN_ALREADY_USED: {
            from: 'TokenValid',
            to: 'TokenUsed',
        },
    },
};

/**
 * Contract Renewal Status State Machine
 * States: Not Started, Client Contacted, Proposal Sent, Negotiating,
 *         Awaiting Signature, Renewed, Lost
 */
const ContractRenewalStateMachine = {
    states: CONSTANTS.RENEWAL_STATUS,

    transitions: {
        CONTACT_CLIENT: {
            from: 'Not Started',
            to: 'Client Contacted',
        },
        SEND_PROPOSAL: {
            from: 'Client Contacted',
            to: 'Proposal Sent',
        },
        ENTER_NEGOTIATION: {
            from: 'Proposal Sent',
            to: 'Negotiating',
        },
        REQUEST_SIGNATURE: {
            from: 'Negotiating',
            to: 'Awaiting Signature',
        },
        COMPLETE_RENEWAL: {
            from: 'Awaiting Signature',
            to: 'Renewed',
        },
        MARK_LOST: {
            from: ['Not Started', 'Client Contacted', 'Proposal Sent', 'Negotiating', 'Awaiting Signature'],
            to: 'Lost',
        },
    },

    /**
     * Validate state transition
     * @param {string} currentState - Current renewal status
     * @param {string} newState - Desired new status
     * @returns {boolean} True if transition is valid
     */
    canTransition(currentState, newState) {
        // Can always mark as lost (except if already Renewed)
        if (newState === 'Lost' && currentState !== 'Renewed') {
            return true;
        }

        // Find valid transition
        for (const transition of Object.values(this.transitions)) {
            const validFrom = Array.isArray(transition.from) ? transition.from : [transition.from];
            if (validFrom.includes(currentState) && transition.to === newState) {
                return true;
            }
        }

        return false;
    },
};

/**
 * Auto-Renew Toggle State Machine
 * States: Disabled, Enabled, Processing, Error
 */
const AutoRenewStateMachine = {
    states: {
        DISABLED: 'Disabled',
        ENABLED: 'Enabled',
        PROCESSING: 'Processing',
        ERROR: 'Error',
    },

    transitions: {
        ENABLE: {
            from: 'Disabled',
            to: 'Processing',
            next: 'Enabled',
        },
        DISABLE: {
            from: 'Enabled',
            to: 'Disabled', // Immediate
        },
        TRIGGER_RENEWAL: {
            from: 'Enabled',
            to: 'Processing',
            next: 'Renewed',
        },
        FAILURE: {
            from: 'Processing',
            to: 'Error',
            next: 'Disabled',
        },
    },
};

/**
 * Report Scheduling State Machine
 * States: Draft, Scheduled, Running, Completed, Failed
 */
const ReportSchedulingStateMachine = {
    states: {
        DRAFT: 'Draft',
        SCHEDULED: 'Scheduled',
        RUNNING: 'Running',
        COMPLETED: 'Completed',
        FAILED: 'Failed',
    },

    transitions: {
        SCHEDULE: {
            from: 'Draft',
            to: 'Scheduled',
        },
        TRIGGER: {
            from: 'Scheduled',
            to: 'Running',
        },
        SUCCESS: {
            from: 'Running',
            to: 'Completed',
            next: 'Scheduled', // For next run
        },
        FAILURE: {
            from: 'Running',
            to: 'Failed',
            next: 'Scheduled', // Retry
        },
        CANCEL: {
            from: 'Scheduled',
            to: 'Draft',
        },
    },
};

module.exports = {
    AuthStateMachine,
    PasswordResetStateMachine,
    ContractRenewalStateMachine,
    AutoRenewStateMachine,
    ReportSchedulingStateMachine,
};
