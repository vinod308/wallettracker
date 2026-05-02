/**
 * KPI Section Component
 * Displays all 4 main KPIs from Google Sheets data.
 * At Risk Revenue card shows a hover tooltip listing each at-risk client.
 */

import React from 'react';
import KPICard from './KPICard';

const KPISection = ({ kpis, loading = false }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
                label="Total MRR"
                value={kpis?.totalMRR || 0}
                trend="up"
                isCurrency={true}
                loading={loading}
            />
            <KPICard
                label="Total Revenue YTD"
                value={kpis?.totalRevenue || 0}
                trend="up"
                isCurrency={true}
                loading={loading}
            />
            <KPICard
                label="Active Clients"
                value={kpis?.activeClients || 0}
                isCurrency={false}
                loading={loading}
            />
            <KPICard
                label="At Risk Revenue"
                value={kpis?.atRiskRevenue || 0}
                growth={kpis?.atRiskCount > 0 ? `${kpis.atRiskCount} client${kpis.atRiskCount > 1 ? 's' : ''}` : null}
                trend="warning"
                isCurrency={true}
                loading={loading}
                tooltipClients={kpis?.atRiskClients || null}
            />
        </div>
    );
};

export default KPISection;
