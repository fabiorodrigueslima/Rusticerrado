import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import "../styles/style.css";

export default function EditarPerfil() {
    const navigate = useNavigate();
    const { user, atualizarUsuario } = useContext(AuthContext);

    const [form, setForm] = useState({
        nome: user?.nome || "",
        email: user?.email || "",
        telefone: user?.telefone || "",
        cpf: user?.cpf || "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        cep: "",
        foto: user?.foto || null,
    });

    const [preview, setPreview] = useState(user?.foto || null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFoto = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onloadend = () => {
            setPreview(reader.result);
            setForm((prev) => ({
                ...prev,
                foto: reader.result,
            }));
        };

        reader.readAsDataURL(file);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put('/usuario/dados', form);
            atualizarUsuario(response.usuario || response.user || form);

            alert("Perfil atualizado com sucesso!");
            navigate("/perfil");
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert("Erro ao atualizar perfil.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="editar-perfil-page">
            <div className="editar-perfil-container">

                <button
                    className="btn-voltar"
                    onClick={() => navigate("/perfil")}
                >
                    <FaArrowLeft /> Voltar
                </button>

                <h2>Editar Perfil</h2>

                <form onSubmit={handleSubmit}>

                    {/* FOTO */}
                    <div className="foto-perfil-box">
                        <img
                            src={
                                preview ||
                                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            }
                            alt="Foto"
                            className="foto-preview"
                        />

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFoto}
                        />
                    </div>

                    {/* DADOS */}
                    <div className="form-grid">

                        <input
                            type="text"
                            name="nome"
                            placeholder="Nome"
                            value={form.nome}
                            onChange={handleChange}
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="telefone"
                            placeholder="Telefone"
                            value={form.telefone}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="cpf"
                            placeholder="CPF"
                            value={form.cpf}
                            onChange={handleChange}
                        />

                    </div>

                    <h3>Endereço</h3>

                    <div className="form-grid">

                        <input
                            type="text"
                            name="endereco"
                            placeholder="Endereço"
                            value={form.endereco}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="numero"
                            placeholder="Número"
                            value={form.numero}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="complemento"
                            placeholder="Complemento"
                            value={form.complemento}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="bairro"
                            placeholder="Bairro"
                            value={form.bairro}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="cidade"
                            placeholder="Cidade"
                            value={form.cidade}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="estado"
                            placeholder="Estado"
                            value={form.estado}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="cep"
                            placeholder="CEP"
                            value={form.cep}
                            onChange={handleChange}
                        />

                    </div>

                    <button type="submit" className="btn-salvar" disabled={loading}>
                        <FaSave /> {loading ? "Salvando..." : "Salvar Alterações"}
                    </button>

                </form>
            </div>
        </div>
    );
}
