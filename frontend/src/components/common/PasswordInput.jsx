import { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import './PasswordInput.css'

// Campo de senha com o botão de "olho" para mostrar ou esconder o que foi digitado.
// Aceita as mesmas propriedades de um <input>.
export function PasswordInput(props) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
        aria-pressed={visible}
        title={visible ? 'Esconder senha' : 'Mostrar senha'}
      >
        {visible ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
      </button>
    </span>
  )
}
