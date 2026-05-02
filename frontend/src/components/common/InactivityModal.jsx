/**
 * Inactivity Modal Component
 * Displays warning at 28 minutes (exact from spec: Section 9)
 */

import React from 'react';
import Modal from './Modal';
import Button from './Button';

const InactivityModal = ({ isOpen, remainingTime, onStayLoggedIn }) => {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onStayLoggedIn}
      title="Session Expiring"
      size="sm"
      showCloseButton={false}
    >
      <div className="text-center space-y-4">
        <div className="text-yellow-600 text-6xl">⚠️</div>

        <div>
          <p className="text-lg font-medium text-gray-900">
            You will be logged out in
          </p>
          <p className="text-4xl font-bold text-primary-red mt-2">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            due to inactivity
          </p>
        </div>

        <p className="text-sm text-gray-700">
          Click the button below to stay logged in.
        </p>

        <Button
          variant="primary"
          fullWidth
          onClick={onStayLoggedIn}
        >
          Stay Logged In
        </Button>
      </div>
    </Modal>
  );
};

export default InactivityModal;
