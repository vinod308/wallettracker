--
-- PostgreSQL database dump
--

\restrict MFXJvBeJkjrwMlCfaxvb8lWjKCNkw8JxmhqAnkcuCBg8Dj7HxcVazc45w262DfK

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

-- Started on 2026-05-12 12:29:39

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 16727)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    old_values json,
    new_values json,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16726)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 239
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- TOC entry 244 (class 1259 OID 16768)
-- Name: churn_reasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.churn_reasons (
    id integer NOT NULL,
    client_id integer NOT NULL,
    contract_id integer,
    reason character varying(50),
    notes text NOT NULL,
    churned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    logged_by integer,
    CONSTRAINT churn_reasons_reason_check CHECK (((reason)::text = ANY ((ARRAY['Pricing'::character varying, 'Service Quality'::character varying, 'Switched to Competitor'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.churn_reasons OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16767)
-- Name: churn_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.churn_reasons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.churn_reasons_id_seq OWNER TO postgres;

--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 243
-- Name: churn_reasons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.churn_reasons_id_seq OWNED BY public.churn_reasons.id;


--
-- TOC entry 228 (class 1259 OID 16587)
-- Name: client_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_services (
    id integer NOT NULL,
    client_id integer NOT NULL,
    service_id integer NOT NULL,
    is_addon boolean DEFAULT false,
    monthly_amount numeric(12,2),
    yearly_amount numeric(12,2),
    billing_frequency character varying(10),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT client_services_billing_frequency_check CHECK (((billing_frequency)::text = ANY ((ARRAY['Monthly'::character varying, 'Yearly'::character varying])::text[])))
);


ALTER TABLE public.client_services OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16586)
-- Name: client_services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_services_id_seq OWNER TO postgres;

--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 227
-- Name: client_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_services_id_seq OWNED BY public.client_services.id;


--
-- TOC entry 222 (class 1259 OID 16525)
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    project_name character varying(100) NOT NULL,
    client_name character varying(100) NOT NULL,
    client_type character varying(20) NOT NULL,
    industry character varying(100),
    estimated_total_budget numeric(12,2),
    status character varying(20) DEFAULT 'Active'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT clients_client_type_check CHECK (((client_type)::text = ANY ((ARRAY['Retainer'::character varying, 'Contractor'::character varying])::text[]))),
    CONSTRAINT clients_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying, 'At Risk'::character varying])::text[])))
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16524)
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 221
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- TOC entry 224 (class 1259 OID 16545)
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id integer NOT NULL,
    client_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    mrr numeric(12,2) NOT NULL,
    auto_renew boolean DEFAULT false,
    renewal_status character varying(20) DEFAULT 'Not Started'::character varying,
    assigned_to integer,
    previous_contract_id integer,
    status character varying(20) DEFAULT 'Active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contracts_renewal_status_check CHECK (((renewal_status)::text = ANY ((ARRAY['Not Started'::character varying, 'Client Contacted'::character varying, 'Proposal Sent'::character varying, 'Negotiating'::character varying, 'Awaiting Signature'::character varying, 'Renewed'::character varying, 'Lost'::character varying])::text[]))),
    CONSTRAINT contracts_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Expired'::character varying, 'Renewed'::character varying])::text[])))
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16544)
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contracts_id_seq OWNER TO postgres;

--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 223
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contracts_id_seq OWNED BY public.contracts.id;


--
-- TOC entry 246 (class 1259 OID 16795)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    client_id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    invoice_date date NOT NULL,
    invoice_month character varying(20) NOT NULL,
    contract_start date,
    services_description text,
    addons_description text,
    service_mrr numeric(12,2) DEFAULT 0,
    addons_mrr numeric(12,2) DEFAULT 0,
    total_mrr numeric(12,2) DEFAULT 0,
    payment_status character varying(20) DEFAULT 'Unpaid'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoices_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Paid'::character varying, 'Unpaid'::character varying, 'Partial'::character varying, 'Overdue'::character varying])::text[])))
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE invoices; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.invoices IS 'Monthly client invoices with service/addon MRR breakdown';


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN invoices.invoice_month; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.invoices.invoice_month IS 'Month label (e.g. July 2025)';


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN invoices.service_mrr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.invoices.service_mrr IS 'Service MRR Amount from Excel';


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN invoices.addons_mrr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.invoices.addons_mrr IS 'Addons MRR Amount from Excel';


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 246
-- Name: COLUMN invoices.total_mrr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.invoices.total_mrr IS 'Total MRR (Service + Addons) from Excel';


--
-- TOC entry 245 (class 1259 OID 16794)
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 245
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- TOC entry 242 (class 1259 OID 16744)
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email_contract_expiring boolean DEFAULT true,
    email_at_risk_client boolean DEFAULT true,
    email_upsell_opportunity boolean DEFAULT true,
    email_frequency character varying(20) DEFAULT 'Real-time'::character varying,
    in_app_enabled boolean DEFAULT true,
    desktop_notifications boolean DEFAULT false,
    notification_sound boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notification_preferences_email_frequency_check CHECK (((email_frequency)::text = ANY ((ARRAY['Real-time'::character varying, 'Daily Digest'::character varying, 'Weekly Summary'::character varying])::text[])))
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16743)
-- Name: notification_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_preferences_id_seq OWNER TO postgres;

--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 241
-- Name: notification_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_preferences_id_seq OWNED BY public.notification_preferences.id;


--
-- TOC entry 236 (class 1259 OID 16690)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(30),
    title character varying(200) NOT NULL,
    description text,
    link_url character varying(500),
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['Contract Expiring'::character varying, 'At-Risk Client'::character varying, 'Upsell Alert'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16689)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 235
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 218 (class 1259 OID 16488)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16487)
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 217
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- TOC entry 250 (class 1259 OID 16864)
-- Name: purchase_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_invoices (
    id integer NOT NULL,
    vendor_id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    invoice_date date NOT NULL,
    due_date date,
    description text,
    sub_amount numeric(12,2) DEFAULT 0 NOT NULL,
    gst_rate numeric(5,2) DEFAULT 18 NOT NULL,
    gst_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchase_invoices_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Approved'::character varying, 'Paid'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.purchase_invoices OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 16863)
-- Name: purchase_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_invoices_id_seq OWNER TO postgres;

--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 249
-- Name: purchase_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_invoices_id_seq OWNED BY public.purchase_invoices.id;


--
-- TOC entry 234 (class 1259 OID 16654)
-- Name: renewal_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.renewal_tasks (
    id integer NOT NULL,
    client_id integer NOT NULL,
    contract_id integer NOT NULL,
    assigned_to integer NOT NULL,
    priority character varying(10),
    due_date date NOT NULL,
    proposed_terms text,
    notes text,
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT renewal_tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['High'::character varying, 'Medium'::character varying, 'Low'::character varying])::text[]))),
    CONSTRAINT renewal_tasks_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


ALTER TABLE public.renewal_tasks OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16653)
-- Name: renewal_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.renewal_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.renewal_tasks_id_seq OWNER TO postgres;

--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 233
-- Name: renewal_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.renewal_tasks_id_seq OWNED BY public.renewal_tasks.id;


--
-- TOC entry 230 (class 1259 OID 16611)
-- Name: revenue_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.revenue_records (
    id integer NOT NULL,
    client_id integer NOT NULL,
    service_id integer,
    amount numeric(12,2) NOT NULL,
    record_date date NOT NULL,
    record_type character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT revenue_records_record_type_check CHECK (((record_type)::text = ANY ((ARRAY['Recurring'::character varying, 'One-Time'::character varying])::text[])))
);


ALTER TABLE public.revenue_records OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16610)
-- Name: revenue_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.revenue_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.revenue_records_id_seq OWNER TO postgres;

--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 229
-- Name: revenue_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.revenue_records_id_seq OWNED BY public.revenue_records.id;


--
-- TOC entry 238 (class 1259 OID 16708)
-- Name: scheduled_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scheduled_reports (
    id integer NOT NULL,
    report_type character varying(50) NOT NULL,
    configuration json NOT NULL,
    frequency character varying(20),
    schedule_time time without time zone NOT NULL,
    schedule_day_of_week integer,
    schedule_day_of_month integer,
    recipients text[],
    format character varying(10),
    include_note text,
    next_run_at timestamp without time zone,
    created_by integer,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scheduled_reports_format_check CHECK (((format)::text = ANY ((ARRAY['PDF'::character varying, 'Excel'::character varying, 'Both'::character varying])::text[]))),
    CONSTRAINT scheduled_reports_frequency_check CHECK (((frequency)::text = ANY ((ARRAY['Daily'::character varying, 'Weekly'::character varying, 'Monthly'::character varying, 'Quarterly'::character varying])::text[])))
);


ALTER TABLE public.scheduled_reports OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16707)
-- Name: scheduled_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scheduled_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scheduled_reports_id_seq OWNER TO postgres;

--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 237
-- Name: scheduled_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scheduled_reports_id_seq OWNED BY public.scheduled_reports.id;


--
-- TOC entry 226 (class 1259 OID 16577)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16576)
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 225
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- TOC entry 220 (class 1259 OID 16505)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16504)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 219
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 232 (class 1259 OID 16632)
-- Name: upsell_opportunities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.upsell_opportunities (
    id integer NOT NULL,
    client_id integer NOT NULL,
    recommended_services text[],
    potential_gain numeric(12,2),
    probability integer,
    priority character varying(10),
    status character varying(20) DEFAULT 'Identified'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT upsell_opportunities_priority_check CHECK (((priority)::text = ANY ((ARRAY['High'::character varying, 'Medium'::character varying, 'Low'::character varying])::text[]))),
    CONSTRAINT upsell_opportunities_probability_check CHECK (((probability >= 0) AND (probability <= 100))),
    CONSTRAINT upsell_opportunities_status_check CHECK (((status)::text = ANY ((ARRAY['Identified'::character varying, 'In Progress'::character varying, 'Won'::character varying, 'Lost'::character varying])::text[])))
);


ALTER TABLE public.upsell_opportunities OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16631)
-- Name: upsell_opportunities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.upsell_opportunities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.upsell_opportunities_id_seq OWNER TO postgres;

--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 231
-- Name: upsell_opportunities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.upsell_opportunities_id_seq OWNED BY public.upsell_opportunities.id;


