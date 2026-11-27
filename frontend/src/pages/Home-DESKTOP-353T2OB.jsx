import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import FeatureCard from "../components/FatureCard";
import TestimonialCard from "../components/TestimonialCard";
import Loading from "../components/Loading";

import logoRusticerrado from "../assets/img/RustiCerrado.oficial.png";

import { listarProdutos } from "../services/catalogo";

import "../styles/style.css";

export default function Home() {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Peças publicadas no painel: primeiro as marcadas como destaque, depois as mais novas.
    useEffect(() => {
        const controller = new AbortController();
        listarProdutos({ ordem: "newest", limite: 24 }, controller.signal)
            .then((lista) => {
                const destaques = lista.filter((produto) => produto.destaque);
                const outras = lista.filter((produto) => !produto.destaque);
                setProdutos([...destaques, ...outras].slice(0, 6));
            })
            .catch(() => setProdutos([]))
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    return (
        <div className="home">
            {/* HERO */}
            <Hero />

            {/* DIFERENCIAIS */}
            <section className="section diferenciais">
                <div className="container grid-3">
                    <FeatureCard
                        icon="tree"
                        title="Madeira Sustentável"
                        description="Utilizamos madeiras de reaproveitamento e manejo sustentável."
                    />
                    <FeatureCard
                        icon="hand"
                        title="Feito à Mão"
                        description="Cada peça é única e feita artesanalmente."
                    />
                    <FeatureCard
                        icon="shipping"
                        title="Envio Seguro"
                        description="Embalagens reforçadas para garantir qualidade."
                    />
                </div>
            </section>

            {/* PRODUTOS EM DESTAQUE */}
            <section className="section produtos-destaque">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Catálogo</span>
                        <h2>Peças em Destaque</h2>
                    </div>

                    {loading ? (
                        <Loading />
                    ) : produtos.length > 0 ? (
                        <div className="produtos-grid">
                            {produtos.map((produto) => (
                                <ProductCard key={produto.id} produto={produto} />
                            ))}
                        </div>
                    ) : (
                        <div className="no-products">
                            <p>Novas peças chegando em breve. Fale com a gente no WhatsApp!</p>
                        </div>
                    )}

                    <div style={{ textAlign: "center", marginTop: "40px" }}>
                        <Link to="/loja" className="btn btn-primary">
                            Explorar Loja Completa
                        </Link>
                    </div>
                </div>
            </section>

            {/* QUEM SOMOS */}
            <section className="section sobre-nos" id="sobre">
                <div className="container sobre-container">
                    <div className="sobre-image">
                        <img src={logoRusticerrado} alt="RustiCerrado" />
                    </div>

                    <div className="sobre-content">
                        <span className="section-tag">Nossa Essência</span>
                        <h2>Quem Somos</h2>

                        <p>
                            A <strong>RustiCerrado</strong> transforma madeira e resina em arte.
                        </p>

                        <p>
                            Criamos peças únicas com qualidade e acabamento profissional.
                        </p>

                        <div className="sobre-stats">
                            <div>
                                <strong>+500</strong>
                                <span>Peças Criadas</span>
                            </div>

                            <div>
                                <strong>100%</strong>
                                <span>Clientes Satisfeitos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* DEPOIMENTOS */}
            <section className="section depoimentos">
                <div className="container">
                    <h2>O que dizem nossos clientes</h2>

                    <div className="grid-3">
                        <TestimonialCard
                            stars="★★★★★"
                            text="Produto incrível!"
                            author="Ricardo"
                        />
                        <TestimonialCard
                            stars="★★★★★"
                            text="Muito bem feito!"
                            author="Ana"
                        />
                        <TestimonialCard
                            stars="★★★★★"
                            text="Super recomendo!"
                            author="Marcos"
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section cta-section">
                <div className="container">
                    <h2>Quer uma peça personalizada?</h2>
                    <p>Fale conosco e peça seu orçamento.</p>

                    <Link to="/contato" className="btn btn-primary">
                        Solicitar Orçamento
                    </Link>
                </div>
            </section>
        </div>
    );
}
