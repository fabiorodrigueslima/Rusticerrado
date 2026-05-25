export default function Button({
    children,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    onClick,
    className = '',
    ...props
}) {
    const baseClass = `btn btn-${variant} btn-${size}`;
    const finalClass = `${baseClass} ${className}`;

    return (
        <button
            type={type}
            className={finalClass}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading ? (
                <>
                    <span className="spinner-small"></span>
                    Carregando...
                </>
            ) : (
                children
            )}
        </button>
    );
}