--
-- TOC entry 216 (class 1259 OID 16466)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'Account Manager'::character varying,
    phone_number character varying(20),
    department character varying(100),
    time_zone character varying(50) DEFAULT 'Asia/Kolkata'::character varying,
    profile_picture_url text,
    status character varying(20) DEFAULT 'Active'::character varying,
    email_verified boolean DEFAULT false,
    failed_login_attempts integer DEFAULT 0,
    account_locked_until timestamp without time zone,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Admin'::character varying, 'Account Manager'::character varying, 'Finance'::character varying, 'vendor_manager'::character varying, 'vendor'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16465)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 248 (class 1259 OID 16837)
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id integer NOT NULL,
    user_id integer,
    vendor_name character varying(200) NOT NULL,
    vendor_type character varying(50) DEFAULT 'Freelancer'::character varying NOT NULL,
    gst_number character varying(20),
    pan_number character varying(10),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    country character varying(100) DEFAULT 'India'::character varying,
    contact_person character varying(100),
    email character varying(255),
    mobile character varying(15),
    alt_mobile character varying(15),
    website character varying(500),
    account_holder character varying(100),
    bank_name character varying(200),
    account_number character varying(20),
    ifsc_code character varying(11),
    upi_id character varying(100),
    swift_code character varying(11),
    status character varying(20) DEFAULT 'Active'::character varying,
    onboarded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16836)
-- Name: vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vendors_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 247
-- Name: vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vendors_id_seq OWNED BY public.vendors.id;


--
-- TOC entry 4763 (class 2604 OID 16730)
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- TOC entry 4775 (class 2604 OID 16771)
-- Name: churn_reasons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_reasons ALTER COLUMN id SET DEFAULT nextval('public.churn_reasons_id_seq'::regclass);


--
-- TOC entry 4744 (class 2604 OID 16590)
-- Name: client_services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_services ALTER COLUMN id SET DEFAULT nextval('public.client_services_id_seq'::regclass);


--
-- TOC entry 4732 (class 2604 OID 16528)
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- TOC entry 4736 (class 2604 OID 16548)
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 16798)
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- TOC entry 4765 (class 2604 OID 16747)
-- Name: notification_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences ALTER COLUMN id SET DEFAULT nextval('public.notification_preferences_id_seq'::regclass);


--
-- TOC entry 4757 (class 2604 OID 16693)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4727 (class 2604 OID 16491)
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- TOC entry 4790 (class 2604 OID 16867)
-- Name: purchase_invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_invoices ALTER COLUMN id SET DEFAULT nextval('public.purchase_invoices_id_seq'::regclass);


--
-- TOC entry 4753 (class 2604 OID 16657)
-- Name: renewal_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.renewal_tasks ALTER COLUMN id SET DEFAULT nextval('public.renewal_tasks_id_seq'::regclass);


--
-- TOC entry 4747 (class 2604 OID 16614)
-- Name: revenue_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_records ALTER COLUMN id SET DEFAULT nextval('public.revenue_records_id_seq'::regclass);


--
-- TOC entry 4759 (class 2604 OID 16711)
-- Name: scheduled_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_reports ALTER COLUMN id SET DEFAULT nextval('public.scheduled_reports_id_seq'::regclass);


--
-- TOC entry 4742 (class 2604 OID 16580)
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- TOC entry 4729 (class 2604 OID 16508)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 4749 (class 2604 OID 16635)
-- Name: upsell_opportunities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upsell_opportunities ALTER COLUMN id SET DEFAULT nextval('public.upsell_opportunities_id_seq'::regclass);


--
-- TOC entry 4719 (class 2604 OID 16469)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4784 (class 2604 OID 16840)
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.vendors_id_seq'::regclass);


--
-- TOC entry 5102 (class 0 OID 16727)
-- Dependencies: 240
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- TOC entry 5106 (class 0 OID 16768)
-- Dependencies: 244
-- Data for Name: churn_reasons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.churn_reasons (id, client_id, contract_id, reason, notes, churned_at, logged_by) FROM stdin;
\.


--
-- TOC entry 5090 (class 0 OID 16587)
-- Dependencies: 228
-- Data for Name: client_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_services (id, client_id, service_id, is_addon, monthly_amount, yearly_amount, billing_frequency, created_at) FROM stdin;
29	11	1	f	150000.00	\N	Monthly	2026-02-16 12:32:11.133757
30	11	3	f	100000.00	\N	Monthly	2026-02-16 12:32:11.133757
31	11	2	f	100000.00	\N	Monthly	2026-02-16 12:32:11.133757
32	11	8	f	63000.00	\N	Monthly	2026-02-16 12:32:11.133757
33	12	1	f	100000.00	\N	Monthly	2026-02-16 12:32:11.133757
34	12	2	f	120000.00	\N	Monthly	2026-02-16 12:32:11.133757
35	12	3	f	75000.00	\N	Monthly	2026-02-16 12:32:11.133757
36	13	4	f	60470.00	\N	Monthly	2026-02-16 12:32:11.133757
37	14	7	f	90000.00	\N	Monthly	2026-02-16 12:32:11.133757
38	14	5	f	69469.00	\N	Monthly	2026-02-16 12:32:11.133757
39	15	1	f	65000.00	\N	Monthly	2026-02-16 12:32:11.133757
40	15	8	f	85000.00	\N	Monthly	2026-02-16 12:32:11.133757
41	15	6	f	38800.00	\N	Monthly	2026-02-16 12:32:11.133757
42	15	9	t	215468.00	\N	Monthly	2026-02-16 12:32:11.133757
43	16	1	f	120000.00	\N	Monthly	2026-02-16 12:32:11.133757
44	16	7	f	80000.00	\N	Monthly	2026-02-16 12:32:11.133757
45	16	3	f	50000.00	\N	Monthly	2026-02-16 12:32:11.133757
46	17	1	f	70000.00	\N	Monthly	2026-02-16 12:32:11.133757
47	17	7	f	48000.00	\N	Monthly	2026-02-16 12:32:11.133757
48	18	1	f	150000.00	\N	Monthly	2026-02-16 12:32:11.133757
49	18	2	f	120000.00	\N	Monthly	2026-02-16 12:32:11.133757
50	18	3	f	90000.00	\N	Monthly	2026-02-16 12:32:11.133757
51	18	7	f	93000.00	\N	Monthly	2026-02-16 12:32:11.133757
52	18	29	t	2493658.80	\N	Monthly	2026-02-16 12:32:11.133757
53	19	7	f	350000.00	\N	Monthly	2026-02-16 12:32:11.133757
54	19	5	f	300000.00	\N	Monthly	2026-02-16 12:32:11.133757
55	19	4	f	176000.00	\N	Monthly	2026-02-16 12:32:11.133757
56	20	1	f	120000.00	\N	Monthly	2026-02-16 12:32:11.133757
57	20	3	f	100000.00	\N	Monthly	2026-02-16 12:32:11.133757
58	20	8	f	110000.00	\N	Monthly	2026-02-16 12:32:11.133757
59	20	6	f	41700.00	\N	Monthly	2026-02-16 12:32:11.133757
60	20	2	t	235410.00	\N	Monthly	2026-02-16 12:32:11.133757
61	21	30	f	509444.00	\N	Monthly	2026-02-16 12:32:11.133757
\.


--
-- TOC entry 5084 (class 0 OID 16525)
-- Dependencies: 222
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, project_name, client_name, client_type, industry, estimated_total_budget, status, created_by, created_at, updated_at, deleted_at) FROM stdin;
11	Digital Marketing Services	DJT Fashion Pvt Ltd	Retainer	Fashion & Retail	5000000.00	Active	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
12	Digital Marketing Services	Shyam Metalics & Energy Ltd	Retainer	Manufacturing	7000000.00	Active	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
13	Ministry Design Campaign	Center for Catalyzing Change	Contractor	Non-Profit	800000.00	Inactive	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
14	E-Learning Content Development	TLG India Pvt Ltd	Retainer	Education	3500000.00	Inactive	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
15	Digital Marketing Retainership	Carrier Airconditioning & Refrigeration	Retainer	HVAC & Manufacturing	4500000.00	Active	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
16	Social Media & PR Integration	Kaizzen PR Services Pvt Ltd	Retainer	Public Relations	6000000.00	Inactive	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
17	Community Engagement Campaign	The Indus Entrepreneurs – Delhi	Contractor	Business Networking	2000000.00	Inactive	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
18	Digital Marketing & Lead Generation	Utkarsh Small Finance Bank	Retainer	Banking & Finance	30000000.00	Active	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
19	Content Strategy & Development	Enrich Data Services Pvt Ltd	Retainer	Data & Technology	15000000.00	Inactive	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
20	Digital Marketing Services	VIP Industries Ltd	Retainer	Consumer Goods	9000000.00	Active	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
21	Solar Installation Project	Shudanshu Rai	Contractor	Solar Energy	509444.00	Active	1	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757	\N
\.


--
-- TOC entry 5086 (class 0 OID 16545)
-- Dependencies: 224
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (id, client_id, start_date, end_date, mrr, auto_renew, renewal_status, assigned_to, previous_contract_id, status, created_at, updated_at) FROM stdin;
11	11	2025-01-01	2026-03-25	413000.00	f	Client Contacted	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
12	12	2025-02-01	2026-02-24	295000.00	f	Proposal Sent	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
13	13	2025-11-01	2026-04-30	60470.00	f	Not Started	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
14	14	2024-12-01	2026-06-09	159469.00	t	Not Started	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
15	15	2025-01-15	2026-03-05	188800.00	f	Negotiating	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
16	16	2024-10-01	2026-08-28	250000.00	t	Not Started	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
17	17	2025-01-10	2026-03-15	118000.00	f	Not Started	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
18	18	2024-07-01	2027-06-30	453000.00	t	Not Started	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
19	19	2024-06-01	2026-05-31	826000.00	t	Not Started	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
20	20	2024-09-01	2026-04-05	371700.00	f	Client Contacted	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
21	21	2025-07-01	2025-08-31	509444.00	f	Not Started	1	\N	Active	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
\.


--
-- TOC entry 5108 (class 0 OID 16795)
-- Dependencies: 246
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, client_id, invoice_number, invoice_date, invoice_month, contract_start, services_description, addons_description, service_mrr, addons_mrr, total_mrr, payment_status, created_at, updated_at) FROM stdin;
1	20	GPPL/2025-26/52	2025-07-01	July 2025	2025-07-01	Digital Marketing Services	Social Media Promotions July 2025 with agency fees 5%	371700.00	235410.00	607110.00	Paid	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
2	11	GPPL/2025-26/39	2025-07-01	July 2025	2025-07-01	Digital Marketing Services Retainer Month of June 2025	\N	413000.00	0.00	413000.00	Paid	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
3	15	GPPL/2025-26/1	2025-07-01	July 2025	2025-07-01	Digital Marketing Services Retainership Month Of July 2025	Digital Marketing Services Glow Sign Boards Installation || Weather cool Services	188800.00	215468.00	404268.00	Paid	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
4	12	GPPL/2025-26/59	2025-07-01	July 2025	2025-07-01	Digital Marketing Services Retainer Month of July 2025	\N	295000.00	0.00	295000.00	Paid	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
5	18	GPPL/2025-26/33	2025-07-01	July 2025	2025-07-01	\N	Digital Marketing Services: Personal Loan Lead Campaign, Gold Loan Lead Campaign, Recruitment Campaign in 10/13/14 cities, Lead Generation Digital Campaign	0.00	2493658.80	2493658.80	Paid	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
6	21	GPPL/2025-26/58	2025-07-01	July 2025	2025-07-01	Panel 550 WT MONO HALF CUT NON DCR Hybrid Solar Inverter 7.5 kW, Lithium Ion Battery 100 Ah, Cabling + Installation	\N	509444.00	0.00	509444.00	Paid	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
\.


