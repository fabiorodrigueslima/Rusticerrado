import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaWhatsapp } from 'react-icons/fa';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import "../styles/style.css"
import { whatsappLink } from "../config/contact.js";
import chaveiroLogo from "../assets/img/Chaveiro Personalizado.jpeg";
import chaveiroInicial from "../assets/img/Chaveiro Personalizado1.jpeg";
import { IMAGEM_PADRAO, listarProdutos } from "../services/catalogo";
import { CATEGORIA_PERSONALIZADOS, exemplosDosProdutos, LIMITE_EXEMPLOS } from "../utils/exemplosPersonalizados.js";
import { abrirWhatsApp, mensagemPersonalizado, TIPOS_PERSONALIZADO } from "../utils/mensagemWhatsapp.js";

// Exemplos fixos: aparecem enquanto não houver peças na categoria "Personalizados" do painel.
const EXEMPLOS_FIXOS = [
    {
        chave: 'chaveiro-logo',
        imagem: chaveiroLogo,
        alt: 'Chaveiro redondo com a logo de um cliente',
        titulo: 'Chaveiro com a Logo da sua Empresa',
        texto: 'Ótimo para brindes, eventos e projetos.'
    },
    {
        chave: 'chaveiro-inicial',
        imagem: chaveiroInicial,
        alt: 'Chaveiro em resina no formato da letra K',
        titulo: 'Chaveiro com Inicial',
        texto: 'A letra que você escolher, nas cores que você quiser.'
    }
];

const FORMULARIO_VAZIO = {
    nome: '',
    tipo_produto: '',
    descricao: '',
    tamanho: '',
    cores: '',
    orcamento_aproximado: ''
};

export default function Personalizados() {
    const [formData, setFormData] = useState(FORMULARIO_VAZIO);
    const [exemplos, setExemplos] = useState(EXEMPLOS_FIXOS);

    // Peças da categoria "Personalizados" cadastradas no painel substituem os exemplos fixos.
    useEffect(() => {
        const controller = new AbortController();
        listarProdutos({ categoria: CATEGORIA_PERSONALIZADOS, ordem: 'newest', limite: LIMITE_EXEMPLOS * 2 }, controller.signal)
            .then((lista) => {
                const doPainel = exemplosDosProdutos(lista, IMAGEM_PADRAO);
                if (doPainel.length > 0) setExemplos(doPainel);
            })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    const [erros, setErros] = useState({});
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

    const validarFormulario = () => {
        const novosErros = {};

        if (!formData.nome.trim()) novosErros.nome = 'Nome é obrigatório';
        if (!formData.tipo_produto.trim()) novosErros.tipo_produto = 'Tipo de produto é obrigatório';
        if (!formData.descricao.trim()) novosErros.descricao = 'Descrição é obrigatória';

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    // O formulário abre o WhatsApp da loja com o pedido já escrito.
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            setAlert({
                type: 'error',
                message: 'Por favor, preencha todos os campos obrigatórios.'
            });
            return;
        }

        abrirWhatsApp(whatsappLink(mensagemPersonalizado(formData)));

        setAlert({
            type: 'success',
            message: 'Abrimos o WhatsApp com o seu pedido. Toque em Enviar e, se quiser, mande fotos de referência na conversa.'
        });
        setFormData(FORMULARIO_VAZIO);
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
                            <h3>Prazo Combinado</h3>
                            <p>Você sabe antes de fechar o pedido quando a sua peça fica pronta.</p>
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
                                {exemplos.map((exemplo) => {
                                    const conteudo = (
                                        <>
                                            <img src={exemplo.imagem} alt={exemplo.alt} loading="lazy" />
                                            <h4>{exemplo.titulo}</h4>
                                            {exemplo.texto && <p>{exemplo.texto}</p>}
                                        </>
                                    );
                                    return exemplo.link ? (
                                        <Link key={exemplo.chave} to={exemplo.link} className="exemplo-card">
                                            {conteudo}
                                        </Link>
                                    ) : (
                                        <div key={exemplo.chave} className="exemplo-card">
                                            {conteudo}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* FORMULÁRIO */}
                        <div className="personalizados-form">
                            <h2>Solicite seu Produto Personalizado</h2>
                            <p className="form-subtitle">
                                Conte sua ideia e toque em enviar: o pedido abre pronto no WhatsApp da loja,
                                onde combinamos os detalhes e o orçamento.
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
                                        {Object.entries(TIPOS_PERSONALIZADO).map(([valor, texto]) => (
                                            <option key={valor} value={valor}>{texto}</option>
                                        ))}
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
                                    label="Madeira e Cores"
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

                                <p className="form-hint">
                                    Tem uma foto ou desenho de referência? Mande na conversa do WhatsApp depois de enviar.
                                </p>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="large"
                                    className="btn-full"
                                >
                                    <FaWhatsapp /> Enviar pelo WhatsApp
                                </Button>
                            </form>

                            <div className="form-info">
                                <p>
                                    <strong>Próximos passos:</strong> depois que você enviar a mensagem no WhatsApp,
                                    a RustiCerrado responde para combinar os detalhes e passar o orçamento.
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
                            href={whatsappLink("Olá! Quero fazer um orçamento de uma peça personalizada.")}
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