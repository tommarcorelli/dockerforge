import { useState, useMemo } from 'react'
import { STACKS, CATEGORIE_LABELS, categorieDe } from '../core/stacks.js'
import { chargerFavoris, basculerFavori } from '../core/favoris.js'
import { trouverIcone } from '../core/catalogue.js'
import Icon from './Icon.jsx'

// Dérivé de CATEGORIE_LABELS (source unique de vérité, définie dans
// stacks.js) plutôt que recopié à la main ici : sans ça, ajouter une
// nouvelle catégorie dans stacks.js sans penser à mettre à jour ce fichier
// ferait disparaître silencieusement son chip de filtre (les stacks
// resteraient trouvables via "Toutes" et la recherche, mais invisibles du
// filtre par catégorie).
const CATEGORIES_ORDRE = Object.keys(CATEGORIE_LABELS)

// Boutons pour charger une stack complète (plusieurs services liés) en un clic
// + recherche et filtre par catégorie pour retrouver rapidement une stack
// parmi toutes celles disponibles.
function StackPresets({ onCharger }) {
  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState('toutes')
  const [nouveautesSeulement, setNouveautesSeulement] = useState(false)
  const [favorisSeulement, setFavorisSeulement] = useState(false)
  const [favoris, setFavoris] = useState(() => chargerFavoris())

  const nbNouveautes = useMemo(() => STACKS.filter((s) => s.nouveau).length, [])

  function toggleFavori(e, id) {
    e.stopPropagation()
    setFavoris(basculerFavori(id))
  }

  const stacksFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return STACKS.filter((s) => {
      if (nouveautesSeulement && !s.nouveau) return false
      if (favorisSeulement && !favoris.includes(s.id)) return false
      const correspondCategorie = categorie === 'toutes' || categorieDe(s) === categorie
      if (!correspondCategorie) return false
      if (!q) return true
      return (
        s.nom.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.services.some((sv) => sv.image.toLowerCase().includes(q))
      )
    })
  }, [recherche, categorie, nouveautesSeulement, favorisSeulement, favoris])

  // Les favoris remontent en tête de liste (dans l'ordre où ils ont été
  // ajoutés en favori n'a pas d'importance ici, seul le fait d'être favori
  // compte) — un tri stable préserve sinon l'ordre naturel de STACKS.
  const stacksAffichees = useMemo(() => {
    if (favoris.length === 0) return stacksFiltrees
    return [...stacksFiltrees].sort((a, b) => {
      const favA = favoris.includes(a.id) ? 1 : 0
      const favB = favoris.includes(b.id) ? 1 : 0
      return favB - favA
    })
  }, [stacksFiltrees, favoris])

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
        {nbNouveautes > 0 && (
          <button
            type="button"
            className={`chip-categorie chip-categorie-nouveau ${nouveautesSeulement ? 'chip-categorie-actif' : ''}`}
            onClick={() => setNouveautesSeulement((v) => !v)}
            title="N'afficher que les stacks ajoutées récemment"
          >
            ✨ Nouveautés ({nbNouveautes})
          </button>
        )}
        {favoris.length > 0 && (
          <button
            type="button"
            className={`chip-categorie chip-categorie-favori ${favorisSeulement ? 'chip-categorie-actif' : ''}`}
            onClick={() => setFavorisSeulement((v) => !v)}
            title="N'afficher que mes stacks favorites"
          >
            ★ Favoris ({favoris.length})
          </button>
        )}
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

      {stacksAffichees.length === 0 ? (
        <p className="liste-vide">Aucune stack ne correspond à "{recherche}".</p>
      ) : (
        <div className="stacks-liste">
          {stacksAffichees.map((stack) => {
            const estFavori = favoris.includes(stack.id)
            const icones = [...new Set(stack.services.map((sv) => trouverIcone(sv.image)).filter(Boolean))].slice(0, 5)
            return (
              <div className="stack-carte-conteneur" key={stack.id}>
                <button className="stack-carte" onClick={() => onCharger(stack)}>
                  <span className="stack-nom">
                    {stack.nom}
                    {stack.nouveau && <span className="badge-nouveau">Nouveau</span>}
                  </span>
                  <span className="stack-description">{stack.description}</span>
                  {icones.length > 0 && (
                    <span className="stack-icones">
                      {icones.map((icone, i) => (
                        <Icon key={i} icon={icone} size={16} />
                      ))}
                    </span>
                  )}
                  <span className="stack-nb-services">
                    {stack.services.length} conteneur{stack.services.length > 1 ? 's' : ''}
                  </span>
                </button>
                <button
                  type="button"
                  className={`btn-etoile ${estFavori ? 'btn-etoile-actif' : ''}`}
                  onClick={(e) => toggleFavori(e, stack.id)}
                  title={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  aria-label={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {estFavori ? '★' : '☆'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StackPresets
