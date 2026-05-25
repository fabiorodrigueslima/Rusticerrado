import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaEye, FaWhatsapp } from "react-icons/fa";

import FilterBar from "../components/FilterBar";
import Loading from "../components/Loading";
import { CartContext } from "../context/CartContext";

import tabuaChurrasco from "../assets/img/Tábua de churrasco.jpeg";
import abridorMagnetico from "../assets/img/Abridor magnetico.jpeg";
import portaJoias from "../assets/img/Porta Joias.jpeg";
import resina from "../assets/img/Resina.png";
import portaFaca from "../assets/img/Porta Faca.jpeg";
import tabuaDeServir from "../assets/img/Tábua de Servir.jpeg";
import chaveiroPersonalizado from "../assets/img/Chaveiro Personalizado.jpeg";
import petisqueiraDeMadeira from "../assets/img/Pestiqueira de madeira.jpeg";

import "../styles/style.css";

export default function Loja() {
    const navigate = useNavigate();
    const { adicionarAoCarrinho } = useContext(CartContext);

    const [produtos, setProdutos] = useState([]);
    const [filteredProdutos, setFilteredProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [sortValue, setSortValue] = useState("nome");

    useEffect(() => {
        setTimeout(() => {
            const allProdutos = [
                {
                    id: 1,
                    nome: "Tábua de Churrasco",
                    descricao: "Tábua artesanal em madeira e resina.",
                    preco: 150.0,
                    imagem: tabuaChurrasco,
                    estoque: 5,
                },
                {
                    id: 2,
                    nome: "Abridor Magnético",
                    descricao: "Abridor de garrafas com design único.",
                    preco: 45.0,
                    imagem: abridorMagnetico,
                    estoque: 10,
                },
                {
                    id: 3,
                    nome: "Porta Joias",
                    descricao: "Organizador de joias em madeira e resina.",
                    preco: 85.0,
                    imagem: portaJoias,
                    estoque: 4,
                },
                {
                    id: 4,
                    nome: "Resina Decorativa",
                    descricao: "Peça artesanal em resina pura.",
                    preco: 120.0,
                    imagem: resina,
                    estoque: 6,
                },
                {
                    id: 5,
                    nome: "Porta Faca",
                    descricao: "Organizador de facas em madeira.",
                    preco: 55.0,
                    imagem: portaFaca,
                    estoque: 7,
                },
                {
                    id: 6,
                    nome: "Tábua de Servir",
                    descricao: "Tábua decorativa e funcional.",
                    preco: 180.0,
                    imagem: tabuaDeServir,
                    estoque: 3,
                },
                {
                    id: 7,
                    nome: "Chaveiro Artesanal",
                    descricao: "Chaveiro personalizado artesanal.",
                    preco: 25.0,
                    imagem: chaveiroPersonalizado,
                    estoque: 20,
                },
                {
                    id: 8,
                    nome: "Petisqueira de Madeira",
                    descricao: "Petisqueira artesanal em madeira.",
                    preco: 85.0,
                    imagem: petisqueiraDeMadeira,
                    estoque: 5,
                },
            ];

            setProdutos(allProdutos);
            setLoading(false);
        }, 500);
    }, []);

    useEffect(() => {
        let filtered = produtos.filter(
            (p) =>
                p.nome.toLowerCase().includes(searchValue.toLowerCase()) ||
                p.descricao.toLowerCase().includes(searchValue.toLowerCase())
        );

        if (sortValue === "preco-asc") {
            filtered.sort((a, b) => a.preco - b.preco);
        } else if (sortValue === "preco-desc") {
            filtered.sort((a, b) => b.preco - a.preco);
        } else {
            filtered.sort((a, b) => a.nome.localeCompare(b.nome));
        }

        setFilteredProdutos(filtered);
    }, [produtos, searchValue, sortValue]);

    function formatPrice(valor) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    function handleAdicionarCarrinho(produto) {
        adicionarAoCarrinho({
            ...produto,
            quantidade: 1,
        });

        alert(`${produto.nome} foi adicionado ao carrinho!`);
    }

    function handleComprarAgora(produto) {
        adicionarAoCarrinho({
            ...produto,
            quantidade: 1,
        });

        navigate("/carrinho");
    }

    function handleClearFilters() {
        setSearchValue("");
        setSortValue("nome");
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="loja">
            <section className="hero loja-hero">
                <div className="hero-overlay"></div>

                <div className="container hero-container">
                    <div className="hero-loja-content">
                        <h1>
                            Loja <span className="highlight">RustiCerrado</span>
                        </h1>

                        <p className="hero-subtitle-loja">
                            Escolha sua peça artesanal, adicione ao carrinho e compre com
                            facilidade.
                        </p>

                        <Link to="/carrinho" className="btn btn-primary">
                            <FaShoppingCart /> Ver Carrinho
                        </Link>
                    </div>
                </div>
            </section>

            <section className="section loja-content">
                <div className="container">
                    <FilterBar
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        sortValue={sortValue}
                        onSortChange={setSortValue}
                        onClearFilters={handleClearFilters}
                        hasActiveFilters={searchValue !== "" || sortValue !== "nome"}
                    />

                    {filteredProdutos.length > 0 ? (
                        <div className="produtos-grid loja-produtos-grid">
                            {filteredProdutos.map((produto) => (
                                <div className="product-card loja-card" key={produto.id}>
                                    <div className="product-image-wrapper">
                                        <img src={produto.imagem} alt={produto.nome} />

                                        <div className="produto-overlay">
                                            <Link to={`/produto/${produto.id}`} className="btn-ver">
                                                <FaEye /> Ver Detalhes
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="produto-info">
                                        <h3>{produto.nome}</h3>

                                        <p className="produto-descricao">{produto.descricao}</p>

                                        <p className="produto-estoque">
                                            {produto.estoque > 0
                                                ? `Em estoque: ${produto.estoque}`
                                                : "Fora de estoque"}
                                        </p>

                                        <div className="produto-footer">
                                            <span className="produto-preco">
                                                {formatPrice(produto.preco)}
                                            </span>

                                            <a
                                                href={`https://wa.me/5561999952341?text=Olá! Tenho interesse no produto: ${produto.nome}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-whats"
                                                aria-label="Falar no WhatsApp"
                                            >
                                                <FaWhatsapp />
                                            </a>
                                        </div>

                                        <div className="loja-card-actions">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleAdicionarCarrinho(produto)}
                                                disabled={produto.estoque <= 0}
                                            >
                                                <FaShoppingCart /> Adicionar
                                            </button>

                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleComprarAgora(produto)}
                                                disabled={produto.estoque <= 0}
                                            >
                                                Comprar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-products">
                            <p>Nenhum produto encontrado.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}