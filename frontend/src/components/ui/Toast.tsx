import React, { useEffect } from 'react';

export default function Toast({ message, onClose, duration = 2500 }: { message: string; onClose: () => void; duration?: number }) {
  useEffect(() => {
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [duration, onClose]);

  if (!message) return null;
  return (
    <div className="fixed z-50 bottom-4 right-4">
      <div className="card p-3 shadow-card border border-gray-100 bg-white min-w-[240px]">
        <div className="text-sm text-ink-800">{message}</div>
      </div>
    </div>
  );
}
