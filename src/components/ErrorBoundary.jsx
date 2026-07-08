import { Component } from 'react'

// Filet de sécurité : si un composant plante, on affiche un message clair
// au lieu d'un écran blanc — et on propose de vider le stockage si la
// sauvegarde locale semble corrompue.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erreur: null }
  }

  static getDerivedStateFromError(erreur) {
    return { erreur }
  }

  componentDidCatch(erreur, info) {
    console.error('DockerForge — erreur interceptée :', erreur, info)
  }

  reinitialiserStockage = () => {
    localStorage.removeItem('dockerforge_projets')
    localStorage.removeItem('dockerforge_services')
    window.location.reload()
  }

  render() {
    if (this.state.erreur) {
      return (
        <div className="erreur-fatale">
          <div className="erreur-fatale-carte">
            <span className="section-tag">ERREUR</span>
            <h1>Un problème est survenu</h1>
            <p>
              DockerForge a rencontré une erreur inattendue. Tes données ne
              sont pas perdues — essaie de recharger la page.
            </p>
            <div className="erreur-fatale-actions">
              <button className="btn-principal" onClick={() => window.location.reload()}>
                Recharger la page
              </button>
              <button className="btn-discret" onClick={this.reinitialiserStockage}>
                Vider les données sauvegardées et recharger
              </button>
            </div>
            <details className="erreur-fatale-detail">
              <summary>Détail technique</summary>
              <pre>{String(this.state.erreur && this.state.erreur.stack || this.state.erreur)}</pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
