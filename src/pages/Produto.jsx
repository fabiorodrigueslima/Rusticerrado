import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaWhatsapp, FaArrowLeft, FaStar } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import Loading from "../components/Loading";
import Alert from "../components/Alert";

import abridorMagnetico from "../assets/img/Abridor magnetico.jpeg";
import angico from "../assets/img/Angico Preto.jpeg";
import chaveiroPersonalizado from "../assets/img/Chaveiro Personalizado.jpeg";
import chaveiroPersonalizado1 from "../assets/img/Chaveiro Personalizado1.jpeg";
import petisqueiraDeMadeira from "../assets/img/Pestiqueira de madeira.jpeg";
import portaFaca from "../assets/img/Porta Faca.jpeg";
import portaJoias from "../assets/img/Porta Joias.jpeg";
import resina from "../assets/img/Resina.png";
import tabuaChurrasco from "../assets/img/Tábua de churrasco.jpeg";
import tabuaDeCorteMachetada from "../assets/img/Tábua de corte machetada.jpeg";
import tabuaDeServir from "../assets/img/Tábua de Servir.jpeg";

import "../styles/style.css";

const produtosFake = [
    {
        id: 1,
        nome: "Tábua de Churrasco Premium",
        descricao: "Tábua artesanal em madeira e resina com acabamento premium",
        preco: 150.0,
        imagem: tabuaChurrasco,
        estoque: 5,
        categoria: "Tábuas",
        descricao_completa: `
Esta tábua de churrasco é uma verdadeira obra de arte. Feita com madeira nobre do Cerrado 
e resina de alta qualidade, cada peça é única e exclusiva.

Características:
- Dimensões: 40cm x 25cm x 2cm
- Material: Madeira + Resina
- Acabamento: Polido
- Peso: 1.5kg
- Acompanha alça de couro

Perfeita para servir carnes, queijos, frutas e muito mais. Ideal para presentear!
    `,
        avaliacoes_media: 4.8,
        total_avaliacoes: 24,
    },
    {
        id: 2,
        nome: "Abridor Magnético",
        descricao: "Abridor artesanal magnético em madeira",
        preco: 45.0,
        imagem: abridorMagnetico,
        estoque: 8,
        categoria: "Abridores",
        descricao_completa: "Abridor magnético artesanal, bonito e prático para sua casa.",
        avaliacoes_media: 4.7,
        total_avaliacoes: 12,
    },
    {
        id: 3,
        nome: "Angico Preto",
        descricao: "Peça artesanal feita em madeira Angico Preto",
        preco: 120.0,
        imagem: angico,
        estoque: 4,
        categoria: "Madeira",
        descricao_completa: "Produto artesanal feito com madeira Angico Preto.",
        avaliacoes_media: 4.9,
        total_avaliacoes: 18,
    },
    {
        id: 4,
        nome: "Chaveiro Personalizado",
        descricao: "Chaveiro artesanal personalizado",
        preco: 25.0,
        imagem: chaveiroPersonalizado,
        estoque: 20,
        categoria: "Chaveiros",
        descricao_completa: "Chaveiro personalizado feito artesanalmente.",
        avaliacoes_media: 4.6,
        total_avaliacoes: 10,
    },
    {
        id: 5,
        nome: "Chaveiro Personalizado 2",
        descricao: "Modelo especial de chaveiro personalizado",
        preco: 25.0,
        imagem: chaveiroPersonalizado1,
        estoque: 20,
        categoria: "Chaveiros",
        descricao_completa: "Outro modelo de chaveiro artesanal personalizado.",
        avaliacoes_media: 4.5,
        total_avaliacoes: 8,
    },
    {
        id: 6,
        nome: "Petisqueira de Madeira",
        descricao: "Petisqueira artesanal em madeira",
        preco: 85.0,
        imagem: petisqueiraDeMadeira,
        estoque: 6,
        categoria: "Petisqueiras",
        descricao_completa: "Petisqueira de madeira ideal para servir com elegância.",
        avaliacoes_media: 4.8,
        total_avaliacoes: 15,
    },
    {
        id: 7,
        nome: "Porta Faca",
        descricao: "Porta faca artesanal em madeira",
        preco: 90.0,
        imagem: portaFaca,
        estoque: 5,
        categoria: "Cozinha",
        descricao_completa: "Porta faca artesanal para organizar sua cozinha.",
        avaliacoes_media: 4.7,
        total_avaliacoes: 11,
    },
    {
        id: 8,
        nome: "Porta Joias",
        descricao: "Porta joias artesanal",
        preco: 110.0,
        imagem: portaJoias,
        estoque: 3,
        categoria: "Decoração",
        descricao_completa: "Porta joias artesanal com acabamento delicado.",
        avaliacoes_media: 4.9,
        total_avaliacoes: 20,
    },
    {
        id: 9,
        nome: "Resina",
        descricao: "Peça artesanal com resina",
        preco: 70.0,
        imagem: resina,
        estoque: 7,
        categoria: "Resina",
        descricao_completa: "Produto artesanal feito com resina.",
        avaliacoes_media: 4.6,
        total_avaliacoes: 9,
    },
    {
        id: 10,
        nome: "Tábua de Corte Machetada",
        descricao: "Tábua de corte artesanal machetada",
        preco: 130.0,
        imagem: tabuaDeCorteMachetada,
        estoque: 4,
        categoria: "Tábuas",
        descricao_completa: "Tábua de corte resistente e artesanal.",
        avaliacoes_media: 4.8,
        total_avaliacoes: 14,
    },
    {
        id: 11,
        nome: "Tábua de Servir",
        descricao: "Tábua artesanal para servir",
        preco: 100.0,
        imagem: tabuaDeServir,
        estoque: 6,
        categoria: "Tábuas",
        descricao_completa: "Tábua de servir artesanal para momentos especiais.",
        avaliacoes_media: 4.7,
        total_avaliacoes: 13,
    },
];

