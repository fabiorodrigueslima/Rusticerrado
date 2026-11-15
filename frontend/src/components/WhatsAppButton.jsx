import { FaWhatsapp } from "react-icons/fa";
import { whatsappLink } from "../config/contact.js";
import"../styles/style.css"

export default function WhatsAppButton() {
    const mensagem = "Olá! Vim pelo site e quero mais informações.";

    return (
        <a
            href={whatsappLink(mensagem)}
            className="whatsapp-float"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale conosco no WhatsApp"
        >
            <FaWhatsapp />
        </a>
    );
}