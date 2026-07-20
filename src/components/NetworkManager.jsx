import { useState } from 'react'
import Aide from './Aide.jsx'

// Gestion des réseaux Docker personnalisés (créer/supprimer)
function NetworkManager({ networks, onAjouter, onSupprimer, onBasculerInterne }) {
  const [nom, setNom] = useState('')
  const [interne, setInterne] = useState(false)

  function soumettre(e) {
    e.preventDefault()
    const propre = nom.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    if (!propre) return
    if (networks.some((n) => n.nom === propre)) return
    onAjouter({ nom: propre, driver: 'bridge', interne })
    setNom('')
    setInterne(false)
  }

  return (
    <div className="reseaux">
      <div className="section-titre">
        <span className="section-tag">RÉSEAUX</span>
        <h2>Réseaux Docker</h2>
      </div>
      <p className="reseaux-aide">
        Par défaut, tous les conteneurs partagent le même réseau. Crée des
        réseaux séparés pour isoler par exemple ta base de données du reste.
      </p>
      <form className="reseaux-form" onSubmit={soumettre}>
        <input
          type="text"
          placeholder="nom du réseau, ex: backend"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <button type="submit" className="btn-discret">+ Créer</button>
      </form>
      <label className="option-secrets" style={{ marginTop: '0.5rem' }}>
        <input type="checkbox" checked={interne} onChange={(e) => setInterne(e.target.checked)} />
        Réseau interne (pas d'accès sortant à internet)
        <Aide texte="Coupe l'accès sortant à internet pour tout conteneur placé uniquement sur ce réseau (option internal: true de Docker). Utile pour isoler une base de données qui n'a besoin de parler qu'aux autres conteneurs du même réseau." />
      </label>
      {networks.length > 0 && (
        <div className="chips-dependances">
          {networks.map((n) => (
            <span key={n.nom} className={`chip chip-reseau ${n.interne ? 'chip-reseau-interne' : ''}`}>
              {n.interne && <span title="Réseau interne (sans accès internet)">🔒</span>}
              {n.nom}
              <button
                type="button"
                className="chip-supprimer"
                title={n.interne ? 'Rendre accessible à internet' : "Rendre interne (sans accès internet)"}
                onClick={() => onBasculerInterne(n.nom)}
                style={{ marginLeft: '0.3rem' }}
              >
                {n.interne ? '🔓' : '🔒'}
              </button>
              <button type="button" className="chip-supprimer" onClick={() => onSupprimer(n.nom)}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default NetworkManager
