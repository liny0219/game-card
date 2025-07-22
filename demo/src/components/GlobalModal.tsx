import React from 'react';
import { createPortal } from 'react-dom';

interface GlobalModalProps {
  open: boolean;
  onClose: () => void;
  zIndex?: number;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

const GlobalModal: React.FC<GlobalModalProps> = ({
  open,
  onClose,
  zIndex = 50,
  children,
  className = '',
  overlayClassName = '',
}) => {
  if (!open) return null;
  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center z-[${zIndex}] ${overlayClassName}`}
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className={`bg-gray-800 rounded-lg shadow-lg relative ${className}`}
        style={{ maxHeight: '95vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default GlobalModal; 