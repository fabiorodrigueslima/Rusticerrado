/**
 * App.jsx - Aplicação Principal RustiCerrado
 */

import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Outlet, Routes, Route } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { CustomerAuthProvider } from "./context/customerAuthContext.jsx";
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
import Contato from "./pages/Contato";
import Personalizados from "./pages/Personalizados";
import NotFound from "./components/NotFound";

// Compra, conta do cliente e páginas legais (vindas do Brinco de Princesa)
import { CommerceGate } from "./components/common/CommerceGate.jsx";
import { CheckoutPage } from "./pages/loja/CheckoutPage.jsx";
import { OrderPage } from "./pages/loja/OrderPage.jsx";
import { CustomerAuthPage } from "./pages/loja/CustomerAuthPage.jsx";
import { CustomerAccountPage } from "./pages/loja/CustomerAccountPage.jsx";
import { CustomerActivationPage } from "./pages/loja/CustomerActivationPage.jsx";
import { LegalPage } from "./pages/loja/LegalPage.jsx";

// Estilos
import "./styles/style.css";
import "./styles/commerce.css";

// Páginas de compra e conta usam o visual do checkout (classes em commerce.css).
function CommerceLayout() {
  return (
    <div className="rc-commerce">
      <Outlet />
    </div>
  );
}

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
          <CustomerAuthProvider>
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

                      <Route path="/carrinho" element={<Carrinho />} />

                      {/* COMPRA, CONTA E PÁGINAS LEGAIS */}
                      <Route element={<CommerceLayout />}>
                        <Route path="/checkout" element={<CommerceGate><CheckoutPage /></CommerceGate>} />
                        <Route path="/pedido/:code" element={<OrderPage />} />
                        <Route path="/login" element={<CommerceGate><CustomerAuthPage mode="login" /></CommerceGate>} />
                        <Route path="/cadastro" element={<CommerceGate><CustomerAuthPage mode="register" /></CommerceGate>} />
                        <Route path="/recuperar-senha" element={<CommerceGate><CustomerAuthPage mode="forgot" /></CommerceGate>} />
                        <Route path="/redefinir-senha" element={<CommerceGate><CustomerAuthPage mode="reset" /></CommerceGate>} />
                        <Route path="/ativar-conta" element={<CommerceGate><CustomerActivationPage /></CommerceGate>} />
                        <Route path="/minha-conta" element={<CommerceGate><CustomerAccountPage /></CommerceGate>} />
                        <Route path="/privacidade" element={<LegalPage type="privacy" />} />
                        <Route path="/termos" element={<LegalPage type="terms" />} />
                        <Route path="/trocas-e-devolucoes" element={<LegalPage type="returns" />} />
                      </Route>

                      {/* Endereços antigos da área do cliente */}
                      {["/perfil", "/pedidos", "/compras", "/editar-perfil", "/sucesso"].map((path) => (
                        <Route key={path} path={path} element={<Navigate to="/minha-conta" replace />} />
                      ))}

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
          </CustomerAuthProvider>
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