# Garage WalletTracker — Nomenclature & Database Structure

**Project:** Garage WalletTracker
**Owner:** Garage Collective
**Version:** 1.0
**Last Updated:** 2026-05-13

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Nomenclature / Glossary](#2-nomenclature--glossary)
   - 2.1 [Business Terms](#21-business-terms)
   - 2.2 [Technical Terms](#22-technical-terms)
   - 2.3 [Status & State Values](#23-status--state-values)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Database Overview](#4-database-overview)
5. [Table Definitions](#5-table-definitions)
   - 5.01 [users](#501-users)
   - 5.02 [password_reset_tokens](#502-password_reset_tokens)
   - 5.03 [sessions](#503-sessions)
   - 5.04 [clients](#504-clients)
   - 5.05 [contracts](#505-contracts)
   - 5.06 [services](#506-services)
   - 5.07 [client_services](#507-client_services)
   - 5.08 [revenue_records](#508-revenue_records)
   - 5.09 [upsell_opportunities](#509-upsell_opportunities)
   - 5.10 [renewal_tasks](#510-renewal_tasks)
   - 5.11 [notifications](#511-notifications)
   - 5.12 [scheduled_reports](#512-scheduled_reports)
   - 5.13 [audit_logs](#513-audit_logs)
   - 5.14 [notification_preferences](#514-notification_preferences)
   - 5.15 [churn_reasons](#515-churn_reasons)
6. [Entity Relationship Summary](#6-entity-relationship-summary)
7. [State Machines](#7-state-machines)
   - 7.1 [Authentication State Machine](#71-authentication-state-machine)
   - 7.2 [Password Reset State Machine](#72-password-reset-state-machine)
   - 7.3 [Contract Renewal State Machine](#73-contract-renewal-state-machine)
   - 7.4 [Auto-Renew State Machine](#74-auto-renew-state-machine)
   - 7.5 [Report Scheduling State Machine](#75-report-scheduling-state-machine)
8. [Services Catalog (Seed Data)](#8-services-catalog-seed-data)
9. [Indexing Strategy](#9-indexing-strategy)
10. [Security Design Notes](#10-security-design-notes)

---

## 1. Project Overview

**Garage WalletTracker** is a production-grade fintech web application built for **Garage Collective** to manage and grow revenue from their client base. The name "Wallet" refers to **Share of Wallet** — the percentage of a client's total marketing/technology budget that Garage Collective currently captures.

### Core Business Problem

Garage Collective serves clients on retainer or contractor engagements. The platform helps account managers:

- Track how much each client spends (their "wallet")
- Identify how much more the client _could_ spend (wallet gap / upsell potential)
- Monitor when contracts are expiring and manage the renewal pipeline
- Alert the team to clients at risk of churning
- Generate revenue reports for leadership and finance

### Tech Stack Summary

| Layer     | Technology                          |
|-----------|--------------------------------------|
| Backend   | Node.js 18+, Express.js 4.x          |
| Database  | PostgreSQL 15+                       |
| Auth      | JWT (HTTP-only cookies) + bcrypt     |
| Frontend  | React 18+, Vite, TailwindCSS         |
| Charts    | Recharts                             |
| Logging   | Winston                              |

---

## 2. Nomenclature / Glossary

### 2.1 Business Terms

| Term | Definition |
|------|-----------|
| **Wallet** | The total amount of money a client is spending on services similar to what Garage Collective offers. Includes spending both with Garage Collective and with competitors. |
| **Share of Wallet (SoW)** | The percentage of the client's total wallet that Garage Collective currently captures. Formula: `(Current Revenue / Estimated Total Budget) × 100`. |
| **Wallet Gap** | The revenue opportunity remaining. Formula: `Estimated Total Budget − Current Revenue`. A high wallet gap means the client spends significantly more with competitors or on similar services elsewhere. |
| **MRR** | Monthly Recurring Revenue. The stable, predictable revenue earned from a client per month under a retainer or recurring contract. |
| **ARR** | Annual Recurring Revenue. `MRR × 12`. Used for annual forecasting. |
| **Retainer Client** | A client on a fixed monthly engagement where Garage Collective provides ongoing services for an agreed monthly fee. |
| **Contractor Client** | A client on a project-by-project basis. Revenue is variable and tied to specific deliverables rather than a monthly retainer. |
| **Upsell** | Selling additional services to an existing client that they are not currently buying. Example: a client on Social Media retainer being upsold SEO services. |
| **Upsell Opportunity** | A formally identified and tracked potential upsell for a specific client, including the recommended services and expected revenue gain. |
| **Churn** | When a client ends their engagement with Garage Collective and does not renew. Tracked with a reason for analysis. |
| **At-Risk Client** | A client whose engagement is in danger of churning, flagged either by the system (contract nearing expiry with no renewal started) or manually by an account manager. |
| **Contract Renewal** | The process of negotiating and signing a new contract before the current one expires. Tracked through a pipeline with defined stages. |
| **Renewal Task** | An actionable assignment given to an account manager to drive a specific contract renewal forward. |
| **Auto-Renew** | A flag on a contract that, when enabled, automatically triggers a contract extension 30 days before the expiry date. |
| **Industry** | The business sector the client operates in (e.g., E-commerce, Healthcare, Finance). Used for segmentation and analytics. |
| **Service** | A specific offering provided by Garage Collective (e.g., SEO, Social Media, Web Development). |
| **Add-on Service** | An additional service layered on top of a client's primary engagement, billed separately. |
| **Scheduled Report** | An automatically generated report (PDF or Excel) sent to specified recipients on a configured frequency (daily, weekly, monthly, quarterly). |
| **Audit Log** | An immutable record of every significant action performed in the system, capturing what changed, who changed it, and when. |

### 2.2 Technical Terms

| Term | Definition |
|------|-----------|
| **Migration** | A versioned SQL script that creates or modifies the database schema. Migrations are run in sequence and are numbered (001, 002, …). |
| **Seed Data** | Initial reference data inserted into the database when the application is set up. The services catalog is seeded. |
| **Soft Delete** | Rather than permanently removing a record, a `deleted_at` timestamp is set. Queries filter out soft-deleted records but the data is preserved for audit purposes. |
| **JWT** | JSON Web Token. A signed token issued on login, stored in an HTTP-only cookie, and validated on every authenticated request. |
| **HTTP-only Cookie** | A browser cookie that cannot be accessed by JavaScript, making it immune to XSS-based token theft. |
| **bcrypt** | A password hashing algorithm. Passwords are never stored in plain text; only the hash is stored. The system uses 12 rounds for production-strength security. |
| **Rate Limiting** | Restricting how many requests a given IP address or user can make in a time window to prevent brute-force attacks. |
| **RBAC** | Role-Based Access Control. Permissions in the system are determined by the user's assigned role (Admin, Account Manager, Finance). |
| **State Machine** | A formal model describing the allowed states a record can be in and the valid transitions between those states. Used for contract renewal status, session state, and report scheduling. |
| **Parameterized Query** | A SQL query where user-supplied values are passed as separate parameters (not embedded in the SQL string), preventing SQL injection. |
| **CSRF** | Cross-Site Request Forgery. An attack where a malicious site tricks an authenticated user's browser into making unintended requests. Mitigated with SameSite cookies and CORS restrictions. |
| **Repository Layer** | The data access layer in the backend architecture. Repositories contain all SQL queries and interact directly with the database. |
| **Service Layer** | The business logic layer. Services orchestrate calls to repositories and enforce business rules. |
| **Controller Layer** | The HTTP layer. Controllers handle incoming API requests, call services, and send responses. |

### 2.3 Status & State Values

#### Client Status
| Value | Meaning |
|-------|---------|
| `Active` | Client is currently engaged with Garage Collective |
| `Inactive` | Client engagement has ended (no current contract) |
| `At Risk` | Client has been flagged as at risk of churning |

#### Client Type
| Value | Meaning |
|-------|---------|
| `Retainer` | Client on a fixed monthly ongoing engagement |
| `Contractor` | Client on a project or milestone basis |

#### Contract Status
| Value | Meaning |
|-------|---------|
| `Active` | Contract is currently running |
| `Expired` | Contract end date has passed and was not renewed |
| `Renewed` | Contract was renewed; this record represents the old contract |

#### Contract Renewal Status (Pipeline Stages)
| Value | Meaning |
|-------|---------|
| `Not Started` | No renewal action has been taken yet |
| `Client Contacted` | The account manager has reached out to the client about renewal |
| `Proposal Sent` | A formal renewal proposal has been sent |
| `Negotiating` | Client and Garage Collective are negotiating terms |
| `Awaiting Signature` | Terms agreed; waiting for signed contract |
| `Renewed` | Contract successfully renewed |
| `Lost` | Client chose not to renew |

#### User Role
| Value | Meaning |
|-------|---------|
| `Admin` | Full access to all features including user management |
| `Account Manager` | Manages clients, contracts, renewals, and upsells |
| `Finance` | Read access to revenue data and reports |

#### User Status
| Value | Meaning |
|-------|---------|
| `Active` | User can log in and use the system |
| `Inactive` | User account has been deactivated |

#### Upsell Opportunity Status
| Value | Meaning |
|-------|---------|
| `Identified` | Opportunity has been spotted and logged |
| `In Progress` | Account manager is actively pitching the upsell |
| `Won` | Client agreed to the additional service(s) |
| `Lost` | Client declined the upsell |

#### Renewal Task Status
| Value | Meaning |
|-------|---------|
| `Pending` | Task has been created but work has not started |
| `In Progress` | Account manager is actively working on it |
| `Completed` | Task has been finished |
| `Cancelled` | Task is no longer relevant |

#### Notification Type
| Value | Meaning |
|-------|---------|
| `Contract Expiring` | A contract is approaching its end date |
| `At-Risk Client` | A client has been flagged as at risk |
| `Upsell Alert` | A new upsell opportunity has been identified |

#### Churn Reason
| Value | Meaning |
|-------|---------|
| `Pricing` | Client left because the price was too high |
| `Service Quality` | Client left due to dissatisfaction with service delivery |
| `Switched to Competitor` | Client moved to a competing agency |
| `Other` | Any other reason (described in notes) |

---

## 3. User Roles & Permissions

The system uses **Role-Based Access Control (RBAC)** with three roles.

| Feature / Action | Admin | Account Manager | Finance |
|-----------------|-------|----------------|---------|
| Manage users (create, deactivate) | Yes | No | No |
| View all clients | Yes | Yes | Yes |
| Create / edit clients | Yes | Yes | No |
| View contracts | Yes | Yes | Yes |
| Create / manage contracts | Yes | Yes | No |
| Manage renewal tasks | Yes | Yes | No |
| View revenue data | Yes | Yes | Yes |
| Export revenue reports | Yes | Yes | Yes |
| Schedule reports | Yes | No | Yes |
| View audit logs | Yes | No | No |
| Configure notifications | Yes | Yes | Yes |
| View upsell opportunities | Yes | Yes | Yes |
| Manage upsell opportunities | Yes | Yes | No |

---

## 4. Database Overview

The database uses **PostgreSQL 15+**. It contains **15 tables** organized into four logical groups:

### Group 1 — Authentication & Security
Tables that manage who can log in and how sessions and password resets work.

| Table | Purpose |
|-------|---------|
| `users` | User accounts, roles, and login security |
| `sessions` | Active login sessions with inactivity tracking |
| `password_reset_tokens` | Single-use tokens for password recovery |

### Group 2 — Core Business Data
Tables that hold the primary business entities the platform manages.

| Table | Purpose |
|-------|---------|
| `clients` | Client and project information |
| `contracts` | Client contracts with renewal pipeline |
| `services` | Catalog of available services |
| `client_services` | Which services each client subscribes to, with pricing |
| `revenue_records` | Historical revenue data for analytics |

### Group 3 — Actions & Opportunities
Tables that track work being done and future potential.

| Table | Purpose |
|-------|---------|
| `upsell_opportunities` | Identified upsell opportunities with status tracking |
| `renewal_tasks` | Assigned tasks for driving contract renewals |
| `churn_reasons` | Records why a client churned |

### Group 4 — System & Operations
Tables that support notifications, reporting, and system auditing.

| Table | Purpose |
|-------|---------|
| `notifications` | In-app alerts for users |
| `notification_preferences` | Per-user notification settings |
| `scheduled_reports` | Automated report schedules and configuration |
| `audit_logs` | Immutable record of all data changes |

---

## 5. Table Definitions

### 5.01 `users`

Stores all user accounts. This is the central identity table — nearly every other table references `users(id)` for ownership and assignment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `full_name` | VARCHAR(50) | NOT NULL | User's display name (2–50 chars, letters and spaces only) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email address |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash of the user's password (12 rounds) |
| `role` | VARCHAR(20) | DEFAULT 'Account Manager' | One of: `Admin`, `Account Manager`, `Finance` |
| `phone_number` | VARCHAR(20) | nullable | Optional contact phone number |
| `department` | VARCHAR(100) | nullable | Department within Garage Collective |
| `time_zone` | VARCHAR(50) | DEFAULT 'Asia/Kolkata' | User's local time zone (for notifications and reports) |
| `profile_picture_url` | TEXT | nullable | URL to the user's uploaded profile image |
| `status` | VARCHAR(20) | DEFAULT 'Active' | One of: `Active`, `Inactive` |
| `email_verified` | BOOLEAN | DEFAULT FALSE | Whether the user's email has been verified |
| `failed_login_attempts` | INT | DEFAULT 0 | Counter for consecutive failed logins; resets on success |
| `account_locked_until` | TIMESTAMP | nullable | Account is locked until this timestamp (set after 5 failures) |
| `last_login_at` | TIMESTAMP | nullable | Timestamp of the most recent successful login |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |
| `deleted_at` | TIMESTAMP | nullable | Soft-delete timestamp; NULL means active |

**Business Rules:**
- After **5 consecutive failed logins**, `account_locked_until` is set to `NOW() + 15 minutes`.
- `failed_login_attempts` resets to 0 on a successful login.
- Soft delete: set `deleted_at` instead of deleting the row.

**Indexes:** `email`, `status`, `role`

---

### 5.02 `password_reset_tokens`

Tracks tokens generated when a user requests a password reset. Each token is single-use and expires after 1 hour.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `user_id` | INT | NOT NULL, FK → users(id) | The user who requested the reset |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Cryptographically random token sent in the reset email |
| `expires_at` | TIMESTAMP | NOT NULL | Token becomes invalid after this time (1 hour from creation) |
| `used_at` | TIMESTAMP | nullable | Set when the token is consumed; prevents reuse |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the token was generated |

**Business Rules:**
- Token is valid only if `expires_at > NOW()` AND `used_at IS NULL`.
- After a successful password reset, `used_at` is set immediately.
- The API always returns a success response to password reset requests, even if the email is not found, to prevent email enumeration attacks.

**Indexes:** `token`, `expires_at`, `user_id`

---

### 5.03 `sessions`

Tracks all active user sessions. Sessions expire after **30 minutes of inactivity**. Every authenticated API call updates `last_activity`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `user_id` | INT | NOT NULL, FK → users(id) | The user this session belongs to |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | The JWT token string stored in the HTTP-only cookie |
| `expires_at` | TIMESTAMP | NOT NULL | Rolling expiry: `last_activity + 30 minutes` |
| `last_activity` | TIMESTAMP | DEFAULT NOW() | Updated on every API request to extend the session |
| `ip_address` | VARCHAR(45) | nullable | IP address at login (supports IPv6) |
| `user_agent` | TEXT | nullable | Browser/device info at login |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the session was created (login time) |

**Business Rules:**
- The frontend shows an **inactivity warning modal at 28 minutes** of inactivity.
- At **30 minutes** of inactivity the session is automatically invalidated.
- Logging out deletes the session row.
- Changing password invalidates all active sessions for that user.

**Indexes:** `token`, `user_id`, `expires_at`

---

### 5.04 `clients`

The central business entity. Each row represents a client project engagement. A single real-world company may have multiple rows if they have multiple distinct projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `project_name` | VARCHAR(100) | NOT NULL | Name of the specific project or engagement |
| `client_name` | VARCHAR(100) | NOT NULL | Name of the client company or organization |
| `client_type` | VARCHAR(20) | NOT NULL | One of: `Retainer`, `Contractor` |
| `industry` | VARCHAR(100) | nullable | Client's business sector (e.g., E-commerce, Healthcare) |
| `estimated_total_budget` | DECIMAL(12,2) | nullable | Client's estimated total annual marketing/tech budget (used for Share of Wallet calculation) |
| `status` | VARCHAR(20) | DEFAULT 'Active' | One of: `Active`, `Inactive`, `At Risk` |
| `created_by` | INT | FK → users(id) | User who added this client to the system |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |
| `deleted_at` | TIMESTAMP | nullable | Soft-delete timestamp |

**Business Rules:**
- `estimated_total_budget` is critical for **Share of Wallet** calculations. Without it, SoW cannot be computed.
- Status transitions to `At Risk` either manually by an account manager or automatically by the system when a contract nears expiry with no renewal action taken.

**Indexes:** `client_name`, `project_name`, `status`, `client_type`, `industry`

---

### 5.05 `contracts`

Stores all contracts for clients. A client can have multiple contracts over time (e.g., each annual renewal creates a new contract row). The `previous_contract_id` links the chain of renewals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `client_id` | INT | NOT NULL, FK → clients(id) | The client this contract belongs to |
| `start_date` | DATE | NOT NULL | Date the contract period begins |
| `end_date` | DATE | NOT NULL | Date the contract period ends |
| `mrr` | DECIMAL(12,2) | NOT NULL | Monthly Recurring Revenue for this contract |
| `auto_renew` | BOOLEAN | DEFAULT FALSE | If TRUE, auto-renewal triggers 30 days before `end_date` |
| `renewal_status` | VARCHAR(20) | DEFAULT 'Not Started' | Pipeline stage of the renewal process (see State Machine §7.3) |
| `assigned_to` | INT | FK → users(id) | Account manager responsible for this contract's renewal |
| `previous_contract_id` | INT | FK → contracts(id) | References the prior contract this one renewed (nullable for first contracts) |
| `status` | VARCHAR(20) | DEFAULT 'Active' | One of: `Active`, `Expired`, `Renewed` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |

**Business Rules:**
- When a contract is renewed, the old contract's `status` is set to `Renewed`, and a new contract row is created with `previous_contract_id` pointing to the old one.
- When `auto_renew = TRUE` and the contract is within 30 days of `end_date`, the system automatically creates a new contract.
- `renewal_status` follows a strict state machine (see §7.3).
- `ARR = mrr × 12`

**Indexes:** `client_id`, `end_date`, `status`, `renewal_status`, `assigned_to`

---

### 5.06 `services`

A catalog (lookup table) of all service types that Garage Collective can offer to clients. This list is seeded at setup and extended by admins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Name of the service (e.g., "SEO", "Social Media") |
| `category` | VARCHAR(50) | nullable | Grouping category (e.g., "Marketing", "Technology", "Creative") |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Pre-seeded Services:**

| Name | Category |
|------|----------|
| Social Media | Marketing |
| Performance Marketing | Marketing |
| SEO | Marketing |
| Design | Creative |
| Web Development | Technology |
| Analytics | Data |
| Content Marketing | Marketing |
| Paid Ads | Marketing |
| Maintenance | Technology |

**Indexes:** `name`, `category`

---

### 5.07 `client_services`

A junction table implementing the many-to-many relationship between clients and services. Each row means: "Client X subscribes to Service Y, at these pricing terms."

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `client_id` | INT | NOT NULL, FK → clients(id) | The client subscribing to the service |
| `service_id` | INT | NOT NULL, FK → services(id) | The service being delivered |
| `is_addon` | BOOLEAN | DEFAULT FALSE | TRUE if this service is an add-on rather than a core service |
| `monthly_amount` | DECIMAL(12,2) | nullable | What the client pays per month for this service |
| `yearly_amount` | DECIMAL(12,2) | nullable | What the client pays per year (used for annual billing) |
| `billing_frequency` | VARCHAR(10) | nullable | One of: `Monthly`, `Yearly` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Unique Constraint:** `(client_id, service_id)` — a client can only subscribe to each service once.

**Business Rules:**
- When aggregating a client's total revenue, sum `monthly_amount` across all their `client_services` rows.
- Services marked `is_addon = TRUE` are secondary offerings layered on top of the primary retainer.

**Indexes:** `client_id`, `service_id`

---

### 5.08 `revenue_records`

Immutable historical records of revenue earned from clients. Used for trend analysis, reporting, and charts. Records are appended; they are never edited after creation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `client_id` | INT | NOT NULL, FK → clients(id) | The client this revenue is attributed to |
| `service_id` | INT | FK → services(id) | The service that generated this revenue (nullable for bundled revenue) |
| `amount` | DECIMAL(12,2) | NOT NULL | Revenue amount in INR (or base currency) |
| `record_date` | DATE | NOT NULL | The date this revenue was recognized (not created) |
| `record_type` | VARCHAR(20) | nullable | One of: `Recurring`, `One-Time` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When this record was inserted |

**Business Rules:**
- `record_date` is the revenue recognition date, not the system insertion date. This allows backdating revenue.
- `record_type = 'Recurring'` for monthly retainer payments.
- `record_type = 'One-Time'` for ad-hoc project or setup fees.

**Indexes:** `client_id`, `record_date`, `service_id`, `record_type`

---

### 5.09 `upsell_opportunities`

Tracks identified opportunities to sell additional services to existing clients. Account managers log these and update their status as the opportunity is pursued.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `client_id` | INT | NOT NULL, FK → clients(id) | The client this upsell opportunity is for |
| `recommended_services` | TEXT[] | nullable | PostgreSQL array of service names to be pitched to the client |
| `potential_gain` | DECIMAL(12,2) | nullable | Estimated additional MRR if the upsell is won |
| `probability` | INT | CHECK 0–100 | Estimated likelihood of winning this opportunity (percentage) |
| `priority` | VARCHAR(10) | nullable | One of: `High`, `Medium`, `Low` |
| `status` | VARCHAR(20) | DEFAULT 'Identified' | One of: `Identified`, `In Progress`, `Won`, `Lost` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |

**Business Rules:**
- `potential_gain` combined with `probability` gives a weighted pipeline value: `potential_gain × (probability / 100)`.
- When an upsell is `Won`, the new service should be added to `client_services` and a `revenue_records` entry created.

**Indexes:** `client_id`, `priority`, `status`

---

### 5.10 `renewal_tasks`

Actionable work items assigned to account managers for pursuing contract renewals. Each task is linked to a specific contract.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `client_id` | INT | NOT NULL, FK → clients(id) | The client whose contract is being renewed |
| `contract_id` | INT | NOT NULL, FK → contracts(id) | The specific contract this task relates to |
| `assigned_to` | INT | NOT NULL, FK → users(id) | The account manager responsible for completing this task |
| `priority` | VARCHAR(10) | nullable | One of: `High`, `Medium`, `Low` |
| `due_date` | DATE | NOT NULL | Target completion date (recommended: 30 days before contract `end_date`) |
| `proposed_terms` | TEXT | nullable | Free-text description of the renewal terms being offered |
| `notes` | TEXT | nullable | Any additional context or notes |
| `status` | VARCHAR(20) | DEFAULT 'Pending' | One of: `Pending`, `In Progress`, `Completed`, `Cancelled` |
| `created_by` | INT | FK → users(id) | User who created this task |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |

**Indexes:** `assigned_to`, `due_date`, `status`, `client_id`

---

### 5.11 `notifications`

In-app notifications shown to users in the notification panel. Each notification is tied to a specific user and marked read/unread.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `user_id` | INT | NOT NULL, FK → users(id) | The user this notification is addressed to |
| `type` | VARCHAR(30) | nullable | One of: `Contract Expiring`, `At-Risk Client`, `Upsell Alert` |
| `title` | VARCHAR(200) | NOT NULL | Short notification headline |
| `description` | TEXT | nullable | Detailed notification body text |
| `link_url` | VARCHAR(500) | nullable | Deep link URL to the relevant page in the app |
| `read_at` | TIMESTAMP | nullable | NULL = unread. Set to current timestamp when the user reads it |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the notification was generated |

**Business Rules:**
- Unread count = count of rows where `user_id = <current user>` AND `read_at IS NULL`.
- "Mark all as read" sets `read_at = NOW()` on all unread rows for the user.

**Indexes:** `user_id`, `read_at`, `type`, `created_at`

---

### 5.12 `scheduled_reports`

Stores the configuration for automated reports that are generated and emailed on a schedule.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `report_type` | VARCHAR(50) | NOT NULL | Type of report (e.g., "Revenue Summary", "Client Health") |
| `configuration` | JSON | NOT NULL | Report-specific settings (filters, date ranges, columns to include) |
| `frequency` | VARCHAR(20) | nullable | One of: `Daily`, `Weekly`, `Monthly`, `Quarterly` |
| `schedule_time` | TIME | NOT NULL | Time of day the report runs (in the creator's time zone) |
| `schedule_day_of_week` | INT | CHECK 0–6 | Day of the week for weekly reports (0=Sunday … 6=Saturday) |
| `schedule_day_of_month` | INT | CHECK 1–31 | Day of the month for monthly reports |
| `recipients` | TEXT[] | nullable | Array of email addresses to receive the report |
| `format` | VARCHAR(10) | nullable | One of: `PDF`, `Excel`, `Both` |
| `include_note` | TEXT | nullable | Optional personalized note included in the email body |
| `next_run_at` | TIMESTAMP | nullable | Calculated timestamp for the next scheduled execution |
| `created_by` | INT | FK → users(id) | User who created this schedule |
| `active` | BOOLEAN | DEFAULT TRUE | If FALSE, the schedule is paused and will not run |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |

**Business Rules:**
- After each successful run, `next_run_at` is recalculated based on `frequency`.
- If `active = FALSE`, the scheduler skips this row.
- `schedule_day_of_week` is only relevant when `frequency = 'Weekly'`.
- `schedule_day_of_month` is only relevant when `frequency = 'Monthly'` or `'Quarterly'`.

**Indexes:** `next_run_at`, `active`, `report_type`

---

### 5.13 `audit_logs`

An immutable append-only log of all significant data changes. Used for compliance, debugging, and security investigations. Rows are never updated or deleted.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `user_id` | INT | FK → users(id) | The user who performed the action (nullable for system actions) |
| `action` | VARCHAR(100) | NOT NULL | What was done (e.g., `CLIENT_CREATED`, `CONTRACT_STATUS_UPDATED`, `USER_LOGIN`) |
| `entity_type` | VARCHAR(50) | nullable | The table or entity that was affected (e.g., `clients`, `contracts`) |
| `entity_id` | INT | nullable | The primary key of the affected record |
| `old_values` | JSON | nullable | Snapshot of the record's data **before** the change |
| `new_values` | JSON | nullable | Snapshot of the record's data **after** the change |
| `ip_address` | VARCHAR(45) | nullable | IP address of the request (supports IPv6) |
| `user_agent` | TEXT | nullable | Browser/device info of the request |
| `created_at` | TIMESTAMP | DEFAULT NOW() | When the action occurred |

**Business Rules:**
- Rows are written by the backend service layer automatically on create/update/delete operations.
- `old_values` and `new_values` are JSON snapshots for full diff visibility.
- This table is read-only from the application layer; no updates or deletes are permitted.

**Indexes:** `user_id`, `created_at`, `(entity_type, entity_id)`, `action`

---

### 5.14 `notification_preferences`

Each user has exactly one row here (enforced by the UNIQUE constraint on `user_id`). Stores what types of notifications the user wants to receive and how.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `user_id` | INT | UNIQUE, NOT NULL, FK → users(id) | The user these preferences belong to |
| `email_contract_expiring` | BOOLEAN | DEFAULT TRUE | Send an email when a contract is nearing expiry |
| `email_at_risk_client` | BOOLEAN | DEFAULT TRUE | Send an email when a client is flagged at risk |
| `email_upsell_opportunity` | BOOLEAN | DEFAULT TRUE | Send an email when a new upsell is identified |
| `email_frequency` | VARCHAR(20) | DEFAULT 'Real-time' | One of: `Real-time`, `Daily Digest`, `Weekly Summary` |
| `in_app_enabled` | BOOLEAN | DEFAULT TRUE | Show in-app notification bell alerts |
| `desktop_notifications` | BOOLEAN | DEFAULT FALSE | Push notifications via browser (if permission granted) |
| `notification_sound` | BOOLEAN | DEFAULT TRUE | Play a sound when a new in-app notification arrives |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last modification time |

**Business Rules:**
- A preferences row is automatically created with default values when a new user is registered.
- `email_frequency = 'Daily Digest'` means notifications are batched into a single daily email instead of being sent individually.

**Indexes:** `user_id`

---

### 5.15 `churn_reasons`

Records the reason when a client is lost (churns). Used for analytics to identify patterns in why clients leave and inform retention strategies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `client_id` | INT | NOT NULL, FK → clients(id) | The client who churned |
| `contract_id` | INT | FK → contracts(id) | The specific contract that was lost (nullable) |
| `reason` | VARCHAR(50) | nullable | One of: `Pricing`, `Service Quality`, `Switched to Competitor`, `Other` |
| `notes` | TEXT | NOT NULL | Required. Detailed explanation of the churn circumstances |
| `churned_at` | TIMESTAMP | DEFAULT NOW() | When the churn was confirmed |
| `logged_by` | INT | FK → users(id) | The user who recorded this churn |

**Business Rules:**
- `notes` is required — a churn cannot be logged without context.
- When a churn is logged, the related `client.status` should be updated to `Inactive`.
- Churn data feeds into retention analytics dashboards.

**Indexes:** `client_id`, `reason`, `churned_at`

---

## 6. Entity Relationship Summary

```
users ──────────────────────────────────────────────────┐
  │                                                       │
  │ created_by                                            │ assigned_to
  ▼                                                       │
clients ──────────────────────────────────────────────── contracts
  │                                                       │
  │ 1:N                                                   │ 1:N
  ├──── client_services ──── services (N:M join)         renewal_tasks
  │
  ├──── revenue_records ──── services (optional FK)
  │
  ├──── upsell_opportunities
  │
  └──── churn_reasons ─────── contracts (optional FK)


users ──────────────────────────────────────────────────┐
  │                                                       │
  ├──── sessions (1:N)                                    │
  ├──── password_reset_tokens (1:N)                       │
  ├──── notifications (1:N)                               │
  ├──── notification_preferences (1:1)                    │
  ├──── scheduled_reports (created_by)                    │
  └──── audit_logs (user_id) ─────────────────────────────┘
```

### Key Relationships at a Glance

| Relationship | Type | Description |
|---|---|---|
| users → clients | 1:N (via `created_by`) | A user creates multiple clients |
| users → contracts | 1:N (via `assigned_to`) | A user is assigned multiple contracts |
| clients → contracts | 1:N | A client has multiple contracts over time |
| contracts → contracts | 1:1 (via `previous_contract_id`) | Renewal chain links old to new contract |
| clients → services | N:M (via `client_services`) | Clients subscribe to many services |
| clients → revenue_records | 1:N | A client has many revenue history records |
| clients → upsell_opportunities | 1:N | A client has many potential upsells |
| clients → churn_reasons | 1:N | A client may have multiple churn events over time |
| users → notifications | 1:N | A user receives many notifications |
| users → notification_preferences | 1:1 | Each user has exactly one preference set |
| users → sessions | 1:N | A user may have sessions across devices |

---

## 7. State Machines

State machines define the **allowed states** and **valid transitions** for key entities. Attempting an invalid transition is rejected by the backend with an error.

### 7.1 Authentication State Machine

Controls the state of a user's login session.

```
[Unauthenticated] ──── Login Success ────► [Authenticated]
                                                │      │
[Unauthenticated] ◄─── Logout ─────────────────┘      │
                                                        │
[SessionExpired]  ◄─── Inactivity / JWT Expiry ─────────┘

[Unauthenticated] ──── 5th Failed Login ──► [Locked]
[Locked]          ──── 15 min passes ──────► [Unauthenticated]
```

| Trigger | From | To |
|---------|------|----|
| Correct credentials entered | `Unauthenticated` | `Authenticated` |
| Wrong credentials (< 5 attempts) | `Unauthenticated` | `Unauthenticated` (counter+1) |
| Wrong credentials (5th attempt) | `Unauthenticated` | `Locked` |
| 15 minutes pass after lockout | `Locked` | `Unauthenticated` |
| User logs out | `Authenticated` | `Unauthenticated` |
| 30 min inactivity / JWT expires | `Authenticated` | `SessionExpired` |

---

### 7.2 Password Reset State Machine

Controls the lifecycle of a password reset request.

```
[Idle] ──── User requests reset ──► [RequestSent]
                                           │
                                    Token generated
                                           │
                                           ▼
                                    [TokenValid] ──── 1 hour passes ──► [TokenExpired]
                                           │
                                    User submits new password
                                           │
                                           ▼
                                    [PasswordReset] ──► [Idle]
                                           │
                              (or already used)
                                           ▼
                                     [TokenUsed]
```

---

### 7.3 Contract Renewal State Machine

Controls the renewal pipeline for a contract. This is the primary workflow for account managers.

```
[Not Started]
      │
      │  Account manager contacts client
      ▼
[Client Contacted]
      │
      │  Renewal proposal prepared and sent
      ▼
[Proposal Sent]
      │
      │  Client responds with questions/changes
      ▼
[Negotiating]
      │
      │  Terms finalized, contract sent for signature
      ▼
[Awaiting Signature]
      │
      │  Signed contract received
      ▼
[Renewed]

From ANY stage (except Renewed):
      │
      │  Client confirms they will not renew
      ▼
[Lost]
```

| Transition | From | To |
|-----------|------|----|
| Contact Client | `Not Started` | `Client Contacted` |
| Send Proposal | `Client Contacted` | `Proposal Sent` |
| Enter Negotiation | `Proposal Sent` | `Negotiating` |
| Request Signature | `Negotiating` | `Awaiting Signature` |
| Complete Renewal | `Awaiting Signature` | `Renewed` |
| Mark Lost | Any (except `Renewed`) | `Lost` |

---

### 7.4 Auto-Renew State Machine

Controls the automatic contract renewal process.

```
[Disabled] ──── Toggle ON ──► [Processing] ──── Success ──► [Enabled]
[Enabled]  ──── Toggle OFF ──► [Disabled]
[Enabled]  ──── 30 days before expiry ──► [Processing] ──── Renewal created ──► [Renewed]
[Processing] ──── Failure ──► [Error] ──► [Disabled]
```

---

### 7.5 Report Scheduling State Machine

Controls the execution lifecycle of a scheduled report.

```
[Draft] ──── Saved with schedule ──► [Scheduled]
[Scheduled] ──── Trigger time reached ──► [Running]
[Running] ──── Generated + sent ──► [Completed] ──► [Scheduled] (next run)
[Running] ──── Error ──────────────► [Failed]    ──► [Scheduled] (retry)
[Scheduled] ──── User cancels ──────► [Draft]
```

---

## 8. Services Catalog (Seed Data)

The following services are pre-loaded into the `services` table when the database is set up.

| ID | Name | Category |
|----|------|----------|
| 1 | Social Media | Marketing |
| 2 | Performance Marketing | Marketing |
| 3 | SEO | Marketing |
| 4 | Design | Creative |
| 5 | Web Development | Technology |
| 6 | Analytics | Data |
| 7 | Content Marketing | Marketing |
| 8 | Paid Ads | Marketing |
| 9 | Maintenance | Technology |

New services can be added by an Admin user through the application settings.

---

## 9. Indexing Strategy

All indexes are created in the migrations to ensure queries run fast from the first deployment.

| Table | Indexed Columns | Reason |
|-------|----------------|--------|
| `users` | `email`, `status`, `role` | Login lookup, user filtering |
| `sessions` | `token`, `user_id`, `expires_at` | Auth middleware runs on every request |
| `password_reset_tokens` | `token`, `expires_at`, `user_id` | Token validation on reset |
| `clients` | `client_name`, `project_name`, `status`, `client_type`, `industry` | List filtering and search |
| `contracts` | `client_id`, `end_date`, `status`, `renewal_status`, `assigned_to` | Dashboard expiry alerts, pipeline views |
| `client_services` | `client_id`, `service_id` | Revenue aggregation by client |
| `revenue_records` | `client_id`, `record_date`, `service_id`, `record_type` | Time-series analytics |
| `upsell_opportunities` | `client_id`, `priority`, `status` | Pipeline dashboards |
| `renewal_tasks` | `assigned_to`, `due_date`, `status`, `client_id` | My Tasks view, overdue tasks |
| `notifications` | `user_id`, `read_at`, `type`, `created_at` | Unread count badge, notification list |
| `audit_logs` | `user_id`, `created_at`, `(entity_type, entity_id)`, `action` | Security queries and compliance reports |
| `scheduled_reports` | `next_run_at`, `active`, `report_type` | Scheduler polling |
| `churn_reasons` | `client_id`, `reason`, `churned_at` | Churn analytics |

---

## 10. Security Design Notes

### Password Security
- Passwords are hashed with **bcrypt, 12 rounds** before storage.
- Plaintext passwords are never logged or stored anywhere.
- Minimum requirements: 8 characters, 1 uppercase, 1 number, 1 special character (`!@#$%^&*`).

### Session Security
- JWTs are stored in **HTTP-only cookies** (inaccessible to JavaScript; prevents XSS theft).
- Sessions have a **rolling 30-minute inactivity timeout** — every API call resets the timer.
- Changing a password invalidates all existing sessions.

### Account Lockout
- **5 consecutive failed logins** → account locked for **15 minutes**.
- Counter resets on successful login.
- Lockout is per-account (tracked in `users.account_locked_until`), not per-IP.

### SQL Injection Prevention
- All database queries use **parameterized queries** (via `node-postgres`).
- No string concatenation is used to build SQL.

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| Signup | 5 attempts / hour / IP |
| Login | 5 attempts / 15 min / IP+email |
| Forgot Password | 3 requests / hour / email |

### Soft Deletes
- `users` and `clients` implement soft deletes via `deleted_at`.
- Soft-deleted records are excluded from all business logic queries but retained for audit trail.

### Audit Logging
- All significant actions (create, update, delete, login, logout) are written to `audit_logs`.
- Audit logs are append-only and cannot be modified through the application layer.

---

*End of Document*

**Garage Collective © 2026 — Confidential**
