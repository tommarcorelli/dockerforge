import { useMemo, useState, useRef } from 'react'
import { grouperParReseau, construireLiens, calculerCharge } from '../core/topologie.js'
import { deviner_teinte } from '../core/catalogue.js'

const COULEURS = {
  cyan: '#3b6fea',
  orange: '#ee7d3d',
  jaune: '#d99a1f',
  steel: '#6b7280',
}

const LARGEUR_CONTENEUR = 148
const HAUTEUR_CONTENEUR = 62
const ESPACE_X = 24
const ESPACE_Y = 36
const PADDING_GROUPE = 22
const HAUTEUR_ENTETE_GROUPE = 30

// Calcule la position de chaque service dans son groupe (grille simple)
function calculerLayout(groupes) {
  let yCourant = 20
  const positions = new Map() // nom service -> {x, y, groupeIndex}
  const groupesPositionnes = []

  groupes.forEach((groupe, gi) => {
    const nbColonnes = Math.max(1, Math.min(3, groupe.services.length))
    const nbLignes = Math.ceil(groupe.services.length / nbColonnes) || 1
    const largeurGroupe = nbColonnes * LARGEUR_CONTENEUR + (nbColonnes - 1) * ESPACE_X + PADDING_GROUPE * 2
    const hauteurGroupe =
      HAUTEUR_ENTETE_GROUPE +
      nbLignes * HAUTEUR_CONTENEUR +
      (nbLignes - 1) * ESPACE_Y +
      PADDING_GROUPE * 2

    groupe.services.forEach((s, i) => {
      const col = i % nbColonnes
      const ligne = Math.floor(i / nbColonnes)
      const x = PADDING_GROUPE + col * (LARGEUR_CONTENEUR + ESPACE_X)
      const y = yCourant + HAUTEUR_ENTETE_GROUPE + PADDING_GROUPE + ligne * (HAUTEUR_CONTENEUR + ESPACE_Y)
      positions.set(s.name, { x, y, largeurGroupe })
    })

    groupesPositionnes.push({
      ...groupe,
      y: yCourant,
      largeur: largeurGroupe,
      hauteur: hauteurGroupe,
    })

    yCourant += hauteurGroupe + 30
  })

  const largeurTotale = Math.max(...groupesPositionnes.map((g) => g.largeur), 400) + 40
  const hauteurTotale = yCourant + 20

  return { positions, groupesPositionnes, largeurTotale, hauteurTotale }
}

