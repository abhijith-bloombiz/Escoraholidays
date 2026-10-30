import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 300,
        backgroundColor: '#121316',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '0.9rem 1.4rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        maxWidth: '420px'
      }}
    >
      <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          padding: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          marginLeft: 'auto'
        }}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