--
-- TOC entry 5104 (class 0 OID 16744)
-- Dependencies: 242
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_preferences (id, user_id, email_contract_expiring, email_at_risk_client, email_upsell_opportunity, email_frequency, in_app_enabled, desktop_notifications, notification_sound, created_at, updated_at) FROM stdin;
1	1	t	t	t	Real-time	t	f	t	2026-02-09 17:34:56.178786	2026-02-09 17:34:56.178786
2	2	t	t	t	Real-time	t	f	t	2026-05-06 17:49:39.947679	2026-05-06 17:49:39.947679
\.


--
-- TOC entry 5098 (class 0 OID 16690)
-- Dependencies: 236
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, description, link_url, read_at, created_at) FROM stdin;
\.


--
-- TOC entry 5080 (class 0 OID 16488)
-- Dependencies: 218
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- TOC entry 5112 (class 0 OID 16864)
-- Dependencies: 250
-- Data for Name: purchase_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_invoices (id, vendor_id, invoice_number, invoice_date, due_date, description, sub_amount, gst_rate, gst_amount, total_amount, status, notes, created_at, updated_at) FROM stdin;
1	1	PI-42757678	2026-05-08	2026-06-08	video editing	10000.00	18.00	1800.00	11800.00	Pending	\N	2026-05-08 17:49:38.916004	2026-05-08 18:43:05.358377
2	1	PI-47155486	2026-05-08	2026-06-08	seo magangement	20000.00	5.00	1000.00	21000.00	Pending	\N	2026-05-08 19:02:56.988387	2026-05-08 19:02:56.988387
\.


