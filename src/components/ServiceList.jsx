import { useState, useRef } from 'react'
import { deviner_teinte, trouverIcone } from '../core/catalogue.js'
import Icon from './Icon.jsx'

// Liste des services ajoutés, sous forme de cartes
// signature de DockerForge : chaque service = un conteneur maritime avec son
// numéro, sa teinte de catégorie, et sa texture ondulée.
function ServiceList({ services, onRemove, onDuplicate, onReorder, onEdit, idEnEdition, onEnregistrerModele }) {
  const [recherche, setRecherche] = useState('')
  const [indexGlisse, setIndexGlisse] = useState(null)
  const [indexSurvole, setIndexSurvole] = useState(null)
  const [copieId, setCopieId] = useState(null)
  const [modeleEnNommageId, setModeleEnNommageId] = useState(null)
  const [brouillonNomModele, setBrouillonNomModele] = useState('')
  // Même précaution que pour le renommage de projet : évite qu'un blur
  // déclenché par la fermeture du champ (après Échap) ne crée quand même
  // le modèle avec l'ancienne saisie.
  const annulationEnCoursRef = useRef(false)

  function demarrerNommageModele(s) {
    setModeleEnNommageId(s.id)
    setBrouillonNomModele(s.name || '')
  }

  function validerNommageModele(s) {
    if (annulationEnCoursRef.current) {
      annulationEnCoursRef.current = false
      return
    }
    if (brouillonNomModele.trim()) onEnregistrerModele(s, brouillonNomModele.trim())
    setModeleEnNommageId(null)
  }

  function annulerNommageModele() {
    annulationEnCoursRef.current = true
    setModeleEnNommageId(null)
  }

  function copierEnJSON(s) {
    const { id, ...donnees } = s
    navigator.clipboard.writeText(JSON.stringify(donnees, null, 2))
    setCopieId(s.id)
    setTimeout(() => setCopieId((c) => (c === s.id ? null : c)), 1500)
  }

  if (services.length === 0) {
    return (
      <div className="liste-vide-etat">
        <div className="liste-vide-icone">▭</div>
        <p>Aucun service pour l'instant. Ajoute-en un ci-dessus.</p>
      </div>
    )
  }

  // On garde l'index d'origine de chaque service (utilisé pour le
  // réordonnancement et la numérotation), même une fois la recherche
  // appliquée, pour ne pas décaler le sens de "monter/descendre".
  const q = recherche.trim().toLowerCase()
  const avecIndex = services.map((s, i) => ({ s, i }))
  const filtres = q
    ? avecIndex.filter(
        ({ s }) => (s.name || '').toLowerCase().includes(q) || (s.image || '').toLowerCase().includes(q)
      )
    : avecIndex

  // Le glisser-déposer réordonne par index réel dans la liste complète : le
  // désactiver pendant une recherche filtrée évite toute confusion entre la
  // position affichée et la position réelle.
  const dragActif = !!onReorder && !q

  return (
    <div className="conteneurs-panneau">
      {services.length > 4 && (
        <input
          type="text"
          className="conteneurs-recherche"
          placeholder="🔍 Rechercher un conteneur (nom ou image)..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      )}

      {filtres.length === 0 ? (
        <p className="catalogue-vide">Aucun conteneur ne correspond à « {recherche} ».</p>
      ) : (
        <div className="pile-conteneurs">
          {filtres.map(({ s, i }) => {
            const teinte = deviner_teinte(s.image)
            const icone = trouverIcone(s.image)
            const numero = String(i + 1).padStart(3, '0')
            const ports = (s.ports || []).filter((p) => p.host && p.container)

            return (
              <div
                className={`conteneur conteneur-${teinte} ${s.id === idEnEdition ? 'conteneur-en-edition' : ''} ${indexGlisse === i ? 'conteneur-en-glisse' : ''} ${indexSurvole === i && indexGlisse !== null && indexGlisse !== i ? 'conteneur-survole' : ''}`}
                key={s.id}
                onDragOver={(e) => {
                  if (!dragActif || indexGlisse === null) return
                  e.preventDefault()
                  if (indexSurvole !== i) setIndexSurvole(i)
                }}
                onDrop={(e) => {
                  if (!dragActif || indexGlisse === null) return
                  e.preventDefault()
                  if (indexGlisse !== i) onReorder(indexGlisse, i)
                  setIndexGlisse(null)
                  setIndexSurvole(null)
                }}
              >
                {dragActif && (
                  <span
                    className="conteneur-grip"
                    draggable
                    title="Glisser pour réordonner"
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      setIndexGlisse(i)
                    }}
                    onDragEnd={() => {
                      setIndexGlisse(null)
                      setIndexSurvole(null)
                    }}
                  >⠿</span>
                )}
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
                  <button className="btn-icone" title="Copier en JSON" onClick={() => copierEnJSON(s)}>
                    {copieId === s.id ? '✓' : '📋'}
                  </button>
                  {onEnregistrerModele && (
                    modeleEnNommageId === s.id ? (
                      <form
                        className="modele-nommage"
                        onSubmit={(e) => { e.preventDefault(); validerNommageModele(s) }}
                      >
                        <input
                          autoFocus
                          value={brouillonNomModele}
                          onChange={(e) => setBrouillonNomModele(e.target.value)}
                          onBlur={() => validerNommageModele(s)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              // Ne doit annuler QUE le nommage du modèle — sans
                              // ce stopPropagation, l'Échap remonte jusqu'au
                              // raccourci clavier global d'App.jsx et annule
                              // en plus l'édition d'un AUTRE service en cours.
                              e.stopPropagation()
                              annulerNommageModele()
                            }
                          }}
                          placeholder="nom du modèle"
                        />
                      </form>
                    ) : (
                      <button className="btn-icone" title="Enregistrer comme modèle" onClick={() => demarrerNommageModele(s)}>★</button>
                    )
                  )}
                  <button className="btn-icone btn-danger" title="Supprimer" onClick={() => onRemove(s.id)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ServiceList
