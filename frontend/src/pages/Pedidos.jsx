import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import "../styles/style.css"

export default function Pedidos() {
    const { user } = useContext(AuthContext);
    const [filtro, setFiltro] = useState('todos');
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregarPedidos() {
            try {
                const data = await api.get("/compras/minhas");
                setPedidos(data);
            } catch (error) {
                console.error("Erro ao buscar pedidos:", error);
                setErro("Não foi possível carregar seus pedidos.");
            } finally {
                setLoading(false);
            }
        }

        carregarPedidos();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'entregue':
                return <FaCheckCircle />;
            case 'enviado':
                return <FaTruck />;
            case 'processando':
            case 'pendente':
                return <FaBox />;
            default:
                return <FaBox />;
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            'entregue': 'Entregue',
            'enviado': 'Enviado',
            'preparando': 'Preparando',
            'processando': 'Processando',
            'pendente': 'Pendente',
            'pago': 'Pago',
            'cancelado': 'Cancelado'
        };
        return labels[status] || status;
    };

    const pedidosFiltrados = filtro === 'todos'
        ? pedidos
        : filtro === 'processando'
            ? pedidos.filter(p => ['pendente', 'processando', 'preparando'].includes(p.status))
            : pedidos.filter(p => p.status === filtro);

    if (!user) {
        return (
            <ProtectedRoute>
                <div>Carregando...</div>
            </ProtectedRoute>
        );
    }

    if (loading) {
        return <p className="compras-loading">Carregando pedidos...</p>;
    }

    return (
        <div className="pedidos-page">
            {/* HEADER */}
            <section className="pedidos-header">
                <div className="container">
                    <h1>Meus Pedidos</h1>
                    <p>Acompanhe o status de todos os seus pedidos</p>
                </div>
            </section>

            {/* CONTEÚDO */}
            <section className="section pedidos-content">
                <div className="container">
                    {/* FILTROS */}
                    <div className="pedidos-filtros">
                        <button
                            className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
                            onClick={() => setFiltro('todos')}
                        >
                            Todos ({pedidos.length})
                        </button>
                        <button
                            className={`filtro-btn ${filtro === 'processando' ? 'active' : ''}`}
                            onClick={() => setFiltro('processando')}
                        >
                            Processando ({pedidos.filter(p => ['pendente', 'processando', 'preparando'].includes(p.status)).length})
                        </button>
                        <button
                            className={`filtro-btn ${filtro === 'enviado' ? 'active' : ''}`}
                            onClick={() => setFiltro('enviado')}
                        >
                            Enviado ({pedidos.filter(p => p.status === 'enviado').length})
                        </button>
                        <button
                            className={`filtro-btn ${filtro === 'entregue' ? 'active' : ''}`}
                            onClick={() => setFiltro('entregue')}
                        >
                            Entregue ({pedidos.filter(p => p.status === 'entregue').length})
                        </button>
                    </div>

                    {/* LISTA DE PEDIDOS */}
                    <div className="pedidos-list">
                        {erro ? (
                            <div className="no-pedidos">
                                <p>{erro}</p>
                            </div>
                        ) : pedidosFiltrados.length > 0 ? (
                            pedidosFiltrados.map(pedido => (
                                <div key={pedido.id} className="pedido-card-expanded">
                                    <div className="pedido-header-expanded">
                                        <div className="pedido-numero-status">
                                            <h3>#{pedido.id}</h3>
                                            <span className={`pedido-status status-${pedido.status}`}>
                                                {getStatusIcon(pedido.status)}
                                                {getStatusLabel(pedido.status)}
                                            </span>
                                        </div>
                                        <div className="pedido-data-total">
                                            <p className="pedido-data">
                                                {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                                            </p>
                                            <p className="pedido-total">{formatPrice(pedido.total)}</p>
                                        </div>
                                    </div>

                                    <div className="pedido-timeline">
                                        <div className={`timeline-item ${['pendente', 'processando', 'preparando', 'enviado', 'entregue'].includes(pedido.status) ? 'completed' : ''}`}>
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-label">
                                                <strong>Pedido Confirmado</strong>
                                                <p>Seu pedido foi recebido</p>
                                            </div>
                                        </div>

                                        <div className={`timeline-item ${['preparando', 'enviado', 'entregue'].includes(pedido.status) ? 'completed' : ''}`}>
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-label">
                                                <strong>Preparação</strong>
                                                <p>Estamos preparando sua peça</p>
                                            </div>
                                        </div>

                                        <div className={`timeline-item ${pedido.status === 'enviado' || pedido.status === 'entregue' ? 'completed' : ''}`}>
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-label">
                                                <strong>Enviado</strong>
                                                <p>Seu pedido está a caminho</p>
                                                {pedido.rastreamento && (
                                                    <p className="rastreamento">
                                                        Rastreamento: <strong>{pedido.rastreamento}</strong>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`timeline-item ${pedido.status === 'entregue' ? 'completed' : ''}`}>
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-label">
                                                <strong>Entregue</strong>
                                                <p>Sua peça chegou!</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pedido-footer">
                                        <p>Frete: <strong>{formatPrice(pedido.frete || 0)}</strong></p>
                                        <div className="pedido-acoes">
                                            <button className="btn btn-outline btn-small">
                                                Ver Detalhes
                                            </button>
                                            {pedido.rastreamento && (
                                                <button className="btn btn-outline btn-small">
                                                    Rastrear
                                                </button>
                                            )}
                                            <button className="btn btn-outline btn-small">
                                                Fatura
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-pedidos">
                                <p>Nenhum pedido encontrado nesta categoria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
