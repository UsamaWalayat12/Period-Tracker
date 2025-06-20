import { NotificationCenter } from '@/components/notifications/notification-center';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <NotificationCenter />
    </div>
  );
} 