--
-- TOC entry 5096 (class 0 OID 16654)
-- Dependencies: 234
-- Data for Name: renewal_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.renewal_tasks (id, client_id, contract_id, assigned_to, priority, due_date, proposed_terms, notes, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5092 (class 0 OID 16611)
-- Dependencies: 230
-- Data for Name: revenue_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.revenue_records (id, client_id, service_id, amount, record_date, record_type, created_at) FROM stdin;
393	11	1	150000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
394	11	1	150000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
395	11	1	150000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
396	11	1	150000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
397	11	2	100000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
398	11	2	100000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
399	11	2	100000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
400	11	2	100000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
401	11	3	100000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
402	11	3	100000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
403	11	3	100000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
404	11	3	100000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
405	11	8	63000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
406	11	8	63000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
407	11	8	63000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
408	11	8	63000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
409	12	1	100000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
410	12	1	100000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
411	12	1	100000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
412	12	1	100000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
413	12	2	120000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
414	12	2	120000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
415	12	2	120000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
416	12	2	120000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
417	12	3	75000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
418	12	3	75000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
419	12	3	75000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
420	12	3	75000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
421	13	4	60470.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
422	13	4	60470.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
423	13	4	60470.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
424	13	4	60470.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
425	14	5	69469.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
426	14	5	69469.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
427	14	5	69469.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
428	14	5	69469.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
429	14	7	90000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
430	14	7	90000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
431	14	7	90000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
432	14	7	90000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
433	15	1	65000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
434	15	1	65000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
435	15	1	65000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
436	15	1	65000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
437	15	6	38800.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
438	15	6	38800.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
439	15	6	38800.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
440	15	6	38800.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
441	15	8	85000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
442	15	8	85000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
443	15	8	85000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
444	15	8	85000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
445	15	9	215468.00	2025-04-01	One-Time	2026-02-16 12:32:11.133757
446	15	9	215468.00	2025-05-01	One-Time	2026-02-16 12:32:11.133757
447	15	9	215468.00	2025-06-01	One-Time	2026-02-16 12:32:11.133757
448	15	9	215468.00	2025-07-01	One-Time	2026-02-16 12:32:11.133757
449	16	1	120000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
450	16	1	120000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
451	16	1	120000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
452	16	1	120000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
453	16	3	50000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
454	16	3	50000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
455	16	3	50000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
456	16	3	50000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
457	16	7	80000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
458	16	7	80000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
459	16	7	80000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
460	16	7	80000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
461	17	1	70000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
462	17	1	70000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
463	17	1	70000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
464	17	1	70000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
465	17	7	48000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
466	17	7	48000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
467	17	7	48000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
468	17	7	48000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
469	18	1	150000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
470	18	1	150000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
471	18	1	150000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
472	18	1	150000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
473	18	2	120000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
474	18	2	120000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
475	18	2	120000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
476	18	2	120000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
477	18	3	90000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
478	18	3	90000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
479	18	3	90000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
480	18	3	90000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
481	18	7	93000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
482	18	7	93000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
483	18	7	93000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
484	18	7	93000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
485	18	29	2493658.80	2025-04-01	One-Time	2026-02-16 12:32:11.133757
486	18	29	2493658.80	2025-05-01	One-Time	2026-02-16 12:32:11.133757
487	18	29	2493658.80	2025-06-01	One-Time	2026-02-16 12:32:11.133757
488	18	29	2493658.80	2025-07-01	One-Time	2026-02-16 12:32:11.133757
489	19	4	176000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
490	19	4	176000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
491	19	4	176000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
492	19	4	176000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
493	19	5	300000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
494	19	5	300000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
495	19	5	300000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
496	19	5	300000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
497	19	7	350000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
498	19	7	350000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
499	19	7	350000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
500	19	7	350000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
501	20	1	120000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
502	20	1	120000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
503	20	1	120000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
504	20	1	120000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
505	20	2	235410.00	2025-04-01	One-Time	2026-02-16 12:32:11.133757
506	20	2	235410.00	2025-05-01	One-Time	2026-02-16 12:32:11.133757
507	20	2	235410.00	2025-06-01	One-Time	2026-02-16 12:32:11.133757
508	20	2	235410.00	2025-07-01	One-Time	2026-02-16 12:32:11.133757
509	20	3	100000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
510	20	3	100000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
511	20	3	100000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
512	20	3	100000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
513	20	6	41700.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
514	20	6	41700.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
515	20	6	41700.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
516	20	6	41700.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
517	20	8	110000.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
518	20	8	110000.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
519	20	8	110000.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
520	20	8	110000.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
521	21	30	509444.00	2025-04-01	Recurring	2026-02-16 12:32:11.133757
522	21	30	509444.00	2025-05-01	Recurring	2026-02-16 12:32:11.133757
523	21	30	509444.00	2025-06-01	Recurring	2026-02-16 12:32:11.133757
524	21	30	509444.00	2025-07-01	Recurring	2026-02-16 12:32:11.133757
\.


--
-- TOC entry 5100 (class 0 OID 16708)
-- Dependencies: 238
-- Data for Name: scheduled_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scheduled_reports (id, report_type, configuration, frequency, schedule_time, schedule_day_of_week, schedule_day_of_month, recipients, format, include_note, next_run_at, created_by, active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5088 (class 0 OID 16577)
-- Dependencies: 226
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, category, created_at) FROM stdin;
1	Social Media	Marketing	2026-02-09 16:32:56.717415
2	Performance Marketing	Marketing	2026-02-09 16:32:56.717415
3	SEO	Marketing	2026-02-09 16:32:56.717415
4	Design	Creative	2026-02-09 16:32:56.717415
5	Web Development	Technology	2026-02-09 16:32:56.717415
6	Analytics	Data	2026-02-09 16:32:56.717415
7	Content Marketing	Marketing	2026-02-09 16:32:56.717415
8	Paid Ads	Marketing	2026-02-09 16:32:56.717415
9	Maintenance	Technology	2026-02-09 16:32:56.717415
28	Digital Marketing	Marketing	2026-02-16 12:32:11.133757
29	Lead Generation	Marketing	2026-02-16 12:32:11.133757
30	Solar Installation	Technology	2026-02-16 12:32:11.133757
\.


--
-- TOC entry 5082 (class 0 OID 16505)
-- Dependencies: 220
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token, expires_at, last_activity, ip_address, user_agent, created_at) FROM stdin;
10	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjQ0NjA2LCJleHAiOjE3NzA2NDY0MDZ9.R0LnqltOrZdsHoIkXxRvMrhxA0L2JNac5hyC7TpjsEk	2026-02-09 19:43:26.986	2026-02-09 19:13:26.98701	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 19:13:26.98701
15	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzA2MjQ3LCJleHAiOjE3NzA3MDgwNDd9.X_zLOlNvKiOfPz4pJm0usXdlLouudxlLDLmbJYJsm8o	2026-02-10 12:50:47.868	2026-02-10 12:20:47.873539	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 12:20:47.873539
18	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzA4MzcyLCJleHAiOjE3NzA3MTAxNzJ9.ZjXhoGlpQ2Ic706jdzO1VCgJ3pmSN-BrDRvVLHDIze8	2026-02-10 13:26:12.883	2026-02-10 12:56:12.884659	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 12:56:12.884659
12	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzA1MjUxLCJleHAiOjE3NzA3MDcwNTF9.QsN45bwecAuQCxEktP0W1X059fCq2Rzty5w96RCwRJ8	2026-02-10 12:34:11.872	2026-02-10 12:04:11.880026	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 12:04:11.880026
6	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjQyMDMwLCJleHAiOjE3NzA2NDM4MzB9._2iu2oKsspBnLthC7TDTJY7XBbGbbWOvajpZc1J6CGY	2026-02-09 19:00:30.726	2026-02-09 18:30:30.727554	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 18:30:30.727554
23	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwOTc0NDIxLCJleHAiOjE3NzA5NzYyMjF9.DqBJRs_N4O-VeVRhtKl9fww0axGUCwm4MrWxHBh7lNo	2026-02-13 15:20:21.184	2026-02-13 14:50:21.185275	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-13 14:50:21.185275
24	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwOTg2NDY0LCJleHAiOjE3NzA5ODgyNjR9.VyXy2wceAtQEa9t6VPPI22Ci4c854crS_4GqO-e9Nq0	2026-02-13 18:41:04.017	2026-02-13 18:11:04.025154	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-13 18:11:04.025154
16	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzA2ODI5LCJleHAiOjE3NzA3MDg2Mjl9.WDNwjtZA9Z6sNZXP4sfME4Li68vZLJs5Hc7--lojICY	2026-02-10 13:00:29.896	2026-02-10 12:30:29.897625	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 12:30:29.897625
3	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjM5NDYxLCJleHAiOjE3NzA2NDEyNjF9.IPwyLqVurTqKTVn3t34gfkhzb83aeZSf7j4o1I3SrNs	2026-05-11 19:32:59.489	2026-05-11 19:02:59.490586	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 17:47:41.203521
19	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzE1NjA2LCJleHAiOjE3NzA3MTc0MDZ9.4Xh4r23nzrNc0M2-oks2hYeXZjB56W2Pw1sICUkHBsI	2026-02-10 15:26:46.756	2026-02-10 14:56:46.757346	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 14:56:46.757346
13	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzA1MzE0LCJleHAiOjE3NzA3MDcxMTR9.jgqspsZrfCPOa2u75CWkXvu7AteJ29z7PGojiedRQhw	2026-02-10 12:35:14.027	2026-02-10 12:05:14.028491	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 12:05:14.028491
5	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjQxNjkxLCJleHAiOjE3NzA2NDM0OTF9.SGecAwWZtNsHntNVLD4wHCY-Uk9OoKoGywCl8uc_c0w	2026-02-09 18:54:51.567	2026-02-09 18:24:51.570635	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 18:24:51.570635
21	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzg5MzE4LCJleHAiOjE3NzA3OTExMTh9.a7ApO6uz3hox-CYoXEXitvWRGeWwW85tOL9MMiV2Zic	2026-02-11 11:55:18.863	2026-02-11 11:25:18.865529	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 11:25:18.865529
2	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjM4Nzc1LCJleHAiOjE3NzA2NDA1NzV9.8KqB_qOPrexcIV6e-OsmvFGD7NrzoHFBXs1M3mMFrmo	2026-05-11 19:32:43.351	2026-05-11 19:02:43.352556	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 17:36:15.484673
7	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjQyMDU4LCJleHAiOjE3NzA2NDM4NTh9.GL5CuiyEutWx9SLB5KRomjG8N4NQycklUvc-r-IF6LQ	2026-02-09 19:00:58.949	2026-02-09 18:30:58.951032	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 18:30:58.951032
22	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwOTcwNTMyLCJleHAiOjE3NzA5NzIzMzJ9.IQwG4vpRQ7xOXFb-5SeCpJRi_Bk2bF0Kw9DvDK4anF0	2026-02-13 14:15:32.208	2026-02-13 13:45:32.20924	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-13 13:45:32.20924
8	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjQyMjY1LCJleHAiOjE3NzA2NDQwNjV9.i_uz4wRsdYRo-laN0CA_2VEY-r7Bh5cNAJbVrG6BnW0	2026-02-09 19:04:25.519	2026-02-09 18:34:25.520701	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 18:34:25.520701
11	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNzA0NDExLCJleHAiOjE3NzA3MDYyMTF9.HlmOC7ca9E1qDtW4YjFhzskWvOIUNPcixS-3wDrgLVo	2026-02-10 12:20:11.302	2026-02-10 11:50:11.30316	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 11:50:11.30316
4	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjQwNzA1LCJleHAiOjE3NzA2NDI1MDV9.QRH6-uGYWJXo_HPmTvmBiwtiYlj8JKupAiLeTvKRuJ4	2026-02-09 18:38:25.585	2026-02-09 18:08:25.586522	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 18:08:25.586522
1	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcwNjM4Njk2LCJleHAiOjE3NzA2NDA0OTZ9.axYLwOi1TFwgiit9GYPc2nSjBwTKkbKDAsG9aOHvoS0	2026-05-11 19:31:50.054	2026-05-11 19:01:50.055254	\N	\N	2026-02-09 17:34:56.200412
33	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMzk4NzExLCJleHAiOjE3NzE0MDA1MTF9.1j28ZmI3B-ow5PcuWPRF3MyLAO2muFfQ4i-q62sBml4	2026-02-18 13:11:51.345	2026-02-18 12:41:51.352738	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-18 12:41:51.352738
38	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTIxMjc3LCJleHAiOjE3NzE1MjMwNzd9.U2uKBRdCZJIfIXgoq0PEz38qFs-4Rtys0a4K5bp93dI	2026-02-19 23:14:37.493	2026-02-19 22:44:37.497692	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 22:44:37.497692
34	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNDAyNzQyLCJleHAiOjE3NzE0MDQ1NDJ9.vdevw254TMvWpE8_Cm7GUSS1aSxiONtt2QIhXOKMwXI	2026-02-18 14:19:02.027	2026-02-18 13:49:02.035247	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-18 13:49:02.035247
35	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNDA2NTI5LCJleHAiOjE3NzE0MDgzMjl9.qsfjCSauRL-CcMNuNUecZbWmv1sv3FOnXuZE4Ss_jfw	2026-02-18 15:22:09.295	2026-02-18 14:52:09.29697	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-18 14:52:09.29697
36	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNDEyMjA2LCJleHAiOjE3NzE0MTQwMDZ9.lhVXLiPlhoUiv1M4-VDgYrfuRVL1iMUDtQhZLKsaFOA	2026-02-18 16:56:46.392	2026-02-18 16:26:46.393324	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-18 16:26:46.393324
27	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMzA0MDI0LCJleHAiOjE3NzEzMDU4MjR9.-VrSXvOmz-PLnRSR8EkvJixOtrH96UG3BlKrQHIBE3w	2026-02-17 10:53:44.79	2026-02-17 10:23:44.793231	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-17 10:23:44.793231
30	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMzIwNjIzLCJleHAiOjE3NzEzMjI0MjN9.Ywskrt4PBEazMM0CS5jylnOiIW10gIUK8SIASylRiyk	2026-02-17 15:30:23.659	2026-02-17 15:00:23.660999	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-17 15:00:23.660999
31	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMzI2Nzg3LCJleHAiOjE3NzEzMjg1ODd9.6QQh8XIZJ0cvX4xhCUo7AZRWb64COmDslVkp2gjHHpU	2026-02-17 17:13:07.269	2026-02-17 16:43:07.271289	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-17 16:43:07.271289
37	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNDgyNDY4LCJleHAiOjE3NzE0ODQyNjh9.lFDLMQZUScOwL-yJ1StFURS_cRG7XwTZHN81vMUEuo0	2026-02-19 12:27:48.724	2026-02-19 11:57:48.728511	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 11:57:48.728511
26	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMjQ5NjMxLCJleHAiOjE3NzEyNTE0MzF9._4vWuW1MQwnH1eOQbvqdiRuAbzf3Rr4UHht98KpfHBQ	2026-02-16 19:47:11.772	2026-02-16 19:17:11.773714	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 19:17:11.773714
39	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTIzNDMwLCJleHAiOjE3NzE1MjUyMzB9.Af0KsSxmR09lxDiLRKLxm8B5TpBekSTI9rTDbkBvXKE	2026-02-19 23:50:30.323	2026-02-19 23:20:30.324502	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-19 23:20:30.324502
40	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTYzNzQzLCJleHAiOjE3NzE1NjU1NDN9.2eMouSShu0ZVg-coZK-e_Zii4ONVIBRRhayFbLlPNCw	2026-02-20 11:02:23.583	2026-02-20 10:32:23.585204	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 10:32:23.585204
41	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTY2MTU0LCJleHAiOjE3NzE1Njc5NTR9.HeFhVOztaZHrAktbdytKkeBhrYBc7zKP9ALrtAHH4AM	2026-02-20 11:42:34.481	2026-02-20 11:12:34.48221	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 11:12:34.48221
42	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTcwMDA5LCJleHAiOjE3NzE1NzE4MDl9.R7US7w4xFVV7gOyopOsqq65QofAQow-FN-O975RWdic	2026-02-20 12:46:49.851	2026-02-20 12:16:49.851992	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 12:16:49.851992
32	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMzI4NzI4LCJleHAiOjE3NzEzMzA1Mjh9.TFzIq6cfHEEZ_Blw82zneAzPYnb1EJmFCOmwNKS7nzk	2026-02-17 17:45:28.56	2026-02-17 17:15:28.561955	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-17 17:15:28.561955
29	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMzA2NTgwLCJleHAiOjE3NzEzMDgzODB9.w19YvIKz_OLibrvxCGU2MIMiAt0UrBtiJMLHRiP5A1A	2026-02-17 11:36:20.182	2026-02-17 11:06:20.183721	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-17 11:06:20.183721
25	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMjI1OTk2LCJleHAiOjE3NzEyMjc3OTZ9.i8ZCSiqcexn5opeAYXu3rtZH-q7ePGBQoayxqsI1sPE	2026-02-16 13:13:16.701	2026-02-16 12:43:16.702752	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 12:43:16.702752
28	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxMzA1MDEyLCJleHAiOjE3NzEzMDY4MTJ9.Lr8cYemV_3ZJkTuQ8bCejUwZwOSEXv0CuHYhTCyV60w	2026-02-17 11:10:12.995	2026-02-17 10:40:12.996374	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-17 10:40:12.996374
43	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTc1MTM3LCJleHAiOjE3NzE1NzY5Mzd9.0HnR12d55PREc6MAXL_cwyYBTzcDCiA01C7g80icahk	2026-02-20 14:12:17.936	2026-02-20 13:42:17.9424	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 13:42:17.9424
44	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTc1MTc0LCJleHAiOjE3NzE1NzY5NzR9.QORjBPOVhF-ggAVzRnD36A33ciumuB--IdNvEu3RXe4	2026-02-20 14:12:54.052	2026-02-20 13:42:54.05767	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 13:42:54.05767
45	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTc1MjEwLCJleHAiOjE3NzE1NzcwMTB9.Tw9AXzGL3nlQAAtkND0J_7oV0qKeLREd0UGqYEgv26A	2026-02-20 14:13:30.306	2026-02-20 13:43:30.307742	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 13:43:30.307742
46	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcxNTc4NjA0LCJleHAiOjE3NzE1ODA0MDR9.VFgaiVhVhQ-RXecgaYznikgh89Y5WkIY8o6hguklhSA	2026-02-20 15:10:04.412	2026-02-20 14:40:04.412659	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20 14:40:04.412659
47	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNjg5NDc3LCJleHAiOjE3NzI2OTEyNzd9.Xxpush4EC04ksM9dAz4zWkTi4XCHCWg8PDsFWUe6Qrs	2026-03-05 11:44:37.921	2026-03-05 11:14:37.922667	::ffff:127.0.0.1	curl/7.86.0	2026-03-05 11:14:37.922667
48	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNjg5NTI0LCJleHAiOjE3NzI2OTEzMjR9.Q0AulN-1jM5cCi6ob32IeqY8ZAkFBqfe5VUKdma7_PQ	2026-03-05 11:45:24.817	2026-03-05 11:15:24.819528	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-05 11:15:24.819528
50	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNjk0ODczLCJleHAiOjE3NzI2OTY2NzN9.ENwdv6_vcHJJvP_mBagUW1CAMwYAe-nrGVl7G-h83dA	2026-03-05 13:14:33.399	2026-03-05 12:44:33.399845	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-05 12:44:33.399845
51	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNjk1MDY3LCJleHAiOjE3NzI2OTY4Njd9.f7zJb9YkzWYKYIICxnC_BnxGfpZeCsEK3e0nDdEML7k	2026-03-05 13:17:47.526	2026-03-05 12:47:47.527397	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-05 12:47:47.527397
52	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNjk1MjU4LCJleHAiOjE3NzI2OTcwNTh9.jPKROfYdsEXvXzYB5dzSTcNxWPFqbd6tXKN6Aj5qCY0	2026-03-05 13:20:58.603	2026-03-05 12:50:58.604105	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-05 12:50:58.604105
53	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNjk3NzQ1LCJleHAiOjE3NzI2OTk1NDV9.6hFV5zHGJxxnZjPysHrdifzcH3C5qECC0_5aJt4PaYQ	2026-03-05 14:02:25.408	2026-03-05 13:32:25.409627	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-05 13:32:25.409627
54	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNzEwMDI3LCJleHAiOjE3NzI3MTE4Mjd9.JlHOeZeP0jCwxVTVEpH5AG1qUY-wFGcUmofnXN5arWw	2026-03-05 17:27:07.851	2026-03-05 16:57:07.862315	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-05 16:57:07.862315
55	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNzczNjU1LCJleHAiOjE3NzI3NzU0NTV9.kdZzvfvBQVTaBzZYYvIPUZ3K_-_qB_rgVucE5yBMQQ0	2026-03-06 11:07:35.947	2026-03-06 10:37:35.950302	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-06 10:37:35.950302
56	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyNzg1MjU1LCJleHAiOjE3NzI3ODcwNTV9.liJWS9gw7nPCdzFUDDkYmthd-qlDV-jIkh-cJUWrHaw	2026-03-06 14:20:55.184	2026-03-06 13:50:55.188364	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-06 13:50:55.188364
57	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyODU5ODI3LCJleHAiOjE3NzI4NjE2Mjd9.ScXZmZ8q_zFX3qWwT-P8twvQEjbBWCJHIgvFYw9oZVE	2026-03-07 11:03:47.529	2026-03-07 10:33:47.532123	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-07 10:33:47.532123
58	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyODYzMDMwLCJleHAiOjE3NzI4NjQ4MzB9.RqmqqmA6V0jJhfFa35zv0Ozfgw-LXhOMHgfVrcO290o	2026-03-07 11:57:10.877	2026-03-07 11:27:10.890239	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-07 11:27:10.890239
59	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzcyODY0OTIxLCJleHAiOjE3NzI4NjY3MjF9.tikmfKsNupvLV34sAyF61Daq7R0vROLPj30ttuUQpOY	2026-03-07 12:28:41.859	2026-03-07 11:58:41.862502	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-07 11:58:41.862502
60	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzczMDM5NzEwLCJleHAiOjE3NzMwNDE1MTB9.w-X2Hf7UPH9TCTvJb1MxPVVB8Gd_xr9aaY-EbrwNDJE	2026-03-09 13:01:50.255	2026-03-09 12:31:50.258778	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-09 12:31:50.258778
61	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzczMDM5ODcyLCJleHAiOjE3NzMwNDE2NzJ9.xO0TBhyQiRqlia7q9bq9Bvfusv7AyfJAP_QW3UeFE4I	2026-03-09 13:04:32.657	2026-03-09 12:34:32.660411	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-09 12:34:32.660411
62	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc2MDcxNTU5LCJleHAiOjE3NzYwNzMzNTl9.E1MNxmiTc6tgwox3nuw0WN2x7YFOiURupuj9VXzayEw	2026-04-13 15:12:39.553	2026-04-13 14:42:39.5552	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-13 14:42:39.5552
63	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc2MDcxNTk4LCJleHAiOjE3NzYwNzMzOTh9.NRd0w7EdAjtaaG3UYUWAd3MyEkYWRM8plJgxLP-fpWo	2026-04-13 15:13:18.031	2026-04-13 14:43:18.032761	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-13 14:43:18.032761
64	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc2MTUwNTg0LCJleHAiOjE3NzYxNTIzODR9.-xx4ogn2kJ90Dg0Nk8NFW1eOrS4OVpxJ6WqUJiRckeA	2026-04-14 13:09:44.35	2026-04-14 12:39:44.351115	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-14 12:39:44.351115
65	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc2MTUwNzg0LCJleHAiOjE3NzYxNTI1ODR9.w8gY94bRP6FMZxm2P2DOgM4HjPsFplaFGbe-v2ocLPU	2026-04-14 13:13:04.831	2026-04-14 12:43:04.832109	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	2026-04-14 12:43:04.832109
66	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc2MTU4NzA1LCJleHAiOjE3NzYxNjA1MDV9.0qsHFNuNAb0OfGCfwwg437oRgF4oDU2RPUJvHGOweMU	2026-04-14 15:25:05.642	2026-04-14 14:55:05.649619	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-04-14 14:55:05.649619
67	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3NzA2MzMwLCJleHAiOjE3Nzc3MDgxMzB9.0_odLiGuH0VPl0ELm2LaPjrfsWN7J_itmAc_GsVIfe4	2026-05-02 13:18:50.902	2026-05-02 12:48:50.906273	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-02 12:48:50.906273
68	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3NzA4NjU4LCJleHAiOjE3Nzc3MTA0NTh9.Zn36szTDv90b9JW0V31Bd11Cd2CH7bZ8U638EjIdpfs	2026-05-02 13:57:38.107	2026-05-02 13:27:38.109042	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-02 13:27:38.109042
69	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3NzE5OTkyLCJleHAiOjE3Nzc3MjE3OTJ9.PE34-8-vk32LZ2xyqbg6ExSTh9iPFcMZPo2PfNCdzQ4	2026-05-02 17:06:32.928	2026-05-02 16:36:32.930173	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-02 16:36:32.930173
70	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3NzI0ODk5LCJleHAiOjE3Nzc3MjY2OTl9.bhugnpeQqC7qVstQj6ffu8D8dNBve-5yaWzIv_gTFok	2026-05-02 18:28:19.03	2026-05-02 17:58:19.032173	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-02 17:58:19.032173
71	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3NzI5MTQ0LCJleHAiOjE3Nzc3MzA5NDR9._m3SB4j2tFlLECfSfKjORxCXNt7aXBofeyE5QYCGjmg	2026-05-02 19:39:04.304	2026-05-02 19:09:04.305226	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-02 19:09:04.305226
72	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODI3NzQ2LCJleHAiOjE3Nzc4Mjk1NDZ9.M-8hggneExlPk8dJYVKy1NT_3ejhsnl3094WYd8GkDE	2026-05-03 23:02:26.272	2026-05-03 22:32:26.273874	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-03 22:32:26.273874
73	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODI5NTg4LCJleHAiOjE3Nzc4MzEzODh9.WpaZAFQqpqqoMuMqpV0q5Zn8ihtLJbFTGxV_olWimqQ	2026-05-03 23:33:08.28	2026-05-03 23:03:08.280544	::1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-03 23:03:08.280544
74	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODMwODYwLCJleHAiOjE3Nzc4MzI2NjB9.HoEDgRQjRNcMbPbVp3A7q6qPRpyMWCmAweHMrUEubKo	2026-05-03 23:54:20.714	2026-05-03 23:24:20.715095	::1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-05-03 23:24:20.715095
75	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODYxMjY1LCJleHAiOjE3Nzc4NjMwNjV9.IX-RQfa8a4460hySJbYLcZG_8bDlyL1NLt2Xird9sR4	2026-05-04 08:21:05.158	2026-05-04 07:51:05.166502	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-04 07:51:05.166502
76	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODYxOTQxLCJleHAiOjE3Nzc4NjM3NDF9.pmq8kA1kJ73e2M9i-mbVo2yAQl8Z_fMU-velv-MwpRQ	2026-05-04 08:32:21.107	2026-05-04 08:02:21.107949	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-04 08:02:21.107949
77	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODY4OTQ1LCJleHAiOjE3Nzc4NzA3NDV9.xwSuqSXKMTpRf6ydmvZ76wsXdz8Lm8b-WeKu2WnRAKk	2026-05-04 10:29:05.939	2026-05-04 09:59:05.951633	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-04 09:59:05.951633
78	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODY5MzUzLCJleHAiOjE3Nzc4NzExNTN9.2AGpHUD1uEGqHje9F5KlnP3gKO6sEdsoP7YfRtau9TE	2026-05-04 10:35:53.073	2026-05-04 10:05:53.073983	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-04 10:05:53.073983
79	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3ODcyNjAxLCJleHAiOjE3Nzc4NzQ0MDF9.92TDoHMT0N3hPqBpuPLlDjwh3qMNHv5HfL-VtYVOeVs	2026-05-04 11:30:01.379	2026-05-04 11:00:01.380307	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-04 11:00:01.380307
80	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTc0MDA3LCJleHAiOjE3Nzc5NzU4MDd9.iEaCaqqVUa1cZXV-69Yg56FQWC6yTSW69h8uljcDMZo	2026-05-05 15:40:07.541	2026-05-05 15:10:07.545401	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 15:10:07.545401
81	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTc0MjkxLCJleHAiOjE3Nzc5NzYwOTF9.Bz_76phenzHxkTAkTBEj5gkS3Lx-YjnBGC3MgW54Dr0	2026-05-05 15:44:51.028	2026-05-05 15:14:51.029429	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 15:14:51.029429
82	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTc0ODk0LCJleHAiOjE3Nzc5NzY2OTR9.G8-tCaP20WrYAg2czNKsRyuInhjA9uIEt6mtttH9G_w	2026-05-05 15:54:54.176	2026-05-05 15:24:54.17718	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 15:24:54.17718
83	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTc1NzIwLCJleHAiOjE3Nzc5Nzc1MjB9.jA5GvU2i9gl0Qe4lndRWYQ5jn3-pg2l2r1Pz7vfjtBQ	2026-05-05 16:08:40.709	2026-05-05 15:38:40.710566	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 15:38:40.710566
84	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTc2MzcwLCJleHAiOjE3Nzc5NzgxNzB9.1OjAVjy2a2GjyBt_kyrY3XM69YLNgvicTFHOT20qf9k	2026-05-05 16:19:30.008	2026-05-05 15:49:30.009541	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 15:49:30.009541
85	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTc5MjE5LCJleHAiOjE3Nzc5ODEwMTl9.2ZL31qZGdTRwU3uV8OyzQIo_hXcV091a4KmgoCJ4ahc	2026-05-05 17:06:59.372	2026-05-05 16:36:59.373589	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 16:36:59.373589
86	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTg1MTQ0LCJleHAiOjE3Nzc5ODY5NDR9.4xWLrLHwtb8A3xtTngvTqGkNHVgOxl5vLxw8nfHDVZg	2026-05-05 18:45:44.848	2026-05-05 18:15:44.849173	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 18:15:44.849173
87	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTg1NDMwLCJleHAiOjE3Nzc5ODcyMzB9.hJmPxKG4eVnsnSBTW8vU4QJQG4Iqf6FS_tNyPEQPBmc	2026-05-05 18:50:30.281	2026-05-05 18:20:30.281752	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 18:20:30.281752
88	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTg2MDA0LCJleHAiOjE3Nzc5ODc4MDR9.CF-myaGRUxuLA6wG0eUtBlIQ9LQuNPKFwQpgP2uiu-g	2026-05-05 19:00:04.338	2026-05-05 18:30:04.339828	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 18:30:04.339828
89	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc3OTg3Mzc1LCJleHAiOjE3Nzc5ODkxNzV9.R373yGubqqeXf5Bs2t5e0_h_YeFu0MS6yNpsJf7mBfg	2026-05-05 19:22:55.867	2026-05-05 18:52:55.868782	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-05 18:52:55.868782
90	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDQ5MzgyLCJleHAiOjE3NzgwNTExODJ9.T2yXlfCSOnIGFIzSiYNdjduDOHod1YvvwaRwL-uoIsk	2026-05-06 12:36:22.462	2026-05-06 12:06:22.464053	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 12:06:22.464053
91	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDUwOTgzLCJleHAiOjE3NzgwNTI3ODN9.09GUHNdpFSfNRzDppHV6MEBuoP3kbmYfSZ5ojbCCR5g	2026-05-06 13:03:03.908	2026-05-06 12:33:03.910267	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 12:33:03.910267
92	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDUxODUwLCJleHAiOjE3NzgwNTM2NTB9.V-I7AJkOB27EWCwut29J0Xp13Hq0V_xwtXtEsjtvCwk	2026-05-06 13:17:30.085	2026-05-06 12:47:30.087678	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 12:47:30.087678
93	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDUzNDkyLCJleHAiOjE3NzgwNTUyOTJ9.e9RhAk8ccUrx6Znu7J1AKSY3e-GwnAMWNkAKtCBDbI0	2026-05-06 13:44:52.248	2026-05-06 13:14:52.255879	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 13:14:52.255879
94	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDUzNTExLCJleHAiOjE3NzgwNTUzMTF9.aW1PnO2zpeApI7iR6Dv_Fu6ITm0-1fCFuQK8cyZf7uE	2026-05-06 13:45:11.107	2026-05-06 13:15:11.1083	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 13:15:11.1083
95	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDU0NTI0LCJleHAiOjE3NzgwNTYzMjR9.tG69qhnD_zwMBx0PlY_viyla7rXWrjWPyUMBn8VsPDA	2026-05-06 14:02:04.415	2026-05-06 13:32:04.417563	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 13:32:04.417563
96	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDU0ODg5LCJleHAiOjE3NzgwNTY2ODl9.hrQDyxsORPtXep-1nz_8I3-0v3DGXDJwL87yM79b4Zk	2026-05-06 14:08:09.618	2026-05-06 13:38:09.619905	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 13:38:09.619905
97	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDU1MjMwLCJleHAiOjE3NzgwNTcwMzB9.RPwUJI8hZ3iKTdazjj7Hjb5kKsH88g81fHzwhKv5fEE	2026-05-06 14:13:50.18	2026-05-06 13:43:50.181441	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 13:43:50.181441
98	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDYwMTc5LCJleHAiOjE3NzgwNjE5Nzl9.T_uer8bcpJZDhbLyytc82Mho-ikLxTtEoTfraHOaBmE	2026-05-06 15:36:19.45	2026-05-06 15:06:19.45148	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 15:06:19.45148
99	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDY0OTA3LCJleHAiOjE3NzgwNjY3MDd9.E7lf3HlfGn5-soVdq-oqqop3o9lTETPPXNA-HKmutWY	2026-05-06 16:55:07.414	2026-05-06 16:25:07.415656	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 16:25:07.415656
100	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDY2OTkzLCJleHAiOjE3NzgwNjg3OTN9.05bmupP_pZ02yM9PHoLCHRHSjel2yFeOeZkY1Evn-3s	2026-05-06 17:29:53.676	2026-05-06 16:59:53.67806	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 16:59:53.67806
101	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDY3MTI2LCJleHAiOjE3NzgwNjg5MjZ9.PHhGoA3UCQLHFWMqaVELcysRVKVEkgQNaVGzqbyMzqM	2026-05-06 17:32:06.824	2026-05-06 17:02:06.826362	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 17:02:06.826362
102	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDY3NTY3LCJleHAiOjE3NzgwNjkzNjd9.tl0qPgePDrG8hAO3xDGksUeJEUXYWRjTZGHBlmEqezQ	2026-05-06 17:39:27.872	2026-05-06 17:09:27.873851	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 17:09:27.873851
103	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDY3NjA1LCJleHAiOjE3NzgwNjk0MDV9.tIbqGKGIZvWBpdPwCph-aTzCKQqCk2GxSQc5-ef2k_c	2026-05-06 17:40:05.392	2026-05-06 17:10:05.393988	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 17:10:05.393988
104	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDY3ODUxLCJleHAiOjE3NzgwNjk2NTF9.FfhAWT0VTiQ6BrRAsD6dMNedkdY2Tm7H9K9dun0RK5U	2026-05-06 17:44:11.599	2026-05-06 17:14:11.60125	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 17:14:11.60125
107	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MDcyOTA5LCJleHAiOjE3NzgwNzQ3MDl9.v1Kwt9syg2JXJI3mISRl8c4E9ur2t1TzhBX7-40cyus	2026-05-06 19:08:29.958	2026-05-06 18:38:29.973171	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-06 18:38:29.973171
108	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MTQwMzM0LCJleHAiOjE3NzgxNDIxMzR9.WYBuQlUY1GLzN0rsSoXxT-ZevRoNklr5pAzP7W5-ul0	2026-05-07 13:52:14.786	2026-05-07 13:22:14.788263	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 13:22:14.788263
109	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYW5qYW5qeW90QGdhcmFnZWNvbGxlY3RpdmUuYWdlbmN5IiwiaWF0IjoxNzc4MTQwMzY2LCJleHAiOjE3NzgxNDIxNjZ9.LhfmcuY_VbIjdpjAfOtuzaAwU1VDwIeGBnSNsu-Wsg4	2026-05-07 13:52:46.033	2026-05-07 13:22:46.034934	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 13:22:46.034934
110	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYW5qYW5qeW90QGdhcmFnZWNvbGxlY3RpdmUuYWdlbmN5IiwiaWF0IjoxNzc4MTQwNDE2LCJleHAiOjE3NzgxNDIyMTZ9.rw78nhqu4LhhUhj1Dipbp4E36x8P7nZgG77TN8MYxlw	2026-05-07 13:53:36.409	2026-05-07 13:23:36.410367	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 13:23:36.410367
111	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MTQ2NzE0LCJleHAiOjE3NzgxNDg1MTR9.f3fiBojNWXBd6aK_o5Ih-82hm1FJNreNhxuETeNRJNQ	2026-05-07 15:38:34.12	2026-05-07 15:08:34.122623	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 15:08:34.122623
112	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYW5qYW5qeW90QGdhcmFnZWNvbGxlY3RpdmUuYWdlbmN5IiwiaWF0IjoxNzc4MTQ2ODA4LCJleHAiOjE3NzgxNDg2MDh9.bgU8cyyMW0-Gj1A9U-kNfp1NUauBfAz4MBHS-ux1r9M	2026-05-07 15:40:08.838	2026-05-07 15:10:08.839682	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 15:10:08.839682
113	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MTUxMjMzLCJleHAiOjE3NzgxNTMwMzN9.hiXTq4vijvHJTk8ENFEmQnXzowv8ZfoJp5Ox9GQhnu8	2026-05-07 16:53:53.113	2026-05-07 16:23:53.114997	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 16:23:53.114997
114	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYW5qYW5qeW90QGdhcmFnZWNvbGxlY3RpdmUuYWdlbmN5IiwiaWF0IjoxNzc4MTUxMjU0LCJleHAiOjE3NzgxNTMwNTR9.lp67WxBe-SEtI9A5ved1tFxijAyYbHZwNeeg05UoU_Y	2026-05-07 16:54:14.337	2026-05-07 16:24:14.337884	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 16:24:14.337884
115	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MTUzNTEwLCJleHAiOjE3NzgxNTUzMTB9.BA6d4ncR35BSLVPoNeoYvQ-YMQR1suAMCr6XGjksoig	2026-05-07 17:31:50.911	2026-05-07 17:01:50.912957	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 17:01:50.912957
116	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYW5qYW5qeW90QGdhcmFnZWNvbGxlY3RpdmUuYWdlbmN5IiwiaWF0IjoxNzc4MTUzNTI2LCJleHAiOjE3NzgxNTUzMjZ9.HXcMmDk68Bmx_m6-JamsucbXyuyG9qJ63zGIqaGebkU	2026-05-07 17:32:06.983	2026-05-07 17:02:06.984398	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 17:02:06.984398
117	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MTU3NzE0LCJleHAiOjE3NzgxNTk1MTR9.yTF887AwT2mWhSFEaZhuSFXbCtLMkYBszNR4fiFDyoQ	2026-05-07 18:41:54.466	2026-05-07 18:11:54.467297	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 18:11:54.467297
118	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MTU5Nzg5LCJleHAiOjE3NzgxNjE1ODl9.1OIvVP4XdtmsR47Ns1MDB8fA08UTtnXGuRCUZWron1g	2026-05-07 19:16:29.446	2026-05-07 18:46:29.447084	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36	2026-05-07 18:46:29.447084
119	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjE2OTQ1LCJleHAiOjE3NzgyMTg3NDV9.rWyaF3Vx-xTj9-QoB2rDIOkc7G5DL_TxUuxtqVNvO7M	2026-05-08 11:09:05.541	2026-05-08 10:39:05.549083	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 10:39:05.549083
120	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjIwMTM4LCJleHAiOjE3NzgyMjE5Mzh9.N_CE3Eidk9CbdJVhE0IYbTvrU7Z97_D-BOn_dBPN7yo	2026-05-08 12:02:18.795	2026-05-08 11:32:18.796796	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 11:32:18.796796
121	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjIzNTkxLCJleHAiOjE3NzgyMjUzOTF9.HtpJhSTD25gLD0oTLYSB9nywC_mI27fYW2z-yvbUkXY	2026-05-08 12:59:51.913	2026-05-08 12:29:51.915306	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 12:29:51.915306
122	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYW5qYW5qeW90QGdhcmFnZWNvbGxlY3RpdmUuYWdlbmN5IiwiaWF0IjoxNzc4MjIzOTM2LCJleHAiOjE3NzgyMjU3MzZ9.rdbwlygNe435yYosesMP4wTZrmxrRLgdjt8oeJnx1fE	2026-05-08 13:05:36.229	2026-05-08 12:35:36.23053	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 12:35:36.23053
123	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjM0MTQ3LCJleHAiOjE3NzgyMzU5NDd9.K-pfAwE_TR-M5GXLZNDIXMKQz3QlXvFZ1vy_DiFT-Dg	2026-05-08 15:55:47.388	2026-05-08 15:25:47.3895	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 15:25:47.3895
141	3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoicmFodWxAZ21haWwuY29tIiwiaWF0IjoxNzc4MjM3NTY1LCJleHAiOjE3NzgyMzkzNjV9.xJY_AS0OfcNHVyDOUEb2AVdsuSTvTel09uzeXQEzgkQ	2026-05-08 16:52:45.793	2026-05-08 16:22:45.794772	\N	\N	2026-05-08 16:22:45.794772
145	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjM3ODU1LCJleHAiOjE3NzgyMzk2NTV9.jmfro7ASSpiLE7ORSTVSUNnf8dI4eu-uG7syW1vneH8	2026-05-08 16:57:35.305	2026-05-08 16:27:35.31814	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 16:27:35.31814
149	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQyODA5LCJleHAiOjE3NzgyNDQ2MDl9.33JBpCGpl1oBk07peP76W-7CEZAroveYMgZq7h4uVvo	2026-05-08 18:20:09.021	2026-05-08 17:50:09.022202	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 17:50:09.022202
150	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQyODMwLCJleHAiOjE3NzgyNDQ2MzB9.mfAKqM_tbjslRnSGnIG5DEOnXAIDRNPLyziexqvr_dU	2026-05-08 18:20:30.902	2026-05-08 17:50:30.903413	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 17:50:30.903413
151	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQyODUyLCJleHAiOjE3NzgyNDQ2NTJ9.nKJSI_0Qs6Ovcur_Yac-hJQjqH0pD252aK5MhcsC1bQ	2026-05-08 18:20:52.289	2026-05-08 17:50:52.290333	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 17:50:52.290333
152	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQzNTcwLCJleHAiOjE3NzgyNDUzNzB9.88FE2mZ9A-_DI4j7Rvuy55J7QTRqsI4ykxnlfgqnHas	2026-05-08 18:32:50.692	2026-05-08 18:02:50.693459	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 18:02:50.693459
153	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQzOTU3LCJleHAiOjE3NzgyNDU3NTd9.mzVPQ_SsM5CBFrnMYoHw_plzYEKvK66z4ZwDXcvSze4	2026-05-08 18:39:17.153	2026-05-08 18:09:17.154087	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 18:09:17.154087
154	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQzOTgwLCJleHAiOjE3NzgyNDU3ODB9.kJ9JUrOElOoylTAoxYy3gJqewd693hi5tNTa4lvvLNY	2026-05-08 18:39:40.259	2026-05-08 18:09:40.26029	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 18:09:40.26029
155	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQ0NDAxLCJleHAiOjE3NzgyNDYyMDF9.K-ozaRjXbwxM0HR1Y5hIIV6QVUZC2exxd53kO5UwIgE	2026-05-08 18:46:41.454	2026-05-08 18:16:41.454938	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 18:16:41.454938
156	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYW5qYW5qeW90QGdhcmFnZWNvbGxlY3RpdmUuYWdlbmN5IiwiaWF0IjoxNzc4MjQ0NDI3LCJleHAiOjE3NzgyNDYyMjd9.-4CD_zWNeDo6UEpUMi8o8UgsDVRGxkl8Ev-VWs-NwKg	2026-05-08 18:47:07.461	2026-05-08 18:17:07.46183	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 18:17:07.46183
157	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQ1MDYyLCJleHAiOjE3NzgyNDY4NjJ9.BHtt2Px-SbAw0fhZtAumn1AUiW_nqrQ-YAj2iLm1EmI	2026-05-08 18:57:42.956	2026-05-08 18:27:42.957255	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 18:27:42.957255
161	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQ3MTkwLCJleHAiOjE3NzgyNDg5OTB9.7SHdUrhRuXkTrWFdEbwpLAD1T0_cjSQfWBBiKH6ZIlY	2026-05-08 19:33:10.978	2026-05-08 19:03:10.979132	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 19:03:10.979132
162	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQ3ODc4LCJleHAiOjE3NzgyNDk2Nzh9.Co3akQVW4XLoVyZhgstzJqQDApyUalnj1B6rEGuU5ZQ	2026-05-08 19:44:38.921	2026-05-08 19:14:38.922749	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 19:14:38.922749
163	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4MjQ4MTUzLCJleHAiOjE3NzgyNDk5NTN9.hoxMTpV1sWIczH2q5-kYB_ZewcqUS-1bAKZWC56DoNo	2026-05-08 19:49:13.429	2026-05-08 19:19:13.430231	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-08 19:19:13.430231
164	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4NDc1MzYzLCJleHAiOjE3Nzg0NzcxNjN9.FNvIIG4xsuwhtj6QYFEtnedYyKT6Aqe4CpkteaUGDn8	2026-05-11 10:56:03.054	2026-05-11 10:26:03.06517	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-11 10:26:03.06517
165	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4NDc2MTQxLCJleHAiOjE3Nzg0Nzc5NDF9.QfFKHI-u6jJ_RlnZjAjNKqSDpLx80PKAuk5H7G_VQ7g	2026-05-11 11:09:01.474	2026-05-11 10:39:01.476484	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-11 10:39:01.476484
166	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidmlub2RAZ2FyYWdlbWVkaWEubmV0IiwiaWF0IjoxNzc4NTAzMzAwLCJleHAiOjE3Nzg1MDUxMDB9.rftFsSaKRsPapMM0Qpo---7RD_ybHHFsCD6z_bM0XF0	2026-05-11 18:41:40.756	2026-05-11 18:11:40.757995	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-05-11 18:11:40.757995
\.


