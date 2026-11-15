import { useContext } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import "../styles/style.css";

export default function Carrinho() {
    const { carrinho, removerDoCarrinho, atualizarQuantidade } =
        useContext(CartContext);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(price);
    };

    const subtotal = carrinho.reduce(
        (sum, item) => sum + item.preco * item.quantidade,
        0
    );

    const frete = subtotal > 0 ? 15.0 : 0;
    const total = subtotal + frete;

    function diminuirQuantidade(item) {
        if (item.quantidade > 1) {
            atualizarQuantidade(item.id, item.quantidade - 1);
        }
    }

    function aumentarQuantidade(item) {
        atualizarQuantidade(item.id, item.quantidade + 1);
    }

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
                    ) : (
                        <div className="carrinho-container">
                            <div className="carrinho-items">
                                {carrinho.map((item) => (
                                    <div key={item.id} className="carrinho-item">
                                        <div className="col-produto">
                                            <img
                                                src={item.imagem}
                                                alt={item.nome}
                                                className="item-imagem"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        "https://via.placeholder.com/120x120?text=Produto";
                                                }}
                                            />

                                            <div className="item-info">
                                                <h3>{item.nome}</h3>
                                                <p>{item.descricao}</p>
                                                <strong>{formatPrice(item.preco)}</strong>
                                            </div>
                                        </div>

                                        <div className="col-quantidade">
                                            <div className="quantidade-control">
                                                <button onClick={() => diminuirQuantidade(item)}>
                                                    -
                                                </button>

                                                <input
                                                    type="number"
                                                    value={item.quantidade}
                                                    readOnly
                                                />

                                                <button onClick={() => aumentarQuantidade(item)}>
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="col-total">
                                            <strong>{formatPrice(item.preco * item.quantidade)}</strong>
                                        </div>

                                        <button
                                            className="btn-remover"
                                            onClick={() => removerDoCarrinho(item.id)}
                                            title="Remover produto"
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
                                    <strong>{formatPrice(subtotal)}</strong>
                                </div>

                                <div className="resumo-item">
                                    <span>Frete</span>
                                    <strong>{formatPrice(frete)}</strong>
                                </div>

                                <div className="resumo-total">
                                    <span>Total</span>
                                    <strong>{formatPrice(total)}</strong>
                                </div>

                                <Link to="/checkout" className="btn btn-primary btn-full">
                                    Finalizar Compra
                                </Link>

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