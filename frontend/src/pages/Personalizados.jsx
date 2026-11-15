import { useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import "../styles/style.css"

export default function Personalizados() {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        tipo_produto: '',
        descricao: '',
        tamanho: '',
        cores: '',
        orcamento_aproximado: '',
        arquivo: null
    });

    const [erros, setErros] = useState({});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (erros[name]) {
            setErros(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            arquivo: file
        }));
    };

    const validarFormulario = () => {
        const novosErros = {};

        if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
        if (!formData.email.trim()) novosErros.email = 'Email é obrigatório';
        if (!formData.telefone.trim()) novosErros.telefone = 'Telefone é obrigatório';
        if (!formData.tipo_produto.trim()) novosErros.tipo_produto = 'Tipo de produto é obrigatório';
        if (!formData.descricao.trim()) novosErros.descricao = 'Descrição é obrigatória';

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            setAlert({
                type: 'error',
                message: 'Por favor, preencha todos os campos obrigatórios.'
            });
            return;
        }

        setLoading(true);

        try {
            // Simular envio
            await new Promise(resolve => setTimeout(resolve, 2000));

            setAlert({
                type: 'success',
                message: 'Solicitação enviada com sucesso! Entraremos em contato em breve.'
            });

            setFormData({
                nome: '',
                email: '',
                telefone: '',
                tipo_produto: '',
                descricao: '',
                tamanho: '',
                cores: '',
                orcamento_aproximado: '',
                arquivo: null
            });
        } catch (error) {
            setAlert({
                type: 'error',
                message: 'Erro ao enviar solicitação. Tente novamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="personalizados-page">
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* HERO */}
            <section className="hero">
                <div className="hero-overlay"></div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <h1>Produtos Personalizados</h1>
                        <p>Crie sua peça única e exclusiva com a RustiCerrado</p>
                    </div>
                </div>
            </section>

            {/* BENEFÍCIOS */}
            <section className="section personalizados-beneficios">
                <div className="container">
                    <h2>Por que escolher um produto personalizado?</h2>
                    <div className="beneficios-grid">
                        <div className="beneficio-card">
                            <FaCheckCircle className="beneficio-icon" />
                            <h3>100% Único</h3>
                            <p>Sua peça será criada especialmente para você, sem cópias.</p>
                        </div>
                        <div className="beneficio-card">
                            <FaCheckCircle className="beneficio-icon" />
                            <h3>Qualidade Premium</h3>
                            <p>Utilizamos os melhores materiais e técnicas artesanais.</p>
                        </div>
                        <div className="beneficio-card">
                            <FaCheckCircle className="beneficio-icon" />
                            <h3>Consultoria Gratuita</h3>
                            <p>Nossos artesãos ajudam a transformar sua ideia em realidade.</p>
                        </div>
                        <div className="beneficio-card">
                            <FaCheckCircle className="beneficio-icon" />
                            <h3>Prazo Garantido</h3>
                            <p>Entrega dentro do prazo combinado ou seu dinheiro de volta.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FORMULÁRIO */}
            <section className="section personalizados-form-section">
                <div className="container">
                    <div className="personalizados-container">
                        {/* EXEMPLOS */}
                        <div className="personalizados-exemplos">
                            <h2>Exemplos de Personalizações</h2>
                            <div className="exemplos-grid">
                                <div className="exemplo-card">
                                    <img src="/img/exemplo1.jpg" alt="Exemplo 1" />
                                    <h4>Tábua com Iniciais</h4>
                                    <p>Gravação de iniciais em madeira e resina</p>
                                </div>
                                <div className="exemplo-card">
                                    <img src="/img/exemplo2.jpg" alt="Exemplo 2" />
                                    <h4>Cores Personalizadas</h4>
                                    <p>Escolha as cores que combinam com seu estilo</p>
                                </div>
                                <div className="exemplo-card">
                                    <img src="/img/exemplo3.jpg" alt="Exemplo 3" />
                                    <h4>Tamanhos Especiais</h4>
                                    <p>Dimensões customizadas conforme sua necessidade</p>
                                </div>
                            </div>
                        </div>

                        {/* FORMULÁRIO */}
                        <div className="personalizados-form">
                            <h2>Solicite seu Produto Personalizado</h2>
                            <p className="form-subtitle">
                                Preencha o formulário abaixo com os detalhes do seu projeto.
                                Entraremos em contato para confirmar e enviar um orçamento.
                            </p>

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
                                    <label htmlFor="tipo_produto" className="form-label">
                                        Tipo de Produto <span className="required">*</span>
                                    </label>
                                    <select
                                        id="tipo_produto"
                                        name="tipo_produto"
                                        value={formData.tipo_produto}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        <option value="">Selecione um tipo</option>
                                        <option value="tabua">Tábua de Churrasco</option>
                                        <option value="bandeja">Bandeja</option>
                                        <option value="vaso">Vaso</option>
                                        <option value="luminaria">Luminária</option>
                                        <option value="caixa">Caixa Decorativa</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                    {erros.tipo_produto && <span className="form-error">{erros.tipo_produto}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="descricao" className="form-label">
                                        Descrição do Projeto <span className="required">*</span>
                                    </label>
                                    <textarea
                                        id="descricao"
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        placeholder="Descreva sua ideia em detalhes..."
                                        rows="5"
                                        className={`form-textarea ${erros.descricao ? 'input-error' : ''}`}
                                    />
                                    {erros.descricao && <span className="form-error">{erros.descricao}</span>}
                                </div>

                                <Input
                                    label="Tamanho Aproximado"
                                    name="tamanho"
                                    placeholder="Ex: 40cm x 25cm"
                                    value={formData.tamanho}
                                    onChange={handleInputChange}
                                />

                                <Input
                                    label="Cores Desejadas"
                                    name="cores"
                                    placeholder="Ex: Madeira clara com resina azul"
                                    value={formData.cores}
                                    onChange={handleInputChange}
                                />

                                <Input
                                    label="Orçamento Aproximado"
                                    name="orcamento_aproximado"
                                    placeholder="Ex: R$ 200 - R$ 300"
                                    value={formData.orcamento_aproximado}
                                    onChange={handleInputChange}
                                />

                                <div className="form-group">
                                    <label htmlFor="arquivo" className="form-label">
                                        Anexar Referência (Imagem ou Desenho)
                                    </label>
                                    <input
                                        type="file"
                                        id="arquivo"
                                        name="arquivo"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                        className="form-file"
                                    />
                                    <p className="form-hint">Máximo 5MB. Formatos: JPG, PNG, PDF</p>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="large"
                                    loading={loading}
                                    className="btn-full"
                                >
                                    Enviar Solicitação
                                </Button>
                            </form>

                            <div className="form-info">
                                <p>
                                    <strong>Próximos passos:</strong> Após enviar sua solicitação,
                                    nossa equipe entrará em contato para discutir os detalhes e enviar um orçamento personalizado.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section cta-personalizados">
                <div className="container">
                    <div className="cta-box">
                        <h2>Dúvidas sobre Personalização?</h2>
                        <p>Entre em contato conosco via WhatsApp para conversar com nossa equipe.</p>
                        <a
                            href="https://wa.me/5561999952341"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                        >
                            Conversar no WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}