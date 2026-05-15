/**
 * App Component
 * Root application component
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { useInactivity } from './hooks/useInactivity';
import AppRouter from './routes/AppRouter';
import InactivityModal from './components/common/InactivityModal';

const AppContent = () => {
  const { showWarning, remainingTime, stayLoggedIn } = useInactivity();

  return (
    <>
      <AppRouter />

      {/* Inactivity Warning Modal (exact from spec: 28 minutes) */}
      <InactivityModal
        isOpen={showWarning}
        remainingTime={remainingTime}
        onStayLoggedIn={stayLoggedIn}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