--
-- TOC entry 5094 (class 0 OID 16632)
-- Dependencies: 232
-- Data for Name: upsell_opportunities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.upsell_opportunities (id, client_id, recommended_services, potential_gain, probability, priority, status, created_at, updated_at) FROM stdin;
7	11	{Analytics,"Content Marketing"}	200000.00	75	High	Identified	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
8	12	{"Paid Ads",Analytics}	120000.00	60	Medium	Identified	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
9	15	{"Content Marketing","Web Development"}	180000.00	70	High	In Progress	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
10	20	{"Web Development","Content Marketing"}	250000.00	80	High	Identified	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
11	18	{Analytics,"Web Development"}	500000.00	85	High	In Progress	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
12	21	{Maintenance}	50000.00	40	Low	Identified	2026-02-16 12:32:11.133757	2026-02-16 12:32:11.133757
\.


--
-- TOC entry 5078 (class 0 OID 16466)
-- Dependencies: 216
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, password_hash, role, phone_number, department, time_zone, profile_picture_url, status, email_verified, failed_login_attempts, account_locked_until, last_login_at, created_at, updated_at, deleted_at) FROM stdin;
1	Vinod Kumar	vinod@garagemedia.net	$2b$12$sQjxAvcwEf2goEut61UE7OWUgyXkKgc.iEZ.PWk5AbOlRZOn5439S	Account Manager	\N	\N	Asia/Kolkata	\N	Active	f	0	\N	2026-05-11 19:00:33.604405	2026-02-09 17:34:56.16444	2026-05-11 19:00:33.604405	\N
2	Anjan Jyot	anjanjyot@garagecollective.agency	$2b$12$100wl7IsRwpIq39a0F2du.oz6xiGpqnjYdNqeBVlkvmau6hp/vfwq	vendor_manager	\N	\N	Asia/Kolkata	\N	Active	f	0	\N	2026-05-11 19:02:16.759385	2026-05-06 17:49:39.890764	2026-05-11 19:02:16.759385	\N
3	Rahul	rahul@gmail.com	$2b$12$wDzSejcRakgkoxoFjr/tWe2eMSuHLyb/dKCN7BpEsJmJL.oi44jAe	vendor	\N	\N	Asia/Kolkata	\N	Active	f	0	\N	2026-05-11 19:02:51.8303	2026-05-08 16:22:45.770791	2026-05-11 19:02:51.8303	\N
\.


