import { Link } from "react-router-dom";
import { FaArrowRight, FaClock } from "react-icons/fa";

import NotFound from "../components/NotFound";
import { PageMeta } from "../components/common/PageMeta.jsx";
import { paginaPronta, processo } from "../content/institucional.js";

// Página "Como é feito" (/como-e-feito). O texto fica em src/content/institucional.js.
export default function ComoEFeito() {
    if (!paginaPronta(processo)) return <NotFound />;

    return (
        <div className="inst-page">
            <PageMeta title="Como é feito" description={processo.subtitulo || processo.chamada} />

            <section className="inst-hero">
                <div className="container">
                    <span className="section-tag">Como é feito</span>
                    <h1>{processo.chamada}</h1>
                    {processo.subtitulo && <p>{processo.subtitulo}</p>}
                </div>
            </section>

            <section className="section">
                <div className={`container ${processo.foto ? "inst-split inst-split-processo" : ""}`}>
                    {processo.foto && (
                        <img className="inst-foto" src={processo.foto} alt={processo.fotoAlt} loading="lazy" />
                    )}
                    <ol className="inst-etapas">
                        {processo.etapas.map((etapa, indice) => (
                            <li key={etapa.titulo}>
                                <span>{String(indice + 1).padStart(2, "0")}</span>
                                <div>
                                    <h2>{etapa.titulo}</h2>
                                    {etapa.texto && <p>{etapa.texto}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {processo.prazo && (
                <section className="container inst-prazo">
                    <FaClock />
                    <p>{processo.prazo}</p>
                </section>
            )}

            <section className="section inst-cta">
                <div className="container">
                    <h2>Quer uma peça do seu jeito?</h2>
                    <Link className="btn btn-primary" to="/personalizados">
                        Peça um orçamento <FaArrowRight />
                    </Link>
                </div>
            </section>
        </div>
    );
}
