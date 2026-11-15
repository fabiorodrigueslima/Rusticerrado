import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import "../styles/style.css"
import logoRusticerrado from '../assets/img/RustiCerrado.oficial.png';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        email: '',
        senha: ''
    });

    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [lembrarMe, setLembrarMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [validacoes, setValidacoes] = useState({
        email: false,
        senha: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const novoValor = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: novoValor
        }));

        // Validação em tempo real
        validarCampo(name, novoValor);

        if (erros[name]) {
            setErros(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validarCampo = (nome, valor) => {
        let isValido = false;

        switch (nome) {
            case 'email':
                isValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
                break;
            case 'senha':
                isValido = valor.length >= 6;
                break;
            default:
                break;
        }

        setValidacoes(prev => ({
            ...prev,
            [nome]: isValido
        }));
    };

    const validarFormulario = () => {
        const novosErros = {};

        if (!formData.email.trim()) {
            novosErros.email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            novosErros.email = 'Email inválido';
        }

        if (!formData.senha.trim()) {
            novosErros.senha = 'Senha é obrigatória';
        } else if (formData.senha.length < 6) {
            novosErros.senha = 'Senha deve ter no mínimo 6 caracteres';
        }

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            setAlert({
                type: 'error',
                message: 'Por favor, preencha todos os campos corretamente.'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await authService.login(formData.email, formData.senha);
            login(response.usuario || response.user, response.token);

            setAlert({
                type: 'success',
                message: 'Login realizado com sucesso!'
            });

            setTimeout(() => {
                navigate('/perfil');
            }, 1000);
        } catch (error) {
            setAlert({
                type: 'error',
                message: error.message || 'Email ou senha incorretos. Tente novamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <section className="section login-content">
                <div className="container">
                    <div className="login-container">
                        {/* COLUNA ESQUERDA - INFO */}
                        <div className="login-info">
                            <div className="login-logo">
                                <img src={logoRusticerrado} alt="RustiCerrado" />
                            </div>
                            <h2>Bem-vindo ao RustiCerrado</h2>
                            <p>
                                Acesse sua conta para acompanhar seus pedidos,
                                salvar seus produtos favoritos e muito mais.
                            </p>
                            <div className="login-benefits">
                                <div className="benefit">
                                    <span>✓</span>
                                    <p>Acompanhe seus pedidos</p>
                                </div>
                                <div className="benefit">
                                    <span>✓</span>
                                    <p>Acesso rápido ao checkout</p>
                                </div>
                                <div className="benefit">
                                    <span>✓</span>
                                    <p>Histórico de compras</p>
                                </div>
                            </div>
                        </div>

                        {/* COLUNA DIREITA - FORMULÁRIO */}
                        <div className="login-form-container">
                            <form onSubmit={handleSubmit} className="login-form">
                                <h3>Faça Login</h3>

                                {/* Campo Email */}
                                <div className="input-group">
                                    <label>
                                        EMAIL
                                        <span className="required">*</span>
                                        {validacoes.email && <FaCheck className="icon-check" />}
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={erros.email ? 'error' : ''}
                                    />
                                    {erros.email && <span className="error-message">{erros.email}</span>}
                                </div>

                                {/* Campo Senha */}
                                <div className="input-group password-group">
                                    <label>
                                        SENHA
                                        <span className="required">*</span>
                                        {validacoes.senha && <FaCheck className="icon-check" />}
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="senha"
                                            placeholder="Sua senha"
                                            value={formData.senha}
                                            onChange={handleInputChange}
                                            className={erros.senha ? 'error' : ''}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {erros.senha && <span className="error-message">{erros.senha}</span>}
                                </div>

                                {/* Opções */}
                                <div className="form-options">
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            checked={lembrarMe}
                                            onChange={(e) => setLembrarMe(e.target.checked)}
                                        />
                                        <span>Lembrar-me neste dispositivo</span>
                                    </label>
                                    <Link to="/recuperar-senha" className="link-recuperar">
                                        Esqueceu a senha?
                                    </Link>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="large"
                                    loading={loading}
                                    className="btn-full"
                                >
                                    Entrar
                                </Button>

                                <div className="login-divider">
                                    <span>ou</span>
                                </div>

                                <div className="login-social">
                                    <button type="button" className="btn-social">
                                        Entrar com Google
                                    </button>
                                    <button type="button" className="btn-social">
                                        Entrar com Facebook
                                    </button>
                                </div>

                                <div className="login-footer">
                                    <p>Não tem conta?</p>
                                    <Link to="/cadastro" className="link-cadastro">
                                        Criar nova conta
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
