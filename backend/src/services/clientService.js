/**
 * Client Service
 * Business logic for client operations
 */

const clientRepository = require('../repositories/clientRepository');
const contractRepository = require('../repositories/contractRepository');
const invoiceRepository = require('../repositories/invoiceRepository');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class ClientService {
    /**
     * Get all clients with filters
     */
    async getAllClients(filters = {}) {
        try {
            const clients = await clientRepository.findAll(filters);
            const totalCount = await clientRepository.count(filters);

            return {
                clients,
                pagination: {
                    total: totalCount,
                    page: Math.floor((filters.offset || 0) / (filters.limit || 25)) + 1,
                    limit: filters.limit || 25,
                    pages: Math.ceil(totalCount / (filters.limit || 25)),
                },
            };
        } catch (error) {
            logger.error('Error in getAllClients:', error);
            throw error;
        }
    }

    /**
     * Get client by ID with services and contracts
     */
    async getClientById(id) {
        try {
            const client = await clientRepository.findById(id);

            if (!client) {
                throw new NotFoundError('Client not found');
            }

            // Get client contracts
            const contracts = await contractRepository.getByClientId(id);

            return {
                ...client,
                contracts,
            };
        } catch (error) {
            logger.error(`Error in getClientById (${id}):`, error);
            throw error;
        }
    }

    /**
     * Create new client with services and contract
     */
    async createClient(clientData, userId) {
        try {
            // Check for duplicate client name
            const existingClients = await clientRepository.findAll({
                search: clientData.clientName,
            });

            const exactMatch = existingClients.find(
                (c) => c.client_name.toLowerCase() === clientData.clientName.toLowerCase()
            );

            if (exactMatch) {
                throw new ValidationError('A client with this name already exists');
            }

            // Auto-capitalize project name
            const formattedProjectName = clientData.projectName
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            // Create client with services
            const newClient = await clientRepository.create({
                projectName: formattedProjectName,
                clientName: clientData.clientName,
                clientType: clientData.clientType,
                industry: clientData.industry || null,
                estimatedTotalBudget: clientData.estimatedTotalBudget || null,
                services: clientData.services,
                createdBy: userId,
            });

            // Create initial contract
            if (clientData.contractStartDate && clientData.contractEndDate) {
                await contractRepository.create({
                    clientId: newClient.id,
                    startDate: clientData.contractStartDate,
                    endDate: clientData.contractEndDate,
                    mrr: clientData.mrr,
                    autoRenew: clientData.autoRenew || false,
                    assignedTo: userId,
                });
            }

            logger.info(`Client created: ${newClient.client_name} by user ${userId}`);

            return await this.getClientById(newClient.id);
        } catch (error) {
            logger.error('Error in createClient:', error);
            throw error;
        }
    }

    /**
     * Update client
     */
    async updateClient(id, updates, userId) {
        try {
            // Check if client exists
            const existingClient = await clientRepository.findById(id);

            if (!existingClient) {
                throw new NotFoundError('Client not found');
            }

            // Check for duplicate name if client_name is being updated
            if (updates.clientName && updates.clientName !== existingClient.client_name) {
                const duplicates = await clientRepository.findAll({
                    search: updates.clientName,
                });

                const exactMatch = duplicates.find(
                    (c) =>
                        c.client_name.toLowerCase() === updates.clientName.toLowerCase() &&
                        c.id !== id
                );

                if (exactMatch) {
                    throw new ValidationError('A client with this name already exists');
                }
            }

            // Format project name if provided
            if (updates.projectName) {
                updates.projectName = updates.projectName
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            }

            // Convert camelCase to snake_case for database
            const dbUpdates = {};
            if (updates.projectName) dbUpdates.project_name = updates.projectName;
            if (updates.clientName) dbUpdates.client_name = updates.clientName;
            if (updates.clientType) dbUpdates.client_type = updates.clientType;
            if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
            if (updates.estimatedTotalBudget !== undefined)
                dbUpdates.estimated_total_budget = updates.estimatedTotalBudget;
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.gstNumber !== undefined) dbUpdates.gst_number = updates.gstNumber;
            if (updates.address !== undefined) dbUpdates.address = updates.address;
            if (updates.state !== undefined) dbUpdates.state = updates.state;
            if (updates.stateCode !== undefined) dbUpdates.state_code = updates.stateCode;
            if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
            if (updates.accountNumber !== undefined) dbUpdates.account_number = updates.accountNumber;
            if (updates.ifscCode !== undefined) dbUpdates.ifsc_code = updates.ifscCode;
            if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
            if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail;
            if (updates.mobileNumber !== undefined) dbUpdates.mobile_number = updates.mobileNumber;
            if (updates.altContactEmail !== undefined) dbUpdates.alt_contact_email = updates.altContactEmail;

            const updatedClient = await clientRepository.update(id, dbUpdates);

            logger.info(`Client updated: ${id} by user ${userId}`);

            return await this.getClientById(id);
        } catch (error) {
            logger.error(`Error in updateClient (${id}):`, error);
            throw error;
        }
    }

    /**
     * Delete client (soft delete)
     */
    async deleteClient(id, userId) {
        try {
            // Check if client exists
            const existingClient = await clientRepository.findById(id);

            if (!existingClient) {
                throw new NotFoundError('Client not found');
            }

            // Check if client has active contracts
            const contracts = await contractRepository.getByClientId(id);
            const activeContracts = contracts.filter((c) => c.status === 'Active');

            if (activeContracts.length > 0) {
                throw new ValidationError(
                    'Cannot delete client with active contracts. Please expire or cancel contracts first.'
                );
            }

            await clientRepository.softDelete(id);

            logger.info(`Client soft deleted: ${id} by user ${userId}`);

            return { message: 'Client deleted successfully' };
        } catch (error) {
            logger.error(`Error in deleteClient (${id}):`, error);
            throw error;
        }
    }

    /**
     * Check if client name is duplicate
     */
    async checkDuplicateClientName(clientName, excludeId = null) {
        try {
            const clients = await clientRepository.findAll({
                search: clientName,
            });

            const exactMatch = clients.find(
                (c) =>
                    c.client_name.toLowerCase() === clientName.toLowerCase() &&
                    (!excludeId || c.id !== parseInt(excludeId))
            );

            if (exactMatch) {
                return {
                    isDuplicate: true,
                    existingClient: {
                        id: exactMatch.id,
                        clientName: exactMatch.client_name,
                        projectName: exactMatch.project_name,
                    },
                };
            }

            // Find similar names (for suggestions)
            const similarClients = clients
                .filter((c) => !excludeId || c.id !== parseInt(excludeId))
                .slice(0, 3)
                .map((c) => ({
                    id: c.id,
                    clientName: c.client_name,
                    projectName: c.project_name,
                }));

            return {
                isDuplicate: false,
                similarClients,
            };
        } catch (error) {
            logger.error('Error in checkDuplicateClientName:', error);
            throw error;
        }
    }

    /**
     * Get client statistics
     */
    async getClientStatistics() {
        try {
            const activeCount = await clientRepository.getActiveCount();
            const atRiskClients = await clientRepository.getAtRiskClients();

            return {
                totalActive: activeCount,
                atRisk: atRiskClients.length,
                atRiskRevenue: atRiskClients.reduce(
                    (sum, client) => sum + parseFloat(client.mrr || 0),
                    0
                ),
            };
        } catch (error) {
            logger.error('Error in getClientStatistics:', error);
            throw error;
        }
    }

    /**
     * Get client monthly analytics (per-month, per-service breakdown)
     */
    async getClientMonthlyAnalytics(id) {
        try {
            const client = await clientRepository.findById(id);
            if (!client) {
                throw new NotFoundError('Client not found');
            }

            const revenueData = await invoiceRepository.getClientMonthlyAnalytics(id);
            const invoices = await invoiceRepository.getClientInvoices(id);

            // Group by month
            const monthMap = {};
            for (const row of revenueData) {
                const monthKey = row.month_label;
                if (!monthMap[monthKey]) {
                    monthMap[monthKey] = {
                        month: monthKey,
                        recordDate: row.record_date,
                        services: [],
                        totalServiceMRR: 0,
                        totalAddonsMRR: 0,
                        totalMRR: 0,
                    };
                }
                const amt = parseFloat(row.amount) || 0;
                const isAddon = row.is_addon === true;

                monthMap[monthKey].services.push({
                    serviceName: row.service_name || 'Other',
                    category: row.service_category || '',
                    isAddon,
                    amount: amt,
                    recordType: row.record_type,
                });

                if (isAddon) {
                    monthMap[monthKey].totalAddonsMRR += amt;
                } else {
                    monthMap[monthKey].totalServiceMRR += amt;
                }
                monthMap[monthKey].totalMRR += amt;
            }

            // Sort months descending (July first)
            const months = Object.values(monthMap).sort(
                (a, b) => new Date(b.recordDate) - new Date(a.recordDate)
            );

            // Compute lifetime revenue
            const lifetimeRevenue = months.reduce((sum, m) => sum + m.totalMRR, 0);

            // Compute badge
            let badge = 'Stable';
            if (months.length >= 2) {
                const latest = months[0].totalMRR;
                const previous = months[1].totalMRR;
                const change = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
                if (change >= 5) badge = 'Growth Client';
                else if (change <= -5) badge = 'Declining';
            }
            // Check upsell potential (has fewer than 4 services)
            const uniqueServices = new Set(revenueData.filter(r => !r.is_addon).map(r => r.service_name)).size;
            if (uniqueServices <= 3 && badge !== 'Declining') {
                badge = 'Upsell Potential';
            }

            // Build invoice lookup
            const invoiceLookup = {};
            for (const inv of invoices) {
                invoiceLookup[inv.invoice_month] = inv;
            }

            return {
                client: {
                    id: client.id,
                    clientName: client.client_name,
                    projectName: client.project_name,
                    clientType: client.client_type,
                    industry: client.industry,
                    status: client.status,
                    services: client.services,
                },
                lifetimeRevenue,
                badge,
                months,
                invoices: invoiceLookup,
            };
        } catch (error) {
            logger.error(`Error in getClientMonthlyAnalytics (${id}):`, error);
            throw error;
        }
    }

    /**
     * Lightweight onboard — creates a basic client record from the onboarding modal.
     * Idempotent: returns the existing record if a client with the same name exists.
     */
    async onboardClient(clientData, userId) {
        try {
            const pool = require('../config/database');
            const { rows: existing } = await pool.query(
                `SELECT id FROM clients WHERE LOWER(client_name) = LOWER($1) AND deleted_at IS NULL LIMIT 1`,
                [clientData.clientName]
            );

            if (existing.length > 0) {
                const id = existing[0].id;
                await pool.query(`
                    UPDATE clients SET
                        gst_number        = COALESCE($1,  gst_number),
                        address           = COALESCE($2,  address),
                        state             = COALESCE($3,  state),
                        state_code        = COALESCE($4,  state_code),
                        bank_name         = COALESCE($5,  bank_name),
                        account_number    = COALESCE($6,  account_number),
                        ifsc_code         = COALESCE($7,  ifsc_code),
                        contact_person    = COALESCE($8,  contact_person),
                        contact_email     = COALESCE($9,  contact_email),
                        mobile_number     = COALESCE($10, mobile_number),
                        alt_contact_email = COALESCE($11, alt_contact_email),
                        client_type       = COALESCE($12, client_type),
                        updated_at        = NOW()
                    WHERE id = $13`,
                    [
                        clientData.gstNumber    || null,
                        clientData.address      || null,
                        clientData.state        || null,
                        clientData.stateCode    || null,
                        clientData.bankName     || null,
                        clientData.accountNumber || null,
                        clientData.ifscCode     || null,
                        clientData.contactPerson || null,
                        clientData.contactEmail || null,
                        clientData.mobileNumber || null,
                        clientData.altContactEmail || null,
                        clientData.clientType   || null,
                        id,
                    ]
                );
                const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
                logger.info(`Client updated via onboard: ${clientData.clientName}`);
                return rows[0];
            }

            const { rows } = await pool.query(`
                INSERT INTO clients (
                    project_name, client_name, client_type, status, created_by,
                    gst_number, address, state, state_code,
                    bank_name, account_number, ifsc_code,
                    contact_person, contact_email, mobile_number, alt_contact_email
                ) VALUES ($1,$2,$3,'Active',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                RETURNING *`,
                [
                    clientData.clientName,
                    clientData.clientName,
                    clientData.clientType || 'Retainer',
                    userId,
                    clientData.gstNumber    || null,
                    clientData.address      || null,
                    clientData.state        || null,
                    clientData.stateCode    || null,
                    clientData.bankName     || null,
                    clientData.accountNumber || null,
                    clientData.ifscCode     || null,
                    clientData.contactPerson || null,
                    clientData.contactEmail || null,
                    clientData.mobileNumber || null,
                    clientData.altContactEmail || null,
                ]
            );
            logger.info(`Client onboarded: ${clientData.clientName} by user ${userId}`);
            return rows[0];
        } catch (error) {
            logger.error('Error in onboardClient:', error);
            throw error;
        }
    }

    /**
     * Update client status
     */
    async updateClientStatus(id, status, userId) {
        try {
            const client = await clientRepository.findById(id);

            if (!client) {
                throw new NotFoundError('Client not found');
            }

            const updatedClient = await clientRepository.update(id, { status });

            logger.info(`Client status updated: ${id} to ${status} by user ${userId}`);

            return await this.getClientById(id);
        } catch (error) {
            logger.error(`Error in updateClientStatus (${id}):`, error);
            throw error;
        }
    }
}

module.exports = new ClientService();
