// Remix Icon helper — renders <i class={"ri-" + name} />
// Usage: <RemixIcon name="dashboard-line" size={18} className="text-gray-500" />

import React from 'react';

interface IconProps {
  name: string; // e.g. "dashboard-line"
  size?: number;
  className?: string;
}

export const RemixIcon: React.FC<IconProps> = ({ name, size = 18, className = '' }) => (
  <i className={`ri-${name}`} style={{ fontSize: size }} className={className} />
);

// Pre-named exports for convenience
export const Icon = {
  dashboard: (p: Omit<IconProps, 'name'>) => <RemixIcon name="dashboard-line" {...p} />,
  fileList: (p: Omit<IconProps, 'name'>) => <RemixIcon name="file-list-3-line" {...p} />,
  user: (p: Omit<IconProps, 'name'>) => <RemixIcon name="user-line" {...p} />,
  settings: (p: Omit<IconProps, 'name'>) => <RemixIcon name="settings-3-line" {...p} />,
  barChart: (p: Omit<IconProps, 'name'>) => <RemixIcon name="bar-chart-2-line" {...p} />,
  bankCard: (p: Omit<IconProps, 'name'>) => <RemixIcon name="bank-card-line" {...p} />,
  links: (p: Omit<IconProps, 'name'>) => <RemixIcon name="links-line" {...p} />,
  notification: (p: Omit<IconProps, 'name'>) => <RemixIcon name="notification-3-line" {...p} />,
  logout: (p: Omit<IconProps, 'name'>) => <RemixIcon name="logout-box-r-line" {...p} />,
  receipt: (p: Omit<IconProps, 'name'>) => <RemixIcon name="file-text-line" {...p} />,
  wallet: (p: Omit<IconProps, 'name'>) => <RemixIcon name="wallet-3-line" {...p} />,
  money: (p: Omit<IconProps, 'name'>) => <RemixIcon name="money-dollar-circle-line" {...p} />,
  percent: (p: Omit<IconProps, 'name'>) => <RemixIcon name="percent-line" {...p} />,
  time: (p: Omit<IconProps, 'name'>) => <RemixIcon name="time-line" {...p} />,
  add: (p: Omit<IconProps, 'name'>) => <RemixIcon name="add-line" {...p} />,
  download: (p: Omit<IconProps, 'name'>) => <RemixIcon name="download-line" {...p} />,
  government: (p: Omit<IconProps, 'name'>) => <RemixIcon name="government-line" {...p} />,
  search: (p: Omit<IconProps, 'name'>) => <RemixIcon name="search-line" {...p} />,
};

export default RemixIcon;
