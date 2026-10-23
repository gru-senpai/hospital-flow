import React from 'react';

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'teal' | 'slate' | 'purple';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone = 'slate',
  dot = true,
  size = 'md',
  className = '',
}) => {
  return (
    <span className={`status-badge-pill tone-${tone} size-${size} ${className}`}>
      {dot && <span className="status-badge-dot" />}
      <span className="status-badge-text">{label}</span>
    </span>
  );
};