--
-- TOC entry 5110 (class 0 OID 16837)
-- Dependencies: 248
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, user_id, vendor_name, vendor_type, gst_number, pan_number, address, city, state, pincode, country, contact_person, email, mobile, alt_mobile, website, account_holder, bank_name, account_number, ifsc_code, upi_id, swift_code, status, onboarded_by, created_at, updated_at) FROM stdin;
1	3	Vinodkumar Pvt ltd	Agency	\N	GGMPL9071Q	Noida	Ghaziabad	Uttar Pradesh	201301	India	rahul	rahul@gmail.com	9811709878	\N	\N	Rahul	hdfc	789738388383	HDFC0002345	\N	\N	Active	\N	2026-05-08 16:22:45.78584	2026-05-08 16:22:45.78584
\.


--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 239
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 243
-- Name: churn_reasons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.churn_reasons_id_seq', 1, false);


--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 227
-- Name: client_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_services_id_seq', 61, true);


--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 221
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 21, true);


--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 223
-- Name: contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contracts_id_seq', 21, true);


--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 245
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 6, true);


--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 241
-- Name: notification_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_preferences_id_seq', 2, true);


--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 235
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 217
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 249
-- Name: purchase_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_invoices_id_seq', 2, true);


--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 233
-- Name: renewal_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.renewal_tasks_id_seq', 1, false);


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 229
-- Name: revenue_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.revenue_records_id_seq', 524, true);


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 237
-- Name: scheduled_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scheduled_reports_id_seq', 1, false);


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 225
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 30, true);


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 219
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 172, true);


