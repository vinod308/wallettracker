import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('gw_sidebar_collapsed') === 'true';
    });

    const location = useLocation();
    const mainRef  = useRef(null);

    const handleToggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('gw_sidebar_collapsed', next);
            return next;
        });
    };

    // Page entry animation on every route change
    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;
        el.classList.remove('page-anim');
        void el.offsetWidth; // force reflow to re-trigger animation
        el.classList.add('page-anim');
    }, [location.pathname]);

    // Auto scroll-reveal: watch for .bg-white.rounded-2xl cards and animate them in
    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;

        let io, mo;

        const timer = setTimeout(() => {
            let idx = 0;

            io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('sr-in');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

            const observeCards = () => {
                el.querySelectorAll('.bg-white.rounded-2xl:not([data-sr])').forEach(card => {
                    card.setAttribute('data-sr', '1');
                    card.classList.add('sr-card');
                    card.style.transitionDelay = `${Math.min(idx * 0.055, 0.38)}s`;
                    idx++;
                    io.observe(card);
                });
            };

            observeCards();

            // Also catch cards added later (async data loads)
            mo = new MutationObserver(observeCards);
            mo.observe(el, { childList: true, subtree: true });
        }, 80);

        return () => {
            clearTimeout(timer);
            io?.disconnect();
            mo?.disconnect();
        };
    }, [location.pathname]);

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

                <main
                    id="main-content"
                    ref={mainRef}
                    className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden page-anim"
                >
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
