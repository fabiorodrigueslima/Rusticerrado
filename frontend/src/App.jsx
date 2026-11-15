/**
 * App.jsx - Aplicação Principal RustiCerrado
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { FilterProvider } from "./context/FilterContext";

import WhatsAppButton from "./components/WhatsAppButton";

// Componentes
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Loja from "./pages/Loja";
import Produto from "./pages/Produto";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Sucesso from "./pages/Sucesso";
import Contato from "./pages/Contato";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Perfil from "./pages/Perfil";
import Pedidos from "./pages/Pedidos";
import Personalizados from "./pages/Personalizados";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import EditarPerfil from "./pages/EditarPerfil";
import MinhasCompras from "./pages/MinhasCompras";
import MinhaConta from "./pages/MinhaConta";

// Estilos
import "./styles/style.css";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              <FilterProvider>
                <div className="app">

                  {/* NAVBAR */}
                  <Navbar />

                  {/* CONTEÚDO PRINCIPAL */}
                  <main className="main-content">
                    <Routes>

                      {/* PÚBLICAS */}
                      <Route path="/" element={<Home />} />
                      <Route path="/loja" element={<Loja />} />
                      <Route path="/produto/:id" element={<Produto />} />
                      <Route path="/contato" element={<Contato />} />
                      <Route path="/personalizados" element={<Personalizados />} />

                      {/* AUTENTICAÇÃO */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/cadastro" element={<Cadastro />} />

                      {/* ROTAS PROTEGIDAS */}
                      <Route
                        path="/carrinho"
                        element={<Carrinho />}
                      />

                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <Checkout />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/minha-conta"
                        element={
                          <ProtectedRoute>
                            <MinhaConta />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/sucesso"
                        element={
                          <ProtectedRoute>
                            <Sucesso />
                          </ProtectedRoute>
                        }
                      />

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

                      <Route
                        path="/editar-perfil"
                        element={
                          <ProtectedRoute>
                            <EditarPerfil />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/compras"
                        element={
                          <ProtectedRoute>
                            <MinhasCompras />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />

                    </Routes>
                  </main>

                  {/* FOOTER */}
                  <Footer />

                  {/* WHATSAPP GLOBAL */}
                  <WhatsAppButton />

                </div>
              </FilterProvider>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;