--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 231
-- Name: upsell_opportunities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.upsell_opportunities_id_seq', 12, true);


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 215
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 247
-- Name: vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vendors_id_seq', 1, true);


--
-- TOC entry 4879 (class 2606 OID 16735)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 16777)
-- Name: churn_reasons churn_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_reasons
    ADD CONSTRAINT churn_reasons_pkey PRIMARY KEY (id);


--
-- TOC entry 4853 (class 2606 OID 16597)
-- Name: client_services client_services_client_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_client_id_service_id_key UNIQUE (client_id, service_id);


--
-- TOC entry 4855 (class 2606 OID 16595)
-- Name: client_services client_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_pkey PRIMARY KEY (id);


--
-- TOC entry 4837 (class 2606 OID 16535)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 16557)
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 16811)
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 4898 (class 2606 OID 16809)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 16759)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 16761)
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- TOC entry 4875 (class 2606 OID 16699)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4827 (class 2606 OID 16494)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4829 (class 2606 OID 16496)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 4907 (class 2606 OID 16879)
-- Name: purchase_invoices purchase_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 4871 (class 2606 OID 16666)
-- Name: renewal_tasks renewal_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.renewal_tasks
    ADD CONSTRAINT renewal_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4863 (class 2606 OID 16618)
-- Name: revenue_records revenue_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_records
    ADD CONSTRAINT revenue_records_pkey PRIMARY KEY (id);


