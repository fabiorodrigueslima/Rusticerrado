import { FaWhatsapp } from "react-icons/fa";
import"../styles/style.css"

export default function WhatsAppButton() {
    const numero = "5561984882881"; // seu número
    const mensagem = "Olá! Vim pelo site e quero mais informações.";

    return (
        <a
            href={`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`}
            className="whatsapp-float"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale conosco no WhatsApp"
        >
            <FaWhatsapp />
        </a>
    );
}