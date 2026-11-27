import { Link } from "react-router-dom";
import { FaArrowRight, FaLeaf } from "react-icons/fa";

import NotFound from "../components/NotFound";
import { PageMeta } from "../components/common/PageMeta.jsx";
import { historia, paginaPronta, processo } from "../content/institucional.js";
import logoRusticerrado from "../assets/img/RustiCerrado.oficial.png";

// Página "Nossa História" (/sobre). O texto fica em src/content/institucional.js.
export default function Sobre() {
    if (!paginaPronta(historia)) return <NotFound />;

    return (
        <div className="inst-page">
            <PageMeta title="Nossa História" description={historia.subtitulo || historia.chamada} />

            <section className="inst-hero">
                <div className="container">
                    <span className="section-tag">Nossa História</span>
                    <h1>{historia.chamada}</h1>
                    {historia.subtitulo && <p>{historia.subtitulo}</p>}
                </div>
            </section>

            <section className="section">
                <div className="container inst-split">
                    <img
                        className={historia.foto ? "inst-foto" : "inst-foto inst-foto-logo"}
                        src={historia.foto || logoRusticerrado}
                        alt={historia.foto ? historia.fotoAlt : "RustiCerrado"}
                        loading="lazy"
                    />
                    <div className="inst-texto">
                        {historia.paragrafos.map((paragrafo) => (
                            <p key={paragrafo}>{paragrafo}</p>
                        ))}
                    </div>
                </div>
            </section>

            {historia.valores.length > 0 && (
                <section className="section inst-valores-section">
                    <div className="container inst-valores">
                        {historia.valores.slice(0, 3).map((valor) => (
                            <article key={valor.titulo}>
                                <FaLeaf />
                                <h3>{valor.titulo}</h3>
                                <p>{valor.texto}</p>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <section className="section inst-cta">
                <div className="container">
                    {paginaPronta(processo) ? (
                        <Link className="btn btn-primary" to="/como-e-feito">
                            Veja como as peças são feitas <FaArrowRight />
                        </Link>
                    ) : (
                        <Link className="btn btn-primary" to="/loja">
                            Conheça as peças <FaArrowRight />
                        </Link>
                    )}
                </div>
            </section>
        </div>
    );
}
