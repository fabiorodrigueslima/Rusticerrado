import { Component } from 'react';

// Se alguma página der erro, mostra uma mensagem amigável em vez da tela branca.
export class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error({
      event: 'REACT_RENDER_ERROR',
      errorName: error.name,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error" role="alert">
          <img src="/brand/rusticerrado-logo.png" alt="" />
          <p className="section-tag">RustiCerrado</p>
          <h1>Esta página encontrou um imprevisto.</h1>
          <p>Você pode voltar ao início e continuar navegando normalmente.</p>
          <a className="btn btn-primary" href="/">Voltar ao início</a>
        </main>
      );
    }
    return this.props.children;
  }
}
