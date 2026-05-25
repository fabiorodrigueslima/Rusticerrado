import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCreditCard, FaArrowLeft, FaTruck, FaLock } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import api from "../services/api";
import "../styles/style.css";

export default function Checkout() {
    const navigate = useNavigate();
    const { carrinho } = useContext(CartContext);

    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [erros, setErros] = useState({});

    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        telefone: "",
        cpf: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        metodo_pagamento: "mercado_pago",
    });

    const subtotal = carrinho.reduce(
        (sum, item) => sum + item.preco * item.quantidade,
        0
    );

    const frete = subtotal > 0 ? 15 : 0;
    const total = subtotal + frete;

    const formatPrice = (price) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(price);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (erros[name]) {
            setErros((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const validarFormulario = () => {
        const novosErros = {};

        if (!formData.nome.trim()) novosErros.nome = "Nome obrigatório";
        if (!formData.email.trim()) novosErros.email = "Email obrigatório";
        if (!formData.telefone.trim()) novosErros.telefone = "Telefone obrigatório";
        if (!formData.cpf.trim()) novosErros.cpf = "CPF obrigatório";
        if (!formData.endereco.trim()) novosErros.endereco = "Endereço obrigatório";
        if (!formData.numero.trim()) novosErros.numero = "Número obrigatório";
        if (!formData.bairro.trim()) novosErros.bairro = "Bairro obrigatório";
        if (!formData.cidade.trim()) novosErros.cidade = "Cidade obrigatória";
        if (!formData.estado.trim()) novosErros.estado = "Estado obrigatório";
        if (!formData.cep.trim()) novosErros.cep = "CEP obrigatório";

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            setAlert({
                type: "error",
                message: "Preencha todos os campos obrigatórios.",
            });
            return;
        }

        setLoading(true);

        try {
            const pedido = {
                cliente: formData,
                entrega: {
                    endereco: formData.endereco,
                    numero: formData.numero,
                    complemento: formData.complemento,
                    bairro: formData.bairro,
                    cidade: formData.cidade,
                    estado: formData.estado,
                    cep: formData.cep,
                },
                itens: carrinho.map((item) => ({
                    id: item.id,
                    nome: item.nome,
                    descricao: item.descricao,
                    preco: item.preco,
                    quantidade: item.quantidade,
                })),
                subtotal,
                frete,
                total,
            };

            const data = await api.post("/pagamento/mercado-pago", pedido);

            window.location.href = data.init_point;
        } catch (error) {
            console.error("Erro no pagamento:", error);
            setAlert({
                type: "error",
                message: "Pagamento ainda não conectado ao backend.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (carrinho.length === 0) {
        return (
            <div className="container checkout-empty">
                <h2>Carrinho vazio</h2>
                <p>Adicione produtos antes de finalizar a compra.</p>
                <button onClick={() => navigate("/loja")} className="btn btn-primary">
                    Ir para loja
                </button>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <section className="checkout-section">
                <div className="container checkout-container">
                    <div className="checkout-form">
                        <button
                            type="button"
                            onClick={() => navigate("/carrinho")}
                            className="btn-voltar-checkout"
                        >
                            <FaArrowLeft /> Voltar ao Carrinho
                        </button>

                        <h2>Finalizar Compra</h2>
                        <p className="checkout-subtitle">
                            Preencha seus dados para entrega e pagamento.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <fieldset>
                                <legend>Dados Pessoais</legend>

                                <Input
                                    label="Nome completo"
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

                                <div className="form-row">
                                    <Input
                                        label="Telefone"
                                        name="telefone"
                                        value={formData.telefone}
                                        onChange={handleInputChange}
                                        error={erros.telefone}
                                        required
                                    />

                                    <Input
                                        label="CPF"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleInputChange}
                                        error={erros.cpf}
                                        required
                                    />
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend>
                                    <FaTruck /> Endereço de Entrega
                                </legend>

                                <Input
                                    label="Endereço"
                                    name="endereco"
                                    value={formData.endereco}
                                    onChange={handleInputChange}
                                    error={erros.endereco}
                                    required
                                />

                                <div className="form-row">
                                    <Input
                                        label="Número"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleInputChange}
                                        error={erros.numero}
                                        required
                                    />

                                    <Input
                                        label="Complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <Input
                                    label="Bairro"
                                    name="bairro"
                                    value={formData.bairro}
                                    onChange={handleInputChange}
                                    error={erros.bairro}
                                    required
                                />

                                <div className="form-row form-row-3">
                                    <Input
                                        label="Cidade"
                                        name="cidade"
                                        value={formData.cidade}
                                        onChange={handleInputChange}
                                        error={erros.cidade}
                                        required
                                    />

                                    <Input
                                        label="Estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleInputChange}
                                        error={erros.estado}
                                        placeholder="DF"
                                        required
                                    />

                                    <Input
                                        label="CEP"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleInputChange}
                                        error={erros.cep}
                                        required
                                    />
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend>
                                    <FaLock /> Forma de Pagamento
                                </legend>

                                <div className="payment-box">
                                    <h3>Pagamento Seguro</h3>

                                    <p>
                                        Você será redirecionado para uma página segura para
                                        finalizar o pagamento.
                                    </p>

                                    <ul>
                                        <li>Cartão de crédito</li>
                                        <li>Cartão de débito</li>
                                        <li>Pix</li>
                                    </ul>

                                    <div className="payment-icons">
                                        <FaCreditCard /> Cartão / Pix
                                    </div>
                                </div>
                            </fieldset>

                            <Button type="submit" loading={loading} className="btn-full">
                                Ir para Pagamento
                            </Button>
                        </form>
                    </div>

                    <aside className="checkout-resumo">
                        <h3>Resumo do Pedido</h3>

                        <div className="resumo-items">
                            {carrinho.map((item) => (
                                <div key={item.id} className="resumo-item-checkout">
                                    <div>
                                        <strong>{item.nome}</strong>
                                        <span>Quantidade: {item.quantidade}</span>
                                    </div>

                                    <span>{formatPrice(item.preco * item.quantidade)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="resumo-totais">
                            <div className="resumo-linha">
                                <span>Subtotal:</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>

                            <div className="resumo-linha">
                                <span>Frete:</span>
                                <span>{formatPrice(frete)}</span>
                            </div>

                            <div className="resumo-total">
                                <span>Total:</span>
                                <strong>{formatPrice(total)}</strong>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
