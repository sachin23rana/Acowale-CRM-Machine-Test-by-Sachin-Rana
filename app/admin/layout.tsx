import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acodash - CRM Admin Panel',
  description: 'Manage and analyze customer feedback for Acowale CRM.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
