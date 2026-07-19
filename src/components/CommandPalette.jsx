import { useState, useEffect, useMemo, useRef } from 'react'
import { STACKS } from '../core/stacks.js'

// Palette de commandes (Ctrl/Cmd+K) — recherche unifiée parmi les actions
// rapides de l'appli et les stacks prêtes à charger, navigable au clavier.
function CommandPalette({
  ouvert, onFermer, onChargerStack, onNaviguerOnglet,
  onNouveauProjet, onBasculerTheme, onTelechargerCompose, onToutEffacer,
}) {
  const [requete, setRequete] = useState('')
  const [index, setIndex] = useState(0)
  const champRef = useRef(null)

  const commandes = useMemo(() => {
    const actions = [
      { id: 'nav-services', type: 'action', label: 'Aller à Services', executer: () => onNaviguerOnglet('services') },
      { id: 'nav-reseaux', type: 'action', label: 'Aller à Réseaux', executer: () => onNaviguerOnglet('reseaux') },
      { id: 'nav-apercu', type: 'action', label: 'Aller à Aperçu', executer: () => onNaviguerOnglet('apercu') },
      { id: 'nouveau-projet', type: 'action', label: '+ Nouveau projet', executer: onNouveauProjet },
      { id: 'theme', type: 'action', label: 'Basculer le thème clair/sombre', executer: onBasculerTheme },
      { id: 'telecharger', type: 'action', label: 'Télécharger docker-compose.yml', executer: onTelechargerCompose },
      { id: 'tout-effacer', type: 'action', label: 'Tout effacer les conteneurs du projet actif', executer: onToutEffacer },
    ]
    const stacksCmd = STACKS.map((s) => ({
      id: `stack-${s.id}`,
      type: 'stack',
      label: `Charger la stack « ${s.nom} »`,
      description: s.description,
      executer: () => onChargerStack(s),
    }))
    return [...actions, ...stacksCmd]
  }, [onChargerStack, onNaviguerOnglet, onNouveauProjet, onBasculerTheme, onTelechargerCompose, onToutEffacer])

  const filtrees = useMemo(() => {
    const q = requete.trim().toLowerCase()
    if (!q) return commandes.slice(0, 8)
    return commandes
      .filter((c) => c.label.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
      .slice(0, 20)
  }, [requete, commandes])

  useEffect(() => {
    setIndex(0)
  }, [requete])

  useEffect(() => {
    if (ouvert) {
      setRequete('')
      setIndex(0)
      const id = setTimeout(() => champRef.current?.focus(), 10)
      return () => clearTimeout(id)
    }
  }, [ouvert])

  function executer(cmd) {
    if (!cmd) return
    cmd.executer()
    onFermer()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, filtrees.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executer(filtrees[index])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onFermer()
    }
  }

  if (!ouvert) return null

  return (
    <div className="palette-fond" onClick={onFermer} role="presentation">
      <div className="palette-boite" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Palette de commandes">
        <input
          ref={champRef}
          type="text"
          className="palette-champ"
          placeholder="Rechercher une action ou une stack... (Échap pour fermer)"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="palette-liste">
          {filtrees.length === 0 && <p className="liste-vide">Aucun résultat pour « {requete} ».</p>}
          {filtrees.map((c, i) => (
            <button
              type="button"
              key={c.id}
              className={`palette-item ${i === index ? 'palette-item-actif' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => executer(c)}
            >
              <span className="palette-item-type">{c.type === 'stack' ? '📦' : '⚡'}</span>
              <span className="palette-item-texte">
                <span className="palette-item-label">{c.label}</span>
                {c.description && <span className="palette-item-desc">{c.description}</span>}
              </span>
            </button>
          ))}
        </div>
        <div className="palette-pied">↑↓ naviguer · Entrée choisir · Échap fermer</div>
      </div>
    </div>
  )
}

export default CommandPalette
