import { useState } from "react";
import {
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaWhatsapp,
    FaInstagram,
    FaFacebookF,
    FaPaperPlane,
} from "react-icons/fa";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "../styles/style.css";

export default function Contato() {
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        telefone: "",
        assunto: "",
        mensagem: "",
    });

    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (erros[name]) {
            setErros((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validarFormulario = () => {
        const novosErros = {};

        if (!formData.nome.trim()) novosErros.nome = "Nome é obrigatório";
        if (!formData.email.trim()) novosErros.email = "Email é obrigatório";
        if (!formData.telefone.trim()) novosErros.telefone = "Telefone é obrigatório";
        if (!formData.assunto.trim()) novosErros.assunto = "Assunto é obrigatório";
        if (!formData.mensagem.trim()) novosErros.mensagem = "Mensagem é obrigatória";

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            setAlert({
                type: "error",
                message: "Por favor, preencha todos os campos obrigatórios.",
            });
            return;
        }

        setLoading(true);

        setTimeout(() => {
            setAlert({
                type: "success",
                message: "Mensagem enviada com sucesso!",
            });

            setFormData({
                nome: "",
                email: "",
                telefone: "",
                assunto: "",
                mensagem: "",
            });

            setLoading(false);
        }, 1200);
    };

    return (
        <div className="contato-page">
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <section className="contato-hero">
                <div className="container contato-hero-content">
                    <span>Atendimento RustiCerrado</span>
                    <h1>Fale Conosco</h1>
                    <p>
                        Tire dúvidas sobre produtos, pedidos, peças personalizadas ou faça
                        seu orçamento.
                    </p>
                </div>
            </section>

            <section className="contato-section">
                <div className="container contato-container">
                    <div className="contato-info">
                        <h2>Informações de Contato</h2>
                        <p className="contato-info-subtitle">
                            Escolha a melhor forma de falar com a RustiCerrado.
                        </p>

                        <div className="info-card">
                            <div className="info-icon">
                                <FaWhatsapp />
                            </div>
                            <div>
                                <h3>WhatsApp</h3>
                                <a
                                    href="https://wa.me/5561999952341"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    (61) 99995-2341
                                </a>
                                <p>Resposta rápida</p>
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">
                                <FaPhone />
                            </div>
                            <div>
                                <h3>Telefone</h3>
                                <p>(61) 99995-2341</p>
                                <small>Segunda a sexta, 9h às 18h</small>
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">
                                <FaEnvelope />
                            </div>
                            <div>
                                <h3>Email</h3>
                                <p>contato@rusticerrado.com.br</p>
                                <small>Resposta em até 24h</small>
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <h3>Localização</h3>
                                <p>Brasília - DF</p>
                                <small>Atendimento para todo o Brasil</small>
                            </div>
                        </div>

                        <div className="contato-social">
                            <h3>Siga nas redes sociais</h3>

                            <div className="contato-social-links">
                                <a
                                    href="https://www.instagram.com/rusticerrado/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FaInstagram /> Instagram
                                </a>

                                <a
                                    href="https://www.facebook.com/rusticerrado"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FaFacebookF /> Facebook
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="contato-form">
                        <h2>Envie uma Mensagem</h2>
                        <p>Preencha os dados abaixo que entraremos em contato.</p>

                        <form onSubmit={handleSubmit}>
                            <Input
                                label="Nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleInputChange}
                                error={erros.nome}
                                required
                            />

                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                error={erros.email}
                                required
                            />

                            <Input
                                label="Telefone"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleInputChange}
                                error={erros.telefone}
                                required
                            />

                            <div className="form-group">
                                <label htmlFor="assunto" className="form-label">
                                    Assunto <span className="required">*</span>
                                </label>

                                <select
                                    id="assunto"
                                    name="assunto"
                                    value={formData.assunto}
                                    onChange={handleInputChange}
                                    className={`form-select ${erros.assunto ? "input-error" : ""}`}
                                >
                                    <option value="">Selecione um assunto</option>
                                    <option value="produto">Dúvida sobre produto</option>
                                    <option value="pedido">Dúvida sobre pedido</option>
                                    <option value="personalizado">Produto personalizado</option>
                                    <option value="orcamento">Orçamento</option>
                                    <option value="outro">Outro</option>
                                </select>

                                {erros.assunto && (
                                    <span className="form-error">{erros.assunto}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="mensagem" className="form-label">
                                    Mensagem <span className="required">*</span>
                                </label>

                                <textarea
                                    id="mensagem"
                                    name="mensagem"
                                    value={formData.mensagem}
                                    onChange={handleInputChange}
                                    placeholder="Digite sua mensagem aqui..."
                                    rows="6"
                                    className={`form-textarea ${erros.mensagem ? "input-error" : ""}`}
                                />

                                {erros.mensagem && (
                                    <span className="form-error">{erros.mensagem}</span>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="large"
                                loading={loading}
                                className="btn-full"
                            >
                                <FaPaperPlane /> Enviar Mensagem
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}