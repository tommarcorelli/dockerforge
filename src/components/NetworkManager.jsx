import { useState } from 'react'

// Gestion des réseaux Docker personnalisés (créer/supprimer)
function NetworkManager({ networks, onAjouter, onSupprimer }) {
  const [nom, setNom] = useState('')

  function soumettre(e) {
    e.preventDefault()
    const propre = nom.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    if (!propre) return
    if (networks.some((n) => n.nom === propre)) return
    onAjouter({ nom: propre, driver: 'bridge' })
    setNom('')
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
      {networks.length > 0 && (
        <div className="chips-dependances">
          {networks.map((n) => (
            <span key={n.nom} className="chip chip-reseau">
              {n.nom}
              <button type="button" className="chip-supprimer" onClick={() => onSupprimer(n.nom)}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default NetworkManager
