import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUser,
    FaBox,
    FaSignOutAlt,
    FaCamera,
    FaEnvelope,
    FaEdit,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "../styles/style.css";

export default function Perfil() {
    const navigate = useNavigate();
    const inputFileRef = useRef(null);

    const { user, logout, atualizarUsuario } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("dados");

    const defaultAvatar =
        "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    if (!user) {
        return (
            <div className="perfil-loading">
                <p>Carregando perfil...</p>
            </div>
        );
    }

    const fotoPerfil = user?.foto
        ? user.foto.startsWith("data:image")
            ? user.foto
            : user.foto.startsWith("http")
                ? user.foto
                : `http://localhost:5000${user.foto}`
        : defaultAvatar;

    const handleTrocarFoto = (e) => {
        const arquivo = e.target.files[0];

        if (!arquivo) return;

        const reader = new FileReader();

        reader.onloadend = () => {
            atualizarUsuario({
                foto: reader.result,
            });
        };

        reader.readAsDataURL(arquivo);
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <main className="perfil-page">
            <section className="perfil-card">
                <div className="perfil-header">
                    <div className="perfil-avatar-box">
                        <img
                            src={fotoPerfil}
                            alt="Foto do perfil"
                            className="perfil-avatar"
                            onError={(e) => {
                                e.currentTarget.src = defaultAvatar;
                            }}
                        />

                        <input
                            ref={inputFileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleTrocarFoto}
                            style={{ display: "none" }}
                        />

                        <button
                            className="perfil-camera-btn"
                            type="button"
                            onClick={() => inputFileRef.current.click()}
                            title="Alterar foto"
                        >
                            <FaCamera />
                        </button>
                    </div>

                    <div className="perfil-info">
                        <h2>Olá, {user.nome || "Usuário"}</h2>
                        <p>
                            <FaEnvelope /> {user.email || "Email não informado"}
                        </p>
                    </div>

                    <button className="perfil-logout" onClick={handleLogout}>
                        <FaSignOutAlt /> Sair
                    </button>
                </div>

                <div className="perfil-menu">
                    <button
                        className={activeTab === "dados" ? "active" : ""}
                        onClick={() => setActiveTab("dados")}
                    >
                        <FaUser /> Meus Dados
                    </button>

                    <button
                        className={activeTab === "conta" ? "active" : ""}
                        onClick={() => setActiveTab("conta")}
                    >
                        <FaEdit /> Minha Conta
                    </button>

                    <button
                        className={activeTab === "compras" ? "active" : ""}
                        onClick={() => setActiveTab("compras")}
                    >
                        <FaBox /> Minhas Compras
                    </button>
                </div>

                <div className="perfil-content">
                    {activeTab === "dados" && (
                        <div className="perfil-section">
                            <h3>Meus Dados</h3>

                            <div className="perfil-dados-grid">
                                <div>
                                    <span>Nome</span>
                                    <p>{user.nome || "Não informado"}</p>
                                </div>

                                <div>
                                    <span>Email</span>
                                    <p>{user.email || "Não informado"}</p>
                                </div>

                                <div>
                                    <span>Telefone</span>
                                    <p>{user.telefone || "Não informado"}</p>
                                </div>

                                <div>
                                    <span>Foto de Perfil</span>
                                    <p>{user.foto ? "Foto cadastrada" : "Sem foto"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "conta" && (
                        <div className="perfil-section">
                            <h3>Minha Conta</h3>
                            <p>Gerencie suas informações de cadastro e segurança.</p>

                            <button
                                className="perfil-edit-btn"
                                onClick={() => navigate("/editar-perfil")}
                            >
                                <FaEdit /> Editar Perfil
                            </button>
                        </div>
                    )}

                    {activeTab === "compras" && (
                        <div className="perfil-section">
                            <h3>Minhas Compras</h3>

                            <button
                                className="perfil-edit-btn"
                                onClick={() => navigate("/compras")}
                            >
                                <FaBox /> Ver minhas compras
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}