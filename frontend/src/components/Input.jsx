import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Input({
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    error,
    required = false,
    disabled = false,
    name,
    id,
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={id || name} className="form-label">
                    {label}
                    {required && <span className="required">*</span>}
                </label>
            )}

            <div className="input-wrapper">
                <input
                    type={inputType}
                    id={id || name}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`form-input ${error ? 'input-error' : ''}`}
                    {...props}
                />

                {type === 'password' && (
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                )}
            </div>

            {error && (
                <span className="form-error">{error}</span>
            )}
        </div>
    );
}