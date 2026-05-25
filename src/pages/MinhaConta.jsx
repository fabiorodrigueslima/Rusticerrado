import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaEdit,
    FaShoppingBag,
    FaLock,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "../styles/style.css";

export default function MinhaConta() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    if (!user) {
        return <p className="conta-loading">Carregando conta...</p>;
    }

    return (
        <main className="minha-conta-page">
            <section className="minha-conta-card">
                <div className="minha-conta-header">
                    <div>
                        <span>Minha Conta</span>
                        <h1>Olá, {user.nome || "Usuário"}</h1>
                        <p>Veja e gerencie suas informações pessoais.</p>
                    </div>

                    <button onClick={() => navigate("/editar-perfil")}>
                        <FaEdit /> Editar Perfil
                    </button>
                </div>

                <div className="conta-grid">
                    <div className="conta-box">
                        <FaUser />
                        <span>Nome</span>
                        <strong>{user.nome || "Não informado"}</strong>
                    </div>

                    <div className="conta-box">
                        <FaEnvelope />
                        <span>Email</span>
                        <strong>{user.email || "Não informado"}</strong>
                    </div>

                    <div className="conta-box">
                        <FaPhone />
                        <span>Telefone</span>
                        <strong>{user.telefone || "Não informado"}</strong>
                    </div>

                    <div className="conta-box">
                        <FaMapMarkerAlt />
                        <span>Endereço</span>
                        <strong>{user.endereco || "Não informado"}</strong>
                    </div>
                </div>

                <div className="conta-actions">
                    <button onClick={() => navigate("/compras")}>
                        <FaShoppingBag /> Minhas Compras
                    </button>

                    <button onClick={() => navigate("/editar-perfil")}>
                        <FaEdit /> Atualizar Dados
                    </button>

                    <button>
                        <FaLock /> Segurança da Conta
                    </button>
                </div>
            </section>
        </main>
    );
}