export default function Produto() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { adicionarAoCarrinho } = useContext(CartContext);

    const [produto, setProduto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantidade, setQuantidade] = useState(1);
    const [alert, setAlert] = useState(null);
    const [avaliacoes, setAvaliacoes] = useState([]);

    useEffect(() => {
        setLoading(true);

        setTimeout(() => {
            const produtoEncontrado = produtosFake.find(
                (item) => item.id === Number(id)
            );

            setProduto(produtoEncontrado || null);

            setAvaliacoes([
                { id: 1, nome: "João Silva", estrelas: 5, comentario: "Excelente qualidade!" },
                { id: 2, nome: "Maria Santos", estrelas: 5, comentario: "Muito bonita, chegou rápido!" },
                { id: 3, nome: "Pedro Costa", estrelas: 4, comentario: "Bom custo-benefício." },
            ]);

            setLoading(false);
        }, 500);
    }, [id]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(price);
    };

    const handleAddToCart = () => {
        adicionarAoCarrinho({
            ...produto,
            quantidade,
        });

        setAlert({
            type: "success",
            message: `${produto.nome} adicionado ao carrinho!`,
        });
    };

    const handleQuantidadeChange = (e) => {
        const value = Number(e.target.value);

        if (value > 0 && value <= produto.estoque) {
            setQuantidade(value);
        }
    };

    const handleIncrement = () => {
        if (quantidade < produto.estoque) {
            setQuantidade(quantidade + 1);
        }
    };

    const handleDecrement = () => {
        if (quantidade > 1) {
            setQuantidade(quantidade - 1);
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (!produto) {
        return (
            <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
                <h2>Produto não encontrado</h2>

                <button onClick={() => navigate("/loja")} className="btn btn-primary">
                    Voltar para Loja
                </button>
            </div>
        );
    }

    return (
        <div className="produto-page">
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <section className="produto-hero">
                <div className="container">
                    <button className="btn-voltar" onClick={() => navigate("/loja")}>
                        <FaArrowLeft /> Voltar
                    </button>
                </div>
            </section>

            <section className="section produto-content">
                <div className="container produto-container">
                    <div className="produto-imagem">
                        <img
                            src={produto.imagem}
                            alt={produto.nome}
                            onError={(e) => {
                                e.currentTarget.src =
                                    "https://via.placeholder.com/500x400?text=Produto";
                            }}
                        />
                    </div>

                    <div className="produto-info">
                        <div className="produto-header">
                            <span className="categoria-badge">{produto.categoria}</span>
                            <h1>{produto.nome}</h1>
                        </div>

                        <div className="produto-avaliacoes">
                            <div className="stars-display">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={i}
                                        className={
                                            i < Math.round(produto.avaliacoes_media)
                                                ? "star-filled"
                                                : "star-empty"
                                        }
                                    />
                                ))}
                            </div>

                            <span className="avaliacoes-texto">
                                {produto.avaliacoes_media} ({produto.total_avaliacoes} avaliações)
                            </span>
                        </div>

                        <div className="produto-preco">
                            <span className="preco-label">Preço:</span>
                            <span className="preco-valor">{formatPrice(produto.preco)}</span>
                        </div>

                        <p className="produto-descricao">{produto.descricao}</p>

                        <div className="produto-estoque">
                            {produto.estoque > 0 ? (
                                <span className="em-estoque">
                                    ✓ Em Estoque ({produto.estoque} disponíveis)
                                </span>
                            ) : (
                                <span className="fora-estoque">✗ Fora de Estoque</span>
                            )}
                        </div>

                        <div className="produto-quantidade">
                            <label htmlFor="quantidade">Quantidade:</label>

                            <div className="quantidade-control">
                                <button
                                    onClick={handleDecrement}
                                    disabled={quantidade <= 1}
                                    aria-label="Diminuir quantidade"
                                >
                                    -
                                </button>

                                <input
                                    type="number"
                                    id="quantidade"
                                    value={quantidade}
                                    onChange={handleQuantidadeChange}
                                    min="1"
                                    max={produto.estoque}
                                />

                                <button
                                    onClick={handleIncrement}
                                    disabled={quantidade >= produto.estoque}
                                    aria-label="Aumentar quantidade"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="produto-acoes">
                            <button
                                className="btn btn-primary btn-full"
                                onClick={handleAddToCart}
                                disabled={produto.estoque === 0}
                            >
                                Adicionar ao Carrinho
                            </button>

                            <a
                                href={`https://wa.me/5561999952341?text=Olá! Tenho interesse no produto: ${produto.nome}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-full"
                            >
                                <FaWhatsapp /> Falar via WhatsApp
                            </a>
                        </div>

                        <div className="produto-compartilhar">
                            <p>Compartilhe este produto:</p>

                            <div className="social-buttons">
                                <a href="#" className="social-btn">Facebook</a>
                                <a href="#" className="social-btn">WhatsApp</a>
                                <a href="#" className="social-btn">Email</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section produto-descricao-completa">
                <div className="container">
                    <h2>Descrição Completa</h2>
                    <div className="descricao-texto">{produto.descricao_completa}</div>
                </div>
            </section>

            <section className="section produto-avaliacoes-section">
                <div className="container">
                    <h2>Avaliações dos Clientes</h2>

                    <div className="avaliacoes-list">
                        {avaliacoes.map((avaliacao) => (
                            <div key={avaliacao.id} className="avaliacao-item">
                                <div className="avaliacao-header">
                                    <strong>{avaliacao.nome}</strong>

                                    <div className="stars">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={
                                                    i < avaliacao.estrelas ? "star-filled" : "star-empty"
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>

                                <p className="avaliacao-texto">{avaliacao.comentario}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}