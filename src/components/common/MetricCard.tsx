import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  subtext?: string;
  icon: LucideIcon;
  tone?: 'blue' | 'teal' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
  };
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  subtext,
  icon: Icon,
  tone = 'blue',
  trend,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`operational-metric-card tone-${tone} ${onClick ? 'is-interactive' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
        <div className={`metric-icon-box tone-${tone}`}>
          <Icon size={19} />
        </div>
      </div>

      <div className="metric-value-row">
        <span className="metric-main-value">{value}</span>
        {subValue && <span className="metric-sub-value">/ {subValue}</span>}
      </div>

      {(subtext || trend) && (
        <div className="metric-footer-row">
          {trend && (
            <span className={`metric-trend-pill trend-${trend.direction}`}>
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.direction === 'neutral' && '•'} {trend.text}
            </span>
          )}
          {subtext && <span className="metric-subtext">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
