import { useEffect, useState } from "react";
import { FaBox, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import api from "../services/api";

export default function MinhasCompras() {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function buscarCompras() {
            try {
                const data = await api.get("/compras/minhas");
                setCompras(data);
            } catch (error) {
                console.error("Erro ao buscar compras:", error);
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

                {compras.length === 0 ? (
                    <div className="compras-vazio">
                        <FaBox />
                        <p>Você ainda não fez nenhuma compra.</p>
                    </div>
                ) : (
                    <div className="compras-lista">
                        {compras.map((compra) => (
                            <div className="compra-item" key={compra.id}>
                                <div>
                                    <h3>{compra.produto_nome}</h3>
                                    <p>
                                        <FaCalendarAlt />{" "}
                                        {new Date(compra.criado_em).toLocaleDateString("pt-BR")}
                                    </p>
                                </div>

                                <div>
                                    <strong>
                                        <FaMoneyBillWave /> R$ {Number(compra.valor).toFixed(2)}
                                    </strong>
                                    <span>{compra.status || "Finalizada"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
