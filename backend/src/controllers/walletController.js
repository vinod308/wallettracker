/**
 * Wallet Controller
 * HTTP handlers for wallet intelligence endpoints
 */

const walletService = require('../services/walletService');
const logger = require('../utils/logger');
const { successResponse } = require('../utils/helpers');

class WalletController {
    /**
     * GET /api/wallet/summary
     * Get total wallet summary
     */
    async getTotalWalletSummary(req, res, next) {
        try {
            const summary = await walletService.getTotalWalletSummary();
            logger.info(`Wallet summary fetched by user ${req.user.id}`);
            return res.json(successResponse('Wallet summary fetched successfully', summary));
        } catch (error) {
            logger.error('Error in getTotalWalletSummary:', error);
            next(error);
        }
    }

    /**
     * GET /api/wallet/distribution
     * Get wallet distribution by client
     */
    async getWalletDistribution(req, res, next) {
        try {
            const distribution = await walletService.getWalletDistribution();
            logger.info(`Wallet distribution fetched by user ${req.user.id}`);
            return res.json(successResponse('Wallet distribution fetched successfully', { clients: distribution }));
        } catch (error) {
            logger.error('Error in getWalletDistribution:', error);
            next(error);
        }
    }

    /**
     * GET /api/wallet/industry-breakdown
     * Get industry-wise breakdown
     */
    async getIndustryBreakdown(req, res, next) {
        try {
            const breakdown = await walletService.getIndustryBreakdown();
            logger.info(`Industry breakdown fetched by user ${req.user.id}`);
            return res.json(successResponse('Industry breakdown fetched successfully', { industries: breakdown }));
        } catch (error) {
            logger.error('Error in getIndustryBreakdown:', error);
            next(error);
        }
    }

    /**
     * GET /api/wallet/expansion-ready
     * Get top expansion-ready clients
     */
    async getExpansionReadyClients(req, res, next) {
        try {
            const { limit = 5 } = req.query;
            const clients = await walletService.getExpansionReadyClients(parseInt(limit));
            logger.info(`Expansion-ready clients fetched by user ${req.user.id}`);
            return res.json(successResponse('Expansion-ready clients fetched successfully', { clients }));
        } catch (error) {
            logger.error('Error in getExpansionReadyClients:', error);
            next(error);
        }
    }

    /**
     * GET /api/wallet/upsell-success
     * Get services with highest upsell success
     */
    async getServicesUpsellSuccess(req, res, next) {
        try {
            const services = await walletService.getServicesUpsellSuccess();
            logger.info(`Services upsell success fetched by user ${req.user.id}`);
            return res.json(successResponse('Services upsell data fetched successfully', { services }));
        } catch (error) {
            logger.error('Error in getServicesUpsellSuccess:', error);
            next(error);
        }
    }

    /**
     * GET /api/wallet/detailed-analysis
     * Get detailed wallet analysis with filters
     */
    async getDetailedWalletAnalysis(req, res, next) {
        try {
            const { industry, priority, minWalletShare, maxWalletShare } = req.query;
            const filters = {
                industry,
                priority,
                minWalletShare: minWalletShare ? parseFloat(minWalletShare) : undefined,
                maxWalletShare: maxWalletShare ? parseFloat(maxWalletShare) : undefined,
            };

            const analysis = await walletService.getDetailedWalletAnalysis(filters);
            logger.info(`Detailed wallet analysis fetched by user ${req.user.id}`);
            return res.json(successResponse('Detailed analysis fetched successfully', { clients: analysis }));
        } catch (error) {
            logger.error('Error in getDetailedWalletAnalysis:', error);
            next(error);
        }
    }
}

module.exports = new WalletController();
