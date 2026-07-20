import { useState, useMemo } from 'react'
import { STACKS, CATEGORIE_LABELS, categorieDe } from '../core/stacks.js'

const CATEGORIES_ORDRE = ['web', 'dev', 'reseau', 'monitoring', 'perso', 'outils']

// Boutons pour charger une stack complète (plusieurs services liés) en un clic
// + recherche et filtre par catégorie pour retrouver rapidement une stack
// parmi toutes celles disponibles.
function StackPresets({ onCharger }) {
  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('toutes')

  const stacksFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return STACKS.filter((s) => {
      const correspondCategorie = categorie === 'toutes' || categorieDe(s) === categorie
      if (!correspondCategorie) return false
      if (!q) return true
      return (
        s.nom.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.services.some((sv) => sv.image.toLowerCase().includes(q))
      )
    })
  }, [recherche, categorie])

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

      <div className="stacks-categories">
        <button
          type="button"
          className={`chip-categorie ${categorie === 'toutes' ? 'chip-categorie-actif' : ''}`}
          onClick={() => setCategorie('toutes')}
        >
          Toutes ({STACKS.length})
        </button>
        {CATEGORIES_ORDRE.map((c) => {
          const nb = STACKS.filter((s) => categorieDe(s) === c).length
          return (
            <button
              type="button"
              key={c}
              className={`chip-categorie ${categorie === c ? 'chip-categorie-actif' : ''}`}
              onClick={() => setCategorie(c)}
            >
              {CATEGORIE_LABELS[c]} ({nb})
            </button>
          )
        })}
      </div>

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
