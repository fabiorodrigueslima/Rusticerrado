import { FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { useEffect } from 'react';

export default function Alert({ type = 'info', message, onClose, autoClose = true, duration = 5000 }) {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [autoClose, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheckCircle />;
            case 'error':
                return <FaExclamationCircle />;
            case 'info':
                return <FaInfoCircle />;
            default:
                return <FaInfoCircle />;
        }
    };

    return (
        <div className={`alert alert-${type}`}>
            <div className="alert-icon">
                {getIcon()}
            </div>
            <div className="alert-message">
                {message}
            </div>
            <button
                className="alert-close"
                onClick={onClose}
                aria-label="Fechar alerta"
            >
                <FaTimes />
            </button>
        </div>
    );
}