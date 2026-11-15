import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import FeatureCard from "../components/FatureCard";
import TestimonialCard from "../components/TestimonialCard";
import Loading from "../components/Loading";

import logoRusticerrado from "../assets/img/RustiCerrado.oficial.png";

// ✅ IMPORTAR IMAGENS CORRETAMENTE
import tabuaChurrasco from "../assets/img/Tábua de Churrasco.jpeg";
import abridorMagnetico from "../assets/img/Abridor magnetico.jpeg";
import portaJoias from "../assets/img/Porta Joias.jpeg";
import resina from "../assets/img/Resina.png";
import portaFaca from "../assets/img/Porta Faca.jpeg";
import tabuaDeServir from "../assets/img/Tábua de Servir.jpeg";

import "../styles/style.css";

export default function Home() {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simular carregamento
        setTimeout(() => {
            setProdutos([
                {
                    id: 1,
                    nome: "Tábua de Churrasco",
                    descricao: "Tábua artesanal em madeira e resina",
                    preco: 150.0,
                    imagem: tabuaChurrasco,
                },
                {
                    id: 2,
                    nome: "Abridor Magnético",
                    descricao: "Abridor de garrafas com design único",
                    preco: 45.0,
                    imagem: abridorMagnetico,
                },
                {
                    id: 3,
                    nome: "Porta Joias",
                    descricao: "Organizador de joias em madeira e resina",
                    preco: 85.0,
                    imagem: portaJoias,
                },
                {
                    id: 4,
                    nome: "Resina Decorativa",
                    descricao: "Peça artesanal em resina pura",
                    preco: 120.0,
                    imagem: resina,
                },
                {
                    id: 5,
                    nome: "Porta Faca",
                    descricao: "Organizador de facas em madeira e resina",
                    preco: 55.0,
                    imagem: portaFaca,
                },
                {
                    id: 6,
                    nome: "Tábua de Servir",
                    descricao: "Tábua decorativa e funcional",
                    preco: 180.0,
                    imagem: tabuaDeServir,
                },
            ]);

            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return <Loading />;
    }

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

                    <div className="produtos-grid">
                        {produtos.map((produto) => (
                            <ProductCard key={produto.id} produto={produto} />
                        ))}
                    </div>

                    <div style={{ textAlign: "center", marginTop: "40px" }}>
                        <Link to="/loja" className="btn btn-primary">
                            Explorar Loja Completa
                        </Link>
                    </div>
                </div>
            </section>

            {/* QUEM SOMOS */}
            <section className="section sobre-nos">
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
