import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import { CartContext, useCart } from "../context/CartContext";
import { validateCart } from "../services/lojaApi";
import { IMAGEM_PADRAO, formatarPreco } from "../services/catalogo";
import "../styles/style.css";

// Motivo de um item não poder ser comprado, como o servidor informa.
function aviso(item) {
    if (item.reason === "INSUFFICIENT_STOCK") return `Temos apenas ${item.availableStock} unidade(s) disponível(is).`;
    if (["OUT_OF_STOCK", "INACTIVE", "VARIANT_NOT_FOUND"].includes(item.reason)) return "Esta peça não está mais disponível.";
    return "";
}

// O carrinho fica no navegador, mas preços e estoque são sempre conferidos no servidor.
export default function Carrinho() {
    const { carrinho } = useContext(CartContext);
    const { items, removeItem, updateQuantity } = useCart();
    const [resultado, setResultado] = useState({ chave: "", dados: null, erro: "" });
    const chave = JSON.stringify(items);

    useEffect(() => {
        if (items.length === 0) return;
        const controller = new AbortController();
        validateCart(items, controller.signal)
            .then(({ data }) => setResultado({ chave, dados: data, erro: "" }))
            .catch((error) => {
                if (error.name !== "AbortError") setResultado({ chave, dados: null, erro: error.message });
            });
        return () => controller.abort();
        // items muda junto com chave
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chave]);

    const conferido = resultado.chave === chave ? resultado.dados : null;
    const erro = resultado.chave === chave ? resultado.erro : "";
    const tudoDisponivel = conferido?.items.every((item) => item.available);

    const mudarQuantidade = (item, nova) => {
        if (nova < 1 || nova > item.availableStock || nova > 99) return;
        updateQuantity(item.variantId, nova);
    };

    return (
        <div className="carrinho-page">
            <section className="carrinho-header">
                <div className="container">
                    <Link to="/loja" className="btn-voltar">
                        <FaArrowLeft /> Continuar Comprando
                    </Link>
                    <h1>
                        <FaShoppingCart /> Carrinho de Compras
                    </h1>
                </div>
            </section>

            <section className="section carrinho-content">
                <div className="container">
                    {carrinho.length === 0 ? (
                        <div className="carrinho-vazio">
                            <h2>Seu carrinho está vazio</h2>
                            <p>Explore nossa loja e adicione produtos ao seu carrinho.</p>
                            <Link to="/loja" className="btn btn-primary">
                                Ir para Loja
                            </Link>
                        </div>
                    ) : erro ? (
                        <div className="carrinho-vazio" role="alert">
                            <h2>Não foi possível conferir o carrinho</h2>
                            <p>{erro}</p>
                            <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
                                Tentar de novo
                            </button>
                        </div>
                    ) : !conferido ? (
                        <div className="carrinho-vazio" role="status">
                            <p>Conferindo preços e estoque…</p>
                        </div>
                    ) : (
                        <div className="carrinho-container">
                            <div className="carrinho-items">
                                {conferido.items.map((item) => (
                                    <div key={item.variantId} className={`carrinho-item${item.available ? "" : " carrinho-item-indisponivel"}`}>
                                        <div className="col-produto">
                                            <img
                                                src={item.image?.url ?? IMAGEM_PADRAO}
                                                alt={item.image?.alt ?? ""}
                                                className="item-imagem"
                                                onError={(event) => {
                                                    event.currentTarget.src = IMAGEM_PADRAO;
                                                }}
                                            />
                                            <div className="item-info">
                                                <Link to={item.productSlug ? `/produto/${item.productSlug}` : "/loja"}>
                                                    <h3>{item.productName || "Peça não encontrada"}</h3>
                                                </Link>
                                                {item.variantName && item.variantName !== "Única" && <p>{item.variantName}</p>}
                                                {item.unitPrice && <strong>{formatarPreco(item.unitPrice)}</strong>}
                                                {!item.available && <p className="carrinho-aviso" role="status">{aviso(item)}</p>}
                                            </div>
                                        </div>

                                        <div className="col-quantidade">
                                            <div className="quantidade-control">
                                                <button
                                                    onClick={() => mudarQuantidade(item, item.quantity - 1)}
                                                    disabled={!item.available || item.quantity <= 1}
                                                    aria-label="Diminuir quantidade"
                                                >
                                                    -
                                                </button>
                                                <input type="number" value={item.quantity} readOnly aria-label="Quantidade" />
                                                <button
                                                    onClick={() => mudarQuantidade(item, item.quantity + 1)}
                                                    disabled={!item.available || item.quantity >= item.availableStock || item.quantity >= 99}
                                                    aria-label="Aumentar quantidade"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="col-total">
                                            <strong>{item.subtotal ? formatarPreco(item.subtotal) : "—"}</strong>
                                        </div>

                                        <button
                                            className="btn-remover"
                                            onClick={() => removeItem(item.variantId)}
                                            title="Remover produto"
                                            aria-label={`Remover ${item.productName || "peça"} do carrinho`}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <aside className="carrinho-resumo">
                                <h3>Resumo do Pedido</h3>
                                <div className="resumo-item">
                                    <span>Subtotal</span>
                                    <strong>{formatarPreco(conferido.subtotal)}</strong>
                                </div>
                                <div className="resumo-item">
                                    <span>Frete</span>
                                    <span>Calculado no checkout, pelo CEP</span>
                                </div>
                                <p className="carrinho-nota">Preços e estoque conferidos agora. O carrinho não reserva as peças.</p>
                                {tudoDisponivel ? (
                                    <Link to="/checkout" className="btn btn-primary btn-full">
                                        Finalizar Compra
                                    </Link>
                                ) : (
                                    <p className="carrinho-aviso">Remova ou ajuste as peças indisponíveis para finalizar.</p>
                                )}
                                <Link to="/loja" className="btn btn-outline btn-full">
                                    Continuar Comprando
                                </Link>
                            </aside>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