// Construit un chemin de courbe entre deux conteneurs pour représenter une dépendance
function cheminCourbe(x1, y1, x2, y2) {
  const dx = (x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

function SchemaNavire({ services, networks }) {
  const [survole, setSurvole] = useState(null)
  const svgRef = useRef(null)

  const groupes = useMemo(() => grouperParReseau(services, networks), [services, networks])
  const liens = useMemo(() => construireLiens(services), [services])
  const charge = useMemo(() => calculerCharge(services), [services])
  const layout = useMemo(() => calculerLayout(groupes), [groupes])

  // Exporte le schéma en fichier .svg autonome : les classes CSS du schéma
  // dépendent de variables (--ink, --docker...) définies sur :root dans
  // index.css, absentes d'un fichier ouvert seul — on les résout donc ici
  // en couleurs concrètes (selon le thème actif) avant de sérialiser.
  function exporterSvg() {
    const svgEl = svgRef.current
    if (!svgEl) return
    const clone = svgEl.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const cs = getComputedStyle(document.documentElement)
    const val = (nom, repli) => (cs.getPropertyValue(nom) || '').trim() || repli
    const sombre = document.documentElement.getAttribute('data-theme') === 'sombre'

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = `
      .groupe-rect { fill: ${sombre ? 'rgba(74, 169, 255, 0.06)' : 'rgba(36, 150, 237, 0.05)'}; stroke: ${val('--line', '#d8dee8')}; stroke-width: 1.5; stroke-dasharray: 6 5; }
      .groupe-defaut { fill: rgba(139, 160, 176, 0.05); }
      .groupe-label { fill: ${val('--muted', '#6b7280')}; font-size: 11px; font-family: monospace; letter-spacing: 0.03em; }
      .lien-dependance { stroke: ${val('--line-strong', '#b8c2d0')}; stroke-width: 1.5; fill: none; }
      .lien-actif { stroke: ${val('--docker', '#2496ed')}; stroke-width: 2.4; }
      .conteneur-svg-nom { fill: ${val('--ink', '#12181f')}; font-size: 12px; font-weight: 700; font-family: sans-serif; }
      .conteneur-svg-image { fill: ${val('--muted', '#6b7280')}; font-size: 9.5px; font-family: monospace; }
      .conteneur-svg-port { fill: ${val('--docker', '#2496ed')}; font-size: 9.5px; font-family: monospace; font-weight: 600; }
    `
    clone.insertBefore(style, clone.firstChild)

    const fond = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    fond.setAttribute('x', '0')
    fond.setAttribute('y', '0')
    fond.setAttribute('width', '100%')
    fond.setAttribute('height', '100%')
    fond.setAttribute('fill', val('--panel', '#ffffff'))
    clone.insertBefore(fond, clone.firstChild)

    const source = '<?xml version="1.0" standalone="no"?>\n' + new XMLSerializer().serializeToString(clone)
    const blob = new Blob([source], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dockerforge-schema.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (services.length === 0) {
    return (
      <div className="schema-vide">
        <p>Ajoute des conteneurs pour voir le schéma du navire se dessiner.</p>
      </div>
    )
  }

  const { positions, groupesPositionnes, largeurTotale, hauteurTotale } = layout

  const labelCharge = {
    leger: 'Charge légère',
    charge: 'Charge notable',
    surcharge: 'Surcharge probable',
  }[charge.niveau]

  return (
    <div className="schema-navire">
      <div className="jauge-charge">
        <div className="jauge-tete">
          <span className="jauge-titre">Jauge de charge du navire</span>
          <span className={`jauge-etiquette jauge-${charge.niveau}`}>{labelCharge}</span>
        </div>
        <div className="jauge-barre">
          <div
            className={`jauge-remplissage jauge-remplissage-${charge.niveau}`}
            style={{ width: `${Math.min(charge.ratio, 1) * 100}%` }}
          />
        </div>
        <div className="jauge-detail">
          <span>{charge.memoireMo > 0 ? `${(charge.memoireMo / 1024).toFixed(1)} Go RAM` : 'RAM non limitée'}</span>
          <span>{charge.cpu > 0 ? `${charge.cpu} CPU` : 'CPU non limité'}</span>
          <span>{charge.servicesAvecLimite}/{charge.totalServices} conteneur(s) avec limites définies</span>
        </div>
      </div>

      <div className="schema-bandeau-outils">
        <button type="button" className="btn-discret" onClick={exporterSvg}>
          ⬇ Exporter le schéma en .svg
        </button>
      </div>

      <div className="schema-scroll">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${largeurTotale} ${hauteurTotale}`}
          width="100%"
          height={Math.min(hauteurTotale, 520)}
          style={{ minWidth: '100%' }}
        >
          <defs>
            <marker id="fleche" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--cyan, #3b6fea)" />
            </marker>
          </defs>

          {/* Groupes / réseaux */}
          {groupesPositionnes.map((g) => (
            <g key={g.nom}>
              <rect
                x={0}
                y={g.y}
                width={g.largeur}
                height={g.hauteur}
                rx="10"
                className={`groupe-rect ${g.defaut ? 'groupe-defaut' : ''}`}
              />
              <text x={16} y={g.y + 20} className="groupe-label">
                {g.defaut ? '⛴ réseau par défaut' : `🔗 ${g.nom}`}
              </text>
            </g>
          ))}

          {/* Liens de dépendance */}
          {liens.map((lien, i) => {
            const de = positions.get(lien.de)
            const vers = positions.get(lien.vers)
            if (!de || !vers) return null
            const x1 = de.x + LARGEUR_CONTENEUR / 2
            const y1 = de.y
            const x2 = vers.x + LARGEUR_CONTENEUR / 2
            const y2 = vers.y + HAUTEUR_CONTENEUR
            const actif = survole === lien.de || survole === lien.vers
            return (
              <path
                key={i}
                d={cheminCourbe(x1, y1, x2, y2)}
                className={`lien-dependance ${actif ? 'lien-actif' : ''}`}
                markerEnd="url(#fleche)"
                fill="none"
              />
            )
          })}

          {/* Conteneurs */}
          {services.map((s) => {
            const pos = positions.get(s.name)
            if (!pos) return null
            const teinte = deviner_teinte(s.image)
            const ports = (s.ports || []).filter((p) => p.host && p.container)
            return (
              <g
                key={s.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => setSurvole(s.name)}
                onMouseLeave={() => setSurvole(null)}
                className="conteneur-svg"
              >
                <rect
                  width={LARGEUR_CONTENEUR}
                  height={HAUTEUR_CONTENEUR}
                  rx="6"
                  fill="var(--blueprint-panel, #ffffff)"
                  stroke={COULEURS[teinte]}
                  strokeWidth={survole === s.name ? 2.5 : 1.5}
                />
                <rect width="6" height={HAUTEUR_CONTENEUR} fill={COULEURS[teinte]} rx="2" />
                <text x={14} y={20} className="conteneur-svg-nom">{s.name}</text>
                <text x={14} y={36} className="conteneur-svg-image">
                  {s.image.length > 18 ? s.image.slice(0, 17) + '…' : s.image}
                </text>
                {ports.length > 0 && (
                  <text x={14} y={52} className="conteneur-svg-port">
                    ⏻ {ports.map((p) => p.host).join(', ')}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default SchemaNavire
