import { useEffect, useState } from "react";
import { FaBox, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import api from "../services/api";

export default function MinhasCompras() {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function buscarCompras() {
            try {
                const data = await api.get("/compras/minhas");
                setCompras(data);
            } catch (error) {
                console.error("Erro ao buscar compras:", error);
                setErro("Não foi possível carregar suas compras.");
            } finally {
                setLoading(false);
            }
        }

        buscarCompras();
    }, []);

    if (loading) {
        return <p className="compras-loading">Carregando compras...</p>;
    }

    return (
        <main className="minhas-compras-page">
            <section className="minhas-compras-card">
                <h2>
                    <FaBox /> Minhas Compras
                </h2>

                {erro ? (
                    <div className="compras-vazio">
                        <FaBox />
                        <p>{erro}</p>
                    </div>
                ) : compras.length === 0 ? (
                    <div className="compras-vazio">
                        <FaBox />
                        <p>Você ainda não fez nenhuma compra.</p>
                    </div>
                ) : (
                    <div className="compras-lista">
                        {compras.map((compra) => (
                            <div className="compra-item" key={compra.id}>
                                <div>
                                    <h3>Pedido #{compra.id}</h3>
                                    <p>
                                        <FaCalendarAlt />{" "}
                                        {new Date(compra.criado_em).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        <FaMoneyBillWave />{" "}
                                        {Number(compra.valor).toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        })}
                                    </strong>
                                    <span>{compra.status || "Pendente"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
