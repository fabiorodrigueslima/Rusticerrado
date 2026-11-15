import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaWhatsapp } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import { useOnlineSales } from "../context/storefrontContext";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import { IMAGEM_PADRAO, formatarPreco, itemDoCarrinho, obterProduto } from "../services/catalogo";

import "../styles/style.css";

const WHATSAPP = "5561999952341";

// Página de uma peça, com os dados que a dona cadastrou no painel.
export default function Produto() {
    const { id: slug } = useParams();
    const navigate = useNavigate();
    const { adicionarAoCarrinho } = useContext(CartContext);
    const vendeOnline = useOnlineSales();

    const [produto, setProduto] = useState(null);
    const [estado, setEstado] = useState("carregando");
    const [fotoAtual, setFotoAtual] = useState(0);
    const [varianteId, setVarianteId] = useState(null);
    const [quantidade, setQuantidade] = useState(1);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        setEstado("carregando");
        obterProduto(slug, controller.signal)
            .then((dados) => {
                setProduto(dados);
                setFotoAtual(0);
                setQuantidade(1);
                const disponivel = dados.variantes.find((variante) => variante.disponivel > 0) ?? dados.variantes[0];
                setVarianteId(disponivel?.id ?? null);
                setEstado("pronto");
                document.title = `${dados.nome} | RustiCerrado`;
            })
            .catch((error) => {
                if (error.name === "AbortError") return;
                setProduto(null);
                setEstado(error.status === 404 ? "nao-encontrado" : "erro");
            });
        return () => controller.abort();
    }, [slug]);

    if (estado === "carregando") return <Loading />;

    if (estado !== "pronto" || !produto) {
        return (
            <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
                <h2>{estado === "erro" ? "Não foi possível carregar a peça agora" : "Produto não encontrado"}</h2>
                <button onClick={() => navigate("/loja")} className="btn btn-primary">
                    Voltar para Loja
                </button>
            </div>
        );
    }

    const variante = produto.variantes.find((item) => item.id === varianteId) ?? null;
    const disponivel = variante?.disponivel ?? 0;
    const foto = produto.imagens[fotoAtual] ?? produto.imagens[0];
    const link = `${window.location.origin}/produto/${produto.slug}`;
    const textoWhats = encodeURIComponent(`Olá! Tenho interesse no produto: ${produto.nome}${variante && produto.variantes.length > 1 ? ` (${variante.nome})` : ""} — ${link}`);

    const escolherVariante = (event) => {
        setVarianteId(Number(event.target.value));
        setQuantidade(1);
    };
    const mudarQuantidade = (valor) => setQuantidade(Math.min(Math.max(1, valor), Math.max(1, disponivel)));

    const handleAddToCart = () => {
        if (!variante || disponivel <= 0) return;
        adicionarAoCarrinho(itemDoCarrinho(produto, variante, quantidade));
        setAlert({ type: "success", message: `${produto.nome} adicionado ao carrinho!` });
    };

    const detalhes = [
        ["Materiais", produto.materiais],
        ["Medidas", produto.medidas],
        ["Cuidados", produto.cuidados],
        ["Prazo de produção", produto.prazoProducaoDias > 0 ? `${produto.prazoProducaoDias} dias` : null],
    ].filter(([, valor]) => valor);

    return (
        <div className="produto-page">
            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

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
                            src={foto.url}
                            alt={foto.alt}
                            onError={(event) => {
                                event.currentTarget.src = IMAGEM_PADRAO;
                            }}
                        />
                        {produto.imagens.length > 1 && (
                            <div className="produto-miniaturas" aria-label="Outras fotos">
                                {produto.imagens.map((imagem, indice) => (
                                    <button
                                        key={imagem.url}
                                        type="button"
                                        className={indice === fotoAtual ? "ativa" : ""}
                                        onClick={() => setFotoAtual(indice)}
                                        aria-label={`Ver foto ${indice + 1}`}
                                    >
                                        <img src={imagem.url} alt="" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="produto-info">
                        <div className="produto-header">
                            {produto.categoria && <span className="categoria-badge">{produto.categoria}</span>}
                            <h1>{produto.nome}</h1>
                        </div>

                        <div className="produto-preco">
                            <span className="preco-label">Preço:</span>
                            {variante?.precoOriginal && <s className="produto-preco-original">{formatarPreco(variante.precoOriginal)}</s>}
                            <span className="preco-valor">{formatarPreco(variante?.preco)}</span>
                        </div>

                        {produto.descricao && <p className="produto-descricao">{produto.descricao}</p>}

                        {produto.variantes.length > 1 && (
                            <div className="produto-variantes">
                                <label htmlFor="variante">Opção:</label>
                                <select id="variante" value={varianteId ?? ""} onChange={escolherVariante}>
                                    {produto.variantes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.nome} — {formatarPreco(item.preco)}{item.disponivel <= 0 ? " (esgotado)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="produto-estoque">
                            {disponivel > 0 ? (
                                <span className="em-estoque">✓ Em estoque ({disponivel} {disponivel === 1 ? "disponível" : "disponíveis"})</span>
                            ) : (
                                <span className="fora-estoque">✗ Esgotado no momento</span>
                            )}
                        </div>

                        {vendeOnline && disponivel > 0 && (
                            <div className="produto-quantidade">
                                <label htmlFor="quantidade">Quantidade:</label>
                                <div className="quantidade-control">
                                    <button onClick={() => mudarQuantidade(quantidade - 1)} disabled={quantidade <= 1} aria-label="Diminuir quantidade">-</button>
                                    <input
                                        type="number"
                                        id="quantidade"
                                        value={quantidade}
                                        onChange={(event) => mudarQuantidade(Number(event.target.value) || 1)}
                                        min="1"
                                        max={disponivel}
                                    />
                                    <button onClick={() => mudarQuantidade(quantidade + 1)} disabled={quantidade >= disponivel} aria-label="Aumentar quantidade">+</button>
                                </div>
                            </div>
                        )}

                        <div className="produto-acoes">
                            {vendeOnline && (
                                <button className="btn btn-primary btn-full" onClick={handleAddToCart} disabled={disponivel <= 0}>
                                    Adicionar ao Carrinho
                                </button>
                            )}
                            <a
                                href={`https://wa.me/${WHATSAPP}?text=${textoWhats}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`btn ${vendeOnline ? "btn-secondary" : "btn-primary"} btn-full`}
                            >
                                <FaWhatsapp /> {vendeOnline ? "Falar via WhatsApp" : "Encomendar pelo WhatsApp"}
                            </a>
                        </div>

                        <div className="produto-compartilhar">
                            <p>Compartilhe este produto:</p>
                            <div className="social-buttons">
                                <a className="social-btn" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                                <a className="social-btn" href={`https://wa.me/?text=${encodeURIComponent(`${produto.nome} — ${link}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                                <a className="social-btn" href={`mailto:?subject=${encodeURIComponent(produto.nome)}&body=${encodeURIComponent(link)}`}>Email</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {detalhes.length > 0 && (
                <section className="section produto-descricao-completa">
                    <div className="container">
                        <h2>Detalhes da peça</h2>
                        <dl className="produto-detalhes">
                            {detalhes.map(([rotulo, valor]) => (
                                <div key={rotulo}>
                                    <dt>{rotulo}</dt>
                                    <dd>{valor}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>
            )}
        </div>
    );
}
