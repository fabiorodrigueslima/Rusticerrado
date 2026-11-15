import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { useOnlineSales } from '../context/storefrontContext.js';

export default function CartIcon() {
    const { carrinho } = useContext(CartContext);
    const vendeOnline = useOnlineSales();

    const cartCount = carrinho.length;

    if (!vendeOnline) return null;

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