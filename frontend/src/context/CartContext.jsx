import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
    const [carrinho, setCarrinho] = useState([]);

    // Carregar carrinho do localStorage ao montar
    useEffect(() => {
        const carrinhoSalvo = localStorage.getItem('rusticerrado_carrinho');
        if (carrinhoSalvo) {
            try {
                setCarrinho(JSON.parse(carrinhoSalvo));
            } catch (error) {
                console.error('Erro ao carregar carrinho:', error);
            }
        }
    }, []);

    // Salvar carrinho no localStorage sempre que mudar
    useEffect(() => {
        localStorage.setItem('rusticerrado_carrinho', JSON.stringify(carrinho));
    }, [carrinho]);

    // Adicionar item ao carrinho
    const adicionarAoCarrinho = (produto) => {
        setCarrinho(prevCarrinho => {
            const itemExistente = prevCarrinho.find(item => item.id === produto.id);

            if (itemExistente) {
                // Se o produto já existe, aumenta a quantidade
                return prevCarrinho.map(item =>
                    item.id === produto.id
                        ? { ...item, quantidade: item.quantidade + (produto.quantidade || 1) }
                        : item
                );
            } else {
                // Se não existe, adiciona novo item
                return [...prevCarrinho, { ...produto, quantidade: produto.quantidade || 1 }];
            }
        });
    };

    // Remover item do carrinho
    const removerDoCarrinho = (produtoId) => {
        setCarrinho(prevCarrinho =>
            prevCarrinho.filter(item => item.id !== produtoId)
        );
    };

    // Atualizar quantidade de um item
    const atualizarQuantidade = (produtoId, novaQuantidade) => {
        if (novaQuantidade <= 0) {
            removerDoCarrinho(produtoId);
            return;
        }

        setCarrinho(prevCarrinho =>
            prevCarrinho.map(item =>
                item.id === produtoId
                    ? { ...item, quantidade: novaQuantidade }
                    : item
            )
        );
    };

    // Limpar carrinho
    const limparCarrinho = () => {
        setCarrinho([]);
        localStorage.removeItem('rusticerrado_carrinho');
    };

    // Calcular total do carrinho
    const calcularTotal = () => {
        return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    };

    // Calcular quantidade total de itens
    const calcularQuantidadeTotal = () => {
        return carrinho.reduce((total, item) => total + item.quantidade, 0);
    };

    const value = {
        carrinho,
        adicionarAoCarrinho,
        removerDoCarrinho,
        atualizarQuantidade,
        limparCarrinho,
        calcularTotal,
        calcularQuantidadeTotal
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}