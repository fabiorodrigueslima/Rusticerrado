import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { FaCheckCircle, FaBox, FaEnvelope } from 'react-icons/fa';
import "../styles/style.css"

export default function Sucesso() {
    const pedidoNumero = useMemo(() => Math.floor(Math.random() * 1000000), []);
    const dataAtual = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

    return (
        <div className="sucesso-page">
            <section className="section sucesso-content">
                <div className="container">
                    <div className="sucesso-container">
                        {/* ÍCONE DE SUCESSO */}
                        <div className="sucesso-icon">
                            <FaCheckCircle />
                        </div>

                        {/* MENSAGEM PRINCIPAL */}
                        <h1>Pedido Confirmado!</h1>
                        <p className="sucesso-subtitle">
                            Obrigado pela sua compra. Seu pedido foi processado com sucesso.
                        </p>

                        {/* INFORMAÇÕES DO PEDIDO */}
                        <div className="pedido-info">
                            <div className="info-item">
                                <span className="info-label">Número do Pedido:</span>
                                <span className="info-valor">#{pedidoNumero}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Data:</span>
                                <span className="info-valor">{dataAtual}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Status:</span>
                                <span className="info-valor status-processando">Processando</span>
                            </div>
                        </div>

                        {/* PRÓXIMOS PASSOS */}
                        <div className="proximos-passos">
                            <h3>Próximos Passos</h3>
                            <div className="passos-list">
                                <div className="passo">
                                    <div className="passo-numero">1</div>
                                    <div className="passo-content">
                                        <h4>Confirmação por Email</h4>
                                        <p>Você receberá um email de confirmação com os detalhes do seu pedido.</p>
                                    </div>
                                </div>

                                <div className="passo">
                                    <div className="passo-numero">2</div>
                                    <div className="passo-content">
                                        <h4>Preparação</h4>
                                        <p>Nosso time preparará sua peça com muito cuidado.</p>
                                    </div>
                                </div>

                                <div className="passo">
                                    <div className="passo-numero">3</div>
                                    <div className="passo-content">
                                        <h4>Envio</h4>
                                        <p>Você receberá um código de rastreamento assim que o pedido for despachado.</p>
                                    </div>
                                </div>

                                <div className="passo">
                                    <div className="passo-numero">4</div>
                                    <div className="passo-content">
                                        <h4>Entrega</h4>
                                        <p>Sua peça chegará embalada com segurança no endereço informado.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* INFORMAÇÕES ADICIONAIS */}
                        <div className="info-adicionais">
                            <div className="info-box">
                                <FaBox className="info-icon" />
                                <h4>Rastreamento</h4>
                                <p>Acompanhe seu pedido em tempo real através do seu perfil.</p>
                            </div>

                            <div className="info-box">
                                <FaEnvelope className="info-icon" />
                                <h4>Contato</h4>
                                <p>Dúvidas? Entre em contato conosco via email ou WhatsApp.</p>
                            </div>
                        </div>

                        {/* BOTÕES DE AÇÃO */}
                        <div className="sucesso-acoes">
                            <Link to="/pedidos" className="btn btn-primary">
                                Ver Meus Pedidos
                            </Link>
                            <Link to="/loja" className="btn btn-outline">
                                Continuar Comprando
                            </Link>
                        </div>

                        {/* MENSAGEM FINAL */}
                        <div className="sucesso-footer">
                            <p>
                                Agradecemos sua confiança! Qualquer dúvida, entre em contato conosco.
                            </p>
                            <p className="contato-info">
                                📧 contato@rusticerrado.com.br | 📱 (61) 99995-2341
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