--
-- TOC entry 4877 (class 2606 OID 16720)
-- Name: scheduled_reports scheduled_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT scheduled_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4849 (class 2606 OID 16585)
-- Name: services services_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_name_key UNIQUE (name);


--
-- TOC entry 4851 (class 2606 OID 16583)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- TOC entry 4833 (class 2606 OID 16514)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4835 (class 2606 OID 16516)
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- TOC entry 4867 (class 2606 OID 16645)
-- Name: upsell_opportunities upsell_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upsell_opportunities
    ADD CONSTRAINT upsell_opportunities_pkey PRIMARY KEY (id);


--
-- TOC entry 4821 (class 2606 OID 16484)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4823 (class 2606 OID 16482)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 16849)
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- TOC entry 4880 (class 1259 OID 16742)
-- Name: idx_audit_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_created ON public.audit_logs USING btree (created_at);


--
-- TOC entry 4881 (class 1259 OID 16741)
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (user_id);


--
-- TOC entry 4856 (class 1259 OID 16824)
-- Name: idx_client_services_billing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_client_services_billing ON public.client_services USING btree (billing_frequency);


--
-- TOC entry 4857 (class 1259 OID 16608)
-- Name: idx_client_services_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_client_services_client ON public.client_services USING btree (client_id);


--
-- TOC entry 4858 (class 1259 OID 16609)
-- Name: idx_client_services_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_client_services_service ON public.client_services USING btree (service_id);


--
-- TOC entry 4838 (class 1259 OID 16541)
-- Name: idx_clients_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_name ON public.clients USING btree (client_name);


--
-- TOC entry 4839 (class 1259 OID 16542)
-- Name: idx_clients_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_status ON public.clients USING btree (status);


--
-- TOC entry 4840 (class 1259 OID 16543)
-- Name: idx_clients_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clients_type ON public.clients USING btree (client_type);


--
-- TOC entry 4843 (class 1259 OID 16573)
-- Name: idx_contracts_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_client_id ON public.contracts USING btree (client_id);


--
-- TOC entry 4844 (class 1259 OID 16827)
-- Name: idx_contracts_client_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_client_status ON public.contracts USING btree (client_id, status);


--
-- TOC entry 4845 (class 1259 OID 16574)
-- Name: idx_contracts_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_end_date ON public.contracts USING btree (end_date);


--
-- TOC entry 4846 (class 1259 OID 16575)
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);


--
-- TOC entry 4847 (class 1259 OID 16828)
-- Name: idx_contracts_status_enddate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status_enddate ON public.contracts USING btree (status, end_date);


--
-- TOC entry 4888 (class 1259 OID 16817)
-- Name: idx_invoices_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_client ON public.invoices USING btree (client_id);


--
-- TOC entry 4889 (class 1259 OID 16825)
-- Name: idx_invoices_client_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_client_month ON public.invoices USING btree (client_id, invoice_month);


--
-- TOC entry 4890 (class 1259 OID 16829)
-- Name: idx_invoices_client_service_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_client_service_month ON public.invoices USING btree (client_id, invoice_month, services_description);


--
-- TOC entry 4891 (class 1259 OID 16818)
-- Name: idx_invoices_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_date ON public.invoices USING btree (invoice_date);


--
-- TOC entry 4892 (class 1259 OID 16819)
-- Name: idx_invoices_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_month ON public.invoices USING btree (invoice_month);


--
-- TOC entry 4893 (class 1259 OID 16821)
-- Name: idx_invoices_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_number ON public.invoices USING btree (invoice_number);


--
-- TOC entry 4894 (class 1259 OID 16820)
-- Name: idx_invoices_payment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_payment ON public.invoices USING btree (payment_status);


--
-- TOC entry 4872 (class 1259 OID 16706)
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read_at);


--
-- TOC entry 4873 (class 1259 OID 16705)
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- TOC entry 4904 (class 1259 OID 16886)
-- Name: idx_pi_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pi_status ON public.purchase_invoices USING btree (status);


--
-- TOC entry 4905 (class 1259 OID 16885)
-- Name: idx_pi_vendor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pi_vendor_id ON public.purchase_invoices USING btree (vendor_id);


--
-- TOC entry 4868 (class 1259 OID 16687)
-- Name: idx_renewal_tasks_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_renewal_tasks_assigned ON public.renewal_tasks USING btree (assigned_to);


--
-- TOC entry 4869 (class 1259 OID 16688)
-- Name: idx_renewal_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_renewal_tasks_due_date ON public.renewal_tasks USING btree (due_date);


--
-- TOC entry 4824 (class 1259 OID 16503)
-- Name: idx_reset_tokens_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_tokens_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- TOC entry 4825 (class 1259 OID 16502)
-- Name: idx_reset_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- TOC entry 4859 (class 1259 OID 16629)
-- Name: idx_revenue_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_revenue_client ON public.revenue_records USING btree (client_id);


--
-- TOC entry 4860 (class 1259 OID 16826)
-- Name: idx_revenue_client_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_revenue_client_date ON public.revenue_records USING btree (client_id, record_date);


--
-- TOC entry 4861 (class 1259 OID 16630)
-- Name: idx_revenue_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_revenue_date ON public.revenue_records USING btree (record_date);


--
-- TOC entry 4830 (class 1259 OID 16522)
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token);


--
-- TOC entry 4831 (class 1259 OID 16523)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- TOC entry 4864 (class 1259 OID 16651)
-- Name: idx_upsell_client; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_upsell_client ON public.upsell_opportunities USING btree (client_id);


--
-- TOC entry 4865 (class 1259 OID 16652)
-- Name: idx_upsell_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_upsell_priority ON public.upsell_opportunities USING btree (priority);


--
-- TOC entry 4818 (class 1259 OID 16485)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4819 (class 1259 OID 16486)
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- TOC entry 4899 (class 1259 OID 16861)
-- Name: idx_vendors_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_email ON public.vendors USING btree (email);


--
-- TOC entry 4900 (class 1259 OID 16862)
-- Name: idx_vendors_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_status ON public.vendors USING btree (status);


--
-- TOC entry 4901 (class 1259 OID 16860)
-- Name: idx_vendors_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vendors_user_id ON public.vendors USING btree (user_id);


--
-- TOC entry 4925 (class 2606 OID 16736)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4927 (class 2606 OID 16778)
-- Name: churn_reasons churn_reasons_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_reasons
    ADD CONSTRAINT churn_reasons_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 4928 (class 2606 OID 16783)
-- Name: churn_reasons churn_reasons_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_reasons
    ADD CONSTRAINT churn_reasons_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 4929 (class 2606 OID 16788)
-- Name: churn_reasons churn_reasons_logged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.churn_reasons
    ADD CONSTRAINT churn_reasons_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES public.users(id);


--
-- TOC entry 4914 (class 2606 OID 16598)
-- Name: client_services client_services_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 4915 (class 2606 OID 16603)
-- Name: client_services client_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_services
    ADD CONSTRAINT client_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- TOC entry 4910 (class 2606 OID 16536)
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4911 (class 2606 OID 16563)
-- Name: contracts contracts_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- TOC entry 4912 (class 2606 OID 16558)
-- Name: contracts contracts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 4913 (class 2606 OID 16568)
-- Name: contracts contracts_previous_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_previous_contract_id_fkey FOREIGN KEY (previous_contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 4930 (class 2606 OID 16812)
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 16762)
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4923 (class 2606 OID 16700)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4908 (class 2606 OID 16497)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4933 (class 2606 OID 16880)
-- Name: purchase_invoices purchase_invoices_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_invoices
    ADD CONSTRAINT purchase_invoices_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- TOC entry 4919 (class 2606 OID 16677)
-- Name: renewal_tasks renewal_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.renewal_tasks
    ADD CONSTRAINT renewal_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- TOC entry 4920 (class 2606 OID 16667)
-- Name: renewal_tasks renewal_tasks_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.renewal_tasks
    ADD CONSTRAINT renewal_tasks_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 4921 (class 2606 OID 16672)
-- Name: renewal_tasks renewal_tasks_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.renewal_tasks
    ADD CONSTRAINT renewal_tasks_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);


--
-- TOC entry 4922 (class 2606 OID 16682)
-- Name: renewal_tasks renewal_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.renewal_tasks
    ADD CONSTRAINT renewal_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4916 (class 2606 OID 16619)
-- Name: revenue_records revenue_records_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_records
    ADD CONSTRAINT revenue_records_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 4917 (class 2606 OID 16624)
-- Name: revenue_records revenue_records_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_records
    ADD CONSTRAINT revenue_records_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- TOC entry 4924 (class 2606 OID 16721)
-- Name: scheduled_reports scheduled_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_reports
    ADD CONSTRAINT scheduled_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4909 (class 2606 OID 16517)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4918 (class 2606 OID 16646)
-- Name: upsell_opportunities upsell_opportunities_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upsell_opportunities
    ADD CONSTRAINT upsell_opportunities_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- TOC entry 4931 (class 2606 OID 16855)
-- Name: vendors vendors_onboarded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_onboarded_by_fkey FOREIGN KEY (onboarded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4932 (class 2606 OID 16850)
-- Name: vendors vendors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2026-05-12 12:29:40

--
-- PostgreSQL database dump complete
--

\unrestrict MFXJvBeJkjrwMlCfaxvb8lWjKCNkw8JxmhqAnkcuCBg8Dj7HxcVazc45w262DfK

