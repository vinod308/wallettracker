import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('gw_sidebar_collapsed') === 'true';
    });

    const handleToggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('gw_sidebar_collapsed', next);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-[#F7F8FC]">
            <Header
                onMenuClick={() => setSidebarOpen(prev => !prev)}
                isCollapsed={isCollapsed}
            />

            <div className="flex">
                {/* Mobile backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={handleToggleCollapse}
                />

                <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
