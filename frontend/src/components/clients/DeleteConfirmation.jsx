/**
 * Delete Confirmation Modal
 * Confirmation dialog for deleting a client
 */

import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, client, loading }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Client" size="small">
            <div className="space-y-4">
                {/* Warning Icon */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                    <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Message */}
                <div className="text-center">
                    <p className="text-gray-900 font-medium mb-2">
                        Are you sure you want to delete this client?
                    </p>
                    {client && (
                        <div className="text-sm text-gray-600 mb-4">
                            <p className="font-semibold">{client.client_name}</p>
                            <p className="text-xs">{client.project_name}</p>
                        </div>
                    )}
                    <p className="text-sm text-gray-500">
                        This action cannot be undone. All client data, contracts, and related information will be permanently deleted.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        loading={loading}
                    >
                        Delete Client
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConfirmation;
