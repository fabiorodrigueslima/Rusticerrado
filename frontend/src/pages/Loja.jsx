import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaEye, FaWhatsapp } from "react-icons/fa";

import FilterBar from "../components/FilterBar";
import Loading from "../components/Loading";
import { CartContext } from "../context/CartContext";
import { useOnlineSales } from "../context/storefrontContext";

import { formatarPreco, itemParaCarrinho, listarProdutos } from "../services/catalogo";

import "../styles/style.css";
import { whatsappLink } from "../config/contact.js";

export default function Loja() {
    const navigate = useNavigate();
    const { adicionarAoCarrinho } = useContext(CartContext);
    const vendeOnline = useOnlineSales();

    const [produtos, setProdutos] = useState([]);
    const [filteredProdutos, setFilteredProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [sortValue, setSortValue] = useState("nome");
    const [erro, setErro] = useState("");
    const [adicionando, setAdicionando] = useState(null);

    // Peças publicadas pela dona no painel.
    useEffect(() => {
        const controller = new AbortController();
        listarProdutos({ ordem: "name", limite: 48 }, controller.signal)
            .then(setProdutos)
            .catch((error) => {
                if (error.name !== "AbortError") setErro("Não foi possível carregar as peças agora. Tente de novo em instantes ou fale com a gente no WhatsApp.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
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

    const formatPrice = formatarPreco;

    // O botão da lista usa a primeira variação disponível da peça.
    async function adicionar(produto, irParaCarrinho) {
        setAdicionando(produto.slug);
        try {
            const item = await itemParaCarrinho(produto.slug);
            adicionarAoCarrinho(item);
            if (irParaCarrinho) navigate("/carrinho");
            else alert(`${item.nome} foi adicionado ao carrinho!`);
        } catch (error) {
            alert(error.message || "Não foi possível adicionar ao carrinho.");
        } finally {
            setAdicionando(null);
        }
    }

    const handleAdicionarCarrinho = (produto) => adicionar(produto, false);
    const handleComprarAgora = (produto) => adicionar(produto, true);

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
                            {vendeOnline
                                ? "Escolha sua peça artesanal, adicione ao carrinho e compre com facilidade."
                                : "Escolha sua peça artesanal e faça o pedido pelo WhatsApp."}
                        </p>

                        {vendeOnline && (
                            <Link to="/carrinho" className="btn btn-primary">
                                <FaShoppingCart /> Ver Carrinho
                            </Link>
                        )}
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
                                        <img src={produto.imagem} alt={produto.imagemAlt ?? produto.nome} loading="lazy" />

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
                                            {produto.emEstoque ? "Disponível" : "Esgotado no momento"}
                                        </p>

                                        <div className="produto-footer">
                                            <span className="produto-preco">
                                                {produto.precoOriginal && <s className="produto-preco-original">{formatPrice(produto.precoOriginal)}</s>}{" "}
                                                {formatPrice(produto.preco)}
                                            </span>

                                            <a
                                                href={whatsappLink(`Olá! Tenho interesse no produto: ${produto.nome}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-whats"
                                                aria-label="Falar no WhatsApp"
                                            >
                                                <FaWhatsapp />
                                            </a>
                                        </div>

                                        {vendeOnline ? (
                                        <div className="loja-card-actions">
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleAdicionarCarrinho(produto)}
                                                disabled={!produto.emEstoque || adicionando === produto.slug}
                                            >
                                                <FaShoppingCart /> Adicionar
                                            </button>

                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleComprarAgora(produto)}
                                                disabled={!produto.emEstoque || adicionando === produto.slug}
                                            >
                                                Comprar
                                            </button>
                                        </div>
                                        ) : (
                                        <div className="loja-card-actions">
                                            <a
                                                className="btn btn-primary"
                                                href={whatsappLink(`Olá! Quero encomendar: ${produto.nome}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <FaWhatsapp /> Encomendar pelo WhatsApp
                                            </a>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-products">
                            <p role={erro ? "alert" : undefined}>
                                {erro || (produtos.length ? "Nenhum produto encontrado." : "Novas peças chegando em breve.")}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
