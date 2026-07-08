import { useState, useMemo } from 'react'
import { CATALOGUE } from '../core/catalogue.js'
import Icon from './Icon.jsx'

// Catalogue d'images Docker populaires, cliquables, avec recherche
function ImageCatalog({ onChoisir }) {
  const [recherche, setRecherche] = useState('')

  const groupesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return CATALOGUE
    return CATALOGUE
      .map((groupe) => ({
        ...groupe,
        images: groupe.images.filter(
          (item) => item.nom.toLowerCase().includes(q) || item.image.toLowerCase().includes(q)
        ),
      }))
      .filter((groupe) => groupe.images.length > 0)
  }, [recherche])

  return (
    <div className="catalogue">
      <h3>Choisir une image populaire</h3>
      <input
        type="text"
        className="catalogue-recherche"
        placeholder="Rechercher une image... (ex: redis, postgres)"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {groupesFiltres.length === 0 && (
        <p className="catalogue-vide">Aucune image ne correspond à « {recherche} ».</p>
      )}
      {groupesFiltres.map((groupe) => (
        <div key={groupe.categorie} className="catalogue-groupe">
          <span className="catalogue-categorie">{groupe.categorie}</span>
          <div className="catalogue-liste">
            {groupe.images.map((item) => (
              <button
                type="button"
                key={item.image}
                className="catalogue-item"
                onClick={() => onChoisir(item)}
              >
                {item.icone && <Icon icon={item.icone} size={15} />}
                {item.nom}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ImageCatalog
