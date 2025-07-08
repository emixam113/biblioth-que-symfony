import { useEffect, useState } from 'react';

// Types des notifications
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  id: number;
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

// Styles par type
const typeStyles = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-red-500 border-red-600',
  info: 'bg-blue-500 border-blue-600',
  warning: 'bg-yellow-500 border-yellow-600',
};

// Composant individuel
const Notification = ({message, type, duration = 5000, onClose }: NotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`w-80 mb-4 p-4 rounded-lg shadow-lg text-white border-l-4 ${typeStyles[type]} animate-slide-in`}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-4 text-white hover:text-gray-200 font-bold text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Hook personnalisé pour gérer les notifications
export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const showNotification = (message: string, type: NotificationType = 'info', duration: number = 5000) => {
    const id = Date.now();
    const newNotification: NotificationProps = {
      id,
      message,
      type,
      duration,
      onClose: () => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    };

    setNotifications(prev => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  };

  const NotificationComponent = (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );

  return { showNotification, NotificationComponent };
};

export default Notification;