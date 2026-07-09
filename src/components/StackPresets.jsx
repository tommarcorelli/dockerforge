import { useState, useMemo } from 'react'
import { STACKS } from '../core/stacks.js'

// Boutons pour charger une stack complète (plusieurs services liés) en un clic
// + recherche pour retrouver rapidement une stack parmi toutes celles disponibles
function StackPresets({ onCharger }) {
  const [recherche, setRecherche] = useState('')

  const stacksFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return STACKS
    return STACKS.filter(
      (s) =>
        s.nom.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.services.some((sv) => sv.image.toLowerCase().includes(q))
    )
  }, [recherche])

  return (
    <div className="stacks">
      <div className="section-titre">
        <span className="section-tag">STACKS PRÊTES</span>
        <h2>Stacks prêtes à l'emploi ({STACKS.length})</h2>
      </div>

      <input
        type="text"
        className="stacks-recherche"
        placeholder="🔍 Rechercher une stack (ex: wiki, monitoring, vpn...)"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />

      {stacksFiltrees.length === 0 ? (
        <p className="liste-vide">Aucune stack ne correspond à "{recherche}".</p>
      ) : (
        <div className="stacks-liste">
          {stacksFiltrees.map((stack) => (
            <button key={stack.id} className="stack-carte" onClick={() => onCharger(stack)}>
              <span className="stack-nom">{stack.nom}</span>
              <span className="stack-description">{stack.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default StackPresets
