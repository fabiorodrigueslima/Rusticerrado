import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';

export default function CartIcon() {
    const { carrinho } = useContext(CartContext);

    const cartCount = carrinho.length;

    return (
        <Link
            to="/carrinho"
            className="cart-icon-wrapper"
            aria-label="Carrinho de compras"
            title="Ir para o carrinho"
        >
            <FaShoppingCart className="cart-icon" />
            {cartCount > 0 && (
                <span className="badge">{cartCount}</span>
            )}
        </Link>
    );
}