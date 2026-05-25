import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { FilterProvider } from './context/FilterContext';

// Componentes
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

// Pages
import Home from './pages/Home';
import Loja from './pages/Loja';
import Produto from './pages/Produto';
import Carrinho from './pages/Carrinho';
import Checkout from './pages/Checkout';
import Sucesso from './pages/Sucesso';
import Contato from './pages/Contato';
import Personalizados from './pages/Personalizados';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Perfil from './pages/Perfil';
import Pedidos from './pages/Pedidos';

function App() {
    return (
        <ThemeProvider>
            <NotificationProvider>
                <AuthProvider>
                    <CartProvider>
                        <FilterProvider>
                            <Router>
                                <div className="app">
                                    <Navbar />

                                    <main className="main-content">
                                        <Routes>
                                            {/* ROTAS PÚBLICAS */}
                                            <Route path="/" element={<Home />} />
                                            <Route path="/loja" element={<Loja />} />
                                            <Route path="/produto/:id" element={<Produto />} />
                                            <Route path="/contato" element={<Contato />} />
                                            <Route path="/personalizados" element={<Personalizados />} />

                                            {/* ROTAS DE AUTENTICAÇÃO */}
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/cadastro" element={<Cadastro />} />

                                            {/* ROTAS DE COMPRA */}
                                            <Route path="/carrinho" element={<Carrinho />} />
                                            <Route
                                                path="/checkout"
                                                element={
                                                    <ProtectedRoute>
                                                        <Checkout />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route path="/sucesso" element={<Sucesso />} />

                                            {/* ROTAS PROTEGIDAS (USUÁRIO LOGADO) */}
                                            <Route
                                                path="/perfil"
                                                element={
                                                    <ProtectedRoute>
                                                        <Perfil />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="/pedidos"
                                                element={
                                                    <ProtectedRoute>
                                                        <Pedidos />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* ROTA 404 */}
                                            <Route path="*" element={<NotFound />} />
                                        </Routes>
                                    </main>

                                    <Footer />
                                </div>
                            </Router>
                        </FilterProvider>
                    </CartProvider>
                </AuthProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
}

export default App;