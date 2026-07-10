import { deviner_teinte, trouverIcone } from '../core/catalogue.js'
import Icon from './Icon.jsx'

// Liste des modèles de service enregistrés par l'utilisateur — un clic ajoute
// une copie du service au projet actif, comme une mini-stack personnelle.
function MesModeles({ modeles, onCharger, onSupprimer }) {
  if (!modeles || modeles.length === 0) return null

  return (
    <div className="mes-modeles">
      <div className="section-titre">
        <span className="section-tag">MES MODÈLES</span>
        <h2>Modèles enregistrés</h2>
      </div>
      <p className="reseaux-aide">
        Des services que tu as enregistrés depuis la liste (bouton ★), à
        réutiliser en un clic dans n'importe quel projet.
      </p>
      <div className="modeles-liste">
        {modeles.map((m) => {
          const icone = trouverIcone(m.service.image)
          const teinte = deviner_teinte(m.service.image)
          return (
            <div key={m.id} className={`modele-chip modele-chip-${teinte}`} title={m.service.image}>
              <button type="button" className="modele-bouton" onClick={() => onCharger(m)}>
                {icone && <Icon icon={icone} size={14} />}
                {m.nom}
              </button>
              <button
                type="button"
                className="modele-supprimer"
                title="Supprimer ce modèle"
                onClick={() => onSupprimer(m.id)}
              >✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MesModeles
