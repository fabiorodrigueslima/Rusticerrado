import { FaTimes } from 'react-icons/fa';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Fechar modal"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}