// topologie.js — logique du schéma visuel de l'architecture (SchemaNavire.jsx)

// Regroupe les services par réseau Docker pour l'affichage en "compartiments".
// Un service sans réseau assigné tombe dans le groupe "par défaut".
export function grouperParReseau(services, networks) {
  const groupes = []
  const dejaGroupes = new Set()

  for (const reseau of networks || []) {
    const membres = services.filter((s) => (s.networks || []).includes(reseau.nom))
    if (membres.length > 0) {
      groupes.push({ nom: reseau.nom, defaut: false, services: membres })
      membres.forEach((s) => dejaGroupes.add(s.name))
    }
  }

  const restants = services.filter((s) => !dejaGroupes.has(s.name))
  if (restants.length > 0 || groupes.length === 0) {
    groupes.push({ nom: 'default', defaut: true, services: restants })
  }

  return groupes
}

// Construit les liens de dépendance (depends_on) entre services, pour tracer les flèches
export function construireLiens(services) {
  const noms = new Set(services.map((s) => s.name))
  const liens = []
  for (const s of services) {
    for (const dep of s.dependsOn || []) {
      if (noms.has(dep) && dep !== s.name) {
        liens.push({ de: dep, vers: s.name })
      }
    }
  }
  return liens
}

// Convertit une chaîne de limite mémoire ("512m", "1g", "1024") en mégaoctets
function parseMemoireMo(valeur) {
  if (!valeur) return 0
  const m = String(valeur).trim().match(/^(\d+(?:\.\d+)?)\s*(g|go|gb|m|mo|mb)?$/i)
  if (!m) return 0
  const nombre = parseFloat(m[1])
  const unite = (m[2] || 'm').toLowerCase()
  return unite.startsWith('g') ? nombre * 1024 : nombre
}

// Calcule une estimation grossière de la charge totale de la stack
// (mémoire + CPU cumulés) pour afficher une jauge indicative.
export function calculerCharge(services) {
  let memoireMo = 0
  let cpu = 0
  let servicesAvecLimite = 0

  for (const s of services) {
    const mem = parseMemoireMo(s.memLimit)
    const c = parseFloat(s.cpus) || 0
    if (mem > 0 || c > 0) servicesAvecLimite += 1
    memoireMo += mem
    cpu += c
  }

  const SEUIL_MO = 4096 // repère indicatif : ~4 Go = jauge pleine
  const ratio = memoireMo > 0 ? memoireMo / SEUIL_MO : servicesAvecLimite === 0 ? 0.15 : 0.3

  let niveau = 'leger'
  if (ratio >= 1) niveau = 'surcharge'
  else if (ratio >= 0.5) niveau = 'charge'

  return {
    memoireMo,
    cpu,
    servicesAvecLimite,
    totalServices: services.length,
    ratio,
    niveau,
  }
}
