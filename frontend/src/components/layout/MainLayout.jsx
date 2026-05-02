/**
 * Main Layout Component
 * Wraps all protected pages with Header and Sidebar
 */

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#F7F8FC]">
            {/* Header */}
            <Header />

            {/* Main Container */}
            <div className="flex">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
