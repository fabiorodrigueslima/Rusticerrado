import { useState } from "react";
import {
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaWhatsapp,
    FaInstagram,
    FaFacebookF,
} from "react-icons/fa";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import "../styles/style.css";
import { contact, formatPhone, whatsappLink } from "../config/contact.js";
import { abrirWhatsApp, ASSUNTOS_CONTATO, mensagemContato } from "../utils/mensagemWhatsapp.js";

const FORMULARIO_VAZIO = { nome: "", assunto: "", mensagem: "" };

export default function Contato() {
    const [formData, setFormData] = useState(FORMULARIO_VAZIO);

    const [erros, setErros] = useState({});
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
        if (!formData.assunto.trim()) novosErros.assunto = "Assunto é obrigatório";
        if (!formData.mensagem.trim()) novosErros.mensagem = "Mensagem é obrigatória";

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    // O formulário abre o WhatsApp da loja com a mensagem já escrita.
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            setAlert({
                type: "error",
                message: "Por favor, preencha todos os campos obrigatórios.",
            });
            return;
        }

        abrirWhatsApp(whatsappLink(mensagemContato(formData)));

        setAlert({
            type: "success",
            message: "Abrimos o WhatsApp com a sua mensagem. É só tocar em Enviar!",
        });
        setFormData(FORMULARIO_VAZIO);
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
                                    href={whatsappLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {formatPhone()}
                                </a>
                                <p>Resposta rápida</p>
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">
                                <FaPhone />
                            </div>
                            <div>
                                <h3>Hora de Funcionamento</h3>
                            
                                <small>Segunda a sexta, 9h às 18h</small>
                            </div>
                        </div>

                        {/* Só aparece quando o e-mail da loja estiver preenchido em config/contact.js */}
                        {contact.email && (
                            <div className="info-card">
                                <div className="info-icon">
                                    <FaEnvelope />
                                </div>
                                <div>
                                    <h3>Email</h3>
                                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                </div>
                            </div>
                        )}

                        <div className="info-card">
                            <div className="info-icon">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <h3>Localização</h3>
                                <p>Brasília - DF</p>
                                <p>CEP: 71693-154</p>
                                <p>Rua 51, Lote 31, Vila Nova - São Sebastião/DF</p>
                            </div>
                        </div>

                        <div className="contato-social">
                            <h3>Siga nas redes sociais</h3>

                            <div className="contato-social-links">
                                <a
                                    href={contact.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FaInstagram /> Instagram
                                </a>

                                <a
                                    href={contact.facebook}
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
                        <p>Preencha os campos e toque em enviar: a mensagem abre pronta no WhatsApp da loja.</p>

                        <form onSubmit={handleSubmit}>
                            <Input
                                label="Nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleInputChange}
                                error={erros.nome}
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
                                    {Object.entries(ASSUNTOS_CONTATO).map(([valor, texto]) => (
                                        <option key={valor} value={valor}>{texto}</option>
                                    ))}
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
                                className="btn-full"
                            >
                                <FaWhatsapp /> Enviar pelo WhatsApp
                            </Button>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}