import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { AuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import "../styles/style.css";
import logoRusticerrado from '../assets/img/RustiCerrado.oficial.png';

export default function Cadastro() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmaSenha: '',
        telefone: '',
        termos: false
    });

    const [preview, setPreview] = useState(null);

    const [, setErros] = useState({});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 📸 FOTO
    const handleFotoChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                setPreview(reader.result);
            };

            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validarFormulario = () => {
        const novosErros = {};

        if (!formData.nome.trim()) novosErros.nome = 'Nome obrigatório';
        if (!formData.email.trim()) novosErros.email = 'Email obrigatório';
        if (formData.senha.length < 8) novosErros.senha = 'Mínimo 8 caracteres';
        if (formData.senha !== formData.confirmaSenha)
            novosErros.confirmaSenha = 'Senhas não coincidem';
        if (!formData.termos) novosErros.termos = 'Aceite os termos';

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            setAlert({ type: 'error', message: 'Preencha corretamente.' });
            return;
        }

        setLoading(true);

        try {
            const response = await authService.cadastro({
                nome: formData.nome,
                email: formData.email,
                telefone: formData.telefone,
                senha: formData.senha
            });

            login(response.usuario || response.user, response.token);

            setAlert({
                type: 'success',
                message: 'Cadastro realizado!'
            });

            setTimeout(() => {
                navigate('/minha-conta');
            }, 1000);

        } catch {
            setAlert({
                type: 'error',
                message: 'Erro ao cadastrar'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cadastro-page">

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <section className="section cadastro-content">
                <div className="container">
                    <div className="cadastro-container">

                        {/* ESQUERDA */}
                        <div className="cadastro-info">
                            <img src={logoRusticerrado} alt="logo" />
                            <h2>Crie sua conta</h2>
                        </div>

                        {/* DIREITA */}
                        <div className="cadastro-form-container">
                            <form onSubmit={handleSubmit}>

                                <h3>Cadastrar</h3>

                                {/* FOTO */}
                                <div className="input-group">
                                    <label>FOTO DE PERFIL</label>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFotoChange}
                                    />

                                    {preview && (
                                        <img
                                            src={preview}
                                            alt="preview"
                                            className="preview-img"
                                        />
                                    )}
                                </div>

                                {/* NOME */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="nome"
                                        placeholder="Nome"
                                        value={formData.nome}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* EMAIL */}
                                <div className="input-group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* TELEFONE */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="telefone"
                                        placeholder="Telefone"
                                        value={formData.telefone}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* SENHA */}
                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="senha"
                                        placeholder="Senha"
                                        value={formData.senha}
                                        onChange={handleInputChange}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                {/* CONFIRMAR */}
                                <div className="input-group">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmaSenha"
                                        placeholder="Confirmar senha"
                                        value={formData.confirmaSenha}
                                        onChange={handleInputChange}
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                {/* TERMOS */}
                                <label className="termos">
                                    <input
                                        type="checkbox"
                                        name="termos"
                                        onChange={handleInputChange}
                                    />
                                    Aceito os termos
                                </label>

                                <Button type="submit" loading={loading}>
                                    Criar Conta
                                </Button>

                                <p>
                                    Já tem conta? <Link to="/login">Entrar</Link>
                                </p>

                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
