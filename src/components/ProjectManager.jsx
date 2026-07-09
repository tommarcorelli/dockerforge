import { useState } from 'react'

// Barre de gestion multi-projets : changer, créer, renommer, dupliquer, supprimer
function ProjectManager({ projets, actifId, onChanger, onNouveau, onRenommer, onDupliquer, onSupprimer, onExporter, onImporterFichier }) {
  const [renommageId, setRenommageId] = useState(null)
  const [brouillonNom, setBrouillonNom] = useState('')

  function demarrerRenommage(p) {
    setRenommageId(p.id)
    setBrouillonNom(p.nom)
  }

  function validerRenommage() {
    if (brouillonNom.trim()) onRenommer(renommageId, brouillonNom.trim())
    setRenommageId(null)
  }

  return (
    <div className="gestion-projets">
      <div className="projets-liste">
        {projets.map((p) => (
          <div key={p.id} className={`projet-onglet ${p.id === actifId ? 'projet-actif' : ''}`}>
            {renommageId === p.id ? (
              <input
                className="projet-renommage"
                autoFocus
                value={brouillonNom}
                onChange={(e) => setBrouillonNom(e.target.value)}
                onBlur={validerRenommage}
                onKeyDown={(e) => e.key === 'Enter' && validerRenommage()}
              />
            ) : (
              <button className="projet-nom-btn" onClick={() => onChanger(p.id)} onDoubleClick={() => demarrerRenommage(p)}>
                🚢 {p.nom}
                <span className="projet-compte">{p.services.length}</span>
              </button>
            )}
          </div>
        ))}
        <button className="projet-ajouter" onClick={onNouveau} title="Nouveau projet">+ Nouveau</button>
      </div>
      {projets.length > 0 && (
        <div className="projets-actions">
          <button className="btn-discret" onClick={() => demarrerRenommage(projets.find((p) => p.id === actifId))}>
            Renommer
          </button>
          <button className="btn-discret" onClick={() => onDupliquer(actifId)}>Dupliquer</button>
          <button className="btn-discret btn-import" onClick={onExporter}>⬇ Exporter (JSON)</button>
          <label className="btn-discret btn-import">
            ⬆ Importer (JSON)
            <input
              type="file"
              accept=".json,application/json"
              onChange={onImporterFichier}
              hidden
            />
          </label>
          {projets.length > 1 && (
            <button className="btn-discret btn-danger" onClick={() => onSupprimer(actifId)}>Supprimer ce projet</button>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectManager
