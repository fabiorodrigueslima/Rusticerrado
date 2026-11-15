import { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    // Remover notificação
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, []);

    // Adicionar notificação
    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        const notification = { id, message, type };

        setNotifications(prev => [...prev, notification]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, [removeNotification]);

    // Atalhos para tipos específicos
    const success = useCallback((message, duration) => {
        return addNotification(message, 'success', duration);
    }, [addNotification]);

    const error = useCallback((message, duration) => {
        return addNotification(message, 'error', duration);
    }, [addNotification]);

    const warning = useCallback((message, duration) => {
        return addNotification(message, 'warning', duration);
    }, [addNotification]);

    const info = useCallback((message, duration) => {
        return addNotification(message, 'info', duration);
    }, [addNotification]);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
