/**
 * App.jsx - Aplicação Principal RustiCerrado
 */

import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { FilterProvider } from "./context/FilterContext";
import { StorefrontProvider } from "./context/StorefrontProvider";

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

// O painel é só para a equipe da loja: ele só é baixado quando alguém abre /admin.
const AdminPage = lazy(() =>
  import("./pages/admin/AdminPage.jsx").then((module) => ({ default: module.AdminPage })),
);
const AdminInvitePage = lazy(() =>
  import("./pages/admin/AdminInvitePage.jsx").then((module) => ({ default: module.AdminInvitePage })),
);
const AdminForgotPasswordPage = lazy(() =>
  import("./pages/admin/AdminPasswordPage.jsx").then((module) => ({ default: module.AdminForgotPasswordPage })),
);
const AdminResetPasswordPage = lazy(() =>
  import("./pages/admin/AdminPasswordPage.jsx").then((module) => ({ default: module.AdminResetPasswordPage })),
);
const adminLoading = (
  <main className="admin-login">
    <p role="status">Carregando o painel…</p>
  </main>
);

// Site da loja: cabeçalho, páginas e rodapé.
function SiteShell() {
  return (
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
  );
}

function App() {
  return (
    <Router>
      <StorefrontProvider>
        <Suspense fallback={adminLoading}>
          <Routes>
            {/* PAINEL (fora do layout do site) */}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/convite" element={<AdminInvitePage />} />
            <Route path="/admin/esqueci-a-senha" element={<AdminForgotPasswordPage />} />
            <Route path="/admin/redefinir-senha" element={<AdminResetPasswordPage />} />

            {/* SITE */}
            <Route path="/*" element={<SiteShell />} />
          </Routes>
        </Suspense>
      </StorefrontProvider>
    </Router>
  );
}

export default App;