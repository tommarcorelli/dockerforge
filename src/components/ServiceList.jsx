import { deviner_teinte, trouverIcone } from '../core/catalogue.js'
import Icon from './Icon.jsx'

// Liste des services ajoutés, sous forme de cartes
// signature de DockerForge : chaque service = un conteneur maritime avec son
// numéro, sa teinte de catégorie, et sa texture ondulée.
function ServiceList({ services, onRemove, onDuplicate, onReorder, onEdit, idEnEdition }) {
  if (services.length === 0) {
    return (
      <div className="liste-vide-etat">
        <div className="liste-vide-icone">▭</div>
        <p>Aucun service pour l'instant. Ajoute-en un ci-dessus.</p>
      </div>
    )
  }

  return (
    <div className="pile-conteneurs">
      {services.map((s, i) => {
        const teinte = deviner_teinte(s.image)
        const icone = trouverIcone(s.image)
        const numero = String(i + 1).padStart(3, '0')
        const ports = (s.ports || []).filter((p) => p.host && p.container)

        return (
          <div className={`conteneur conteneur-${teinte} ${s.id === idEnEdition ? 'conteneur-en-edition' : ''}`} key={s.id}>
            <div className="conteneur-embout" />
            <div className="conteneur-corps">
              <div className="conteneur-entete">
                <span className="conteneur-id">#{numero}</span>
                {icone && <Icon icon={icone} size={14} />}
                <span className="conteneur-nom">{s.name}</span>
              </div>
              <div className="conteneur-detail">
                <span className="conteneur-image">{s.image}</span>
                {ports.length > 0 && (
                  <span className="conteneur-ports">
                    {ports.map((p) => `${p.host}:${p.container}`).join(', ')}
                  </span>
                )}
                {s.dependsOn && s.dependsOn.length > 0 && (
                  <span className="conteneur-deps">↳ dépend de {s.dependsOn.join(', ')}</span>
                )}
                {s.healthcheck && s.healthcheck.enabled && (
                  <span className="conteneur-badge" title="Vérification de santé activée">♥ healthcheck</span>
                )}
                {(s.memLimit || s.cpus) && (
                  <span className="conteneur-badge" title="Limites de ressources définies">
                    ▤ {s.memLimit || '—'} / {s.cpus ? `${s.cpus} CPU` : '—'}
                  </span>
                )}
              </div>
            </div>
            <div className="conteneur-actions">
              {onReorder && (
                <>
                  <button
                    className="btn-icone"
                    title="Monter"
                    disabled={i === 0}
                    onClick={() => onReorder(i, i - 1)}
                  >▲</button>
                  <button
                    className="btn-icone"
                    title="Descendre"
                    disabled={i === services.length - 1}
                    onClick={() => onReorder(i, i + 1)}
                  >▼</button>
                </>
              )}
              {onEdit && (
                <button className="btn-icone" title="Modifier" onClick={() => onEdit(s.id)}>✎</button>
              )}
              <button className="btn-icone" title="Dupliquer" onClick={() => onDuplicate(s.id)}>⧉</button>
              <button className="btn-icone btn-danger" title="Supprimer" onClick={() => onRemove(s.id)}>✕</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ServiceList
