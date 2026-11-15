import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
    // Lê o carrinho salvo ANTES da primeira tela. (Antes ele era lido depois e o efeito
    // abaixo gravava o carrinho vazio por cima, apagando o que a pessoa tinha escolhido.)
    const [carrinho, setCarrinho] = useState(() => {
        try {
            const salvo = JSON.parse(localStorage.getItem('rusticerrado_carrinho') ?? '[]');
            return Array.isArray(salvo) ? salvo : [];
        } catch {
            return [];
        }
    });

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