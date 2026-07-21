// Modale : aide-mémoire des raccourcis clavier, ouverte via la touche "?"
const RACCOURCIS = [
  { touches: ['Ctrl', 'K'], description: 'Ouvrir la palette de commandes' },
  { touches: ['Ctrl', 'S'], description: 'Télécharger docker-compose.yml' },
  { touches: ['Ctrl', 'Z'], description: 'Annuler la dernière action' },
  { touches: ['Ctrl', 'Maj', 'Z'], description: 'Rétablir l\'action annulée' },
  { touches: ['↑', '↓'], description: 'Naviguer dans la palette de commandes' },
  { touches: ['Entrée'], description: 'Valider le choix dans la palette' },
  { touches: ['Échap'], description: "Fermer la fenêtre ouverte (palette, guide, édition d'un service...)" },
  { touches: ['?'], description: 'Afficher cet aide-mémoire' },
]

function Touche({ children }) {
  return <kbd className="touche-clavier">{children}</kbd>
}

function ShortcutsModal({ ouvert, onFermer }) {
  if (!ouvert) return null

  return (
    <div className="guide-fond" onClick={onFermer}>
      <div className="guide-panneau guide-panneau-etroit" onClick={(e) => e.stopPropagation()}>
        <div className="guide-entete guide-entete-simple">
          <h2 className="guide-titre">Raccourcis clavier</h2>
          <button className="btn-icone guide-fermer" onClick={onFermer}>✕</button>
        </div>
        <div className="guide-contenu">
          <ul className="liste-raccourcis">
            {RACCOURCIS.map((r) => (
              <li key={r.description} className="ligne-raccourci">
                <span className="raccourci-touches">
                  {r.touches.map((t, i) => (
                    <span key={t}>
                      <Touche>{t}</Touche>
                      {i < r.touches.length - 1 && <span className="raccourci-plus"> + </span>}
                    </span>
                  ))}
                </span>
                <span className="raccourci-description">{r.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ShortcutsModal
