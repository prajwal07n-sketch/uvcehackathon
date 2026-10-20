import React from 'react';
import StudentDashboard from '@/components/StudentDashboard';

export const metadata = {
  title: 'Student Dashboard | Campus-Share',
  description: 'Manage your active borrowed hardware, peer lending requests, uploaded CAD assets, and campus trust score.',
};

export default function DashboardPage() {
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <StudentDashboard />
    </div>
  );
}
