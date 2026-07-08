// projets.js — gestion de plusieurs projets sauvegardés (multi-stacks)
// Chaque projet est un "navire" indépendant : ses propres services, réseaux,
// nom de compose et préférences. Tout est stocké en localStorage.

const CLE_PROJETS = 'dockerforge_projets'
const CLE_ANCIEN_FORMAT = 'dockerforge_services' // ancien format mono-projet, pour migration

function idProjet() {
  return crypto.randomUUID()
}

function projetVide(nom = 'Sans titre') {
  return {
    id: idProjet(),
    nom,
    services: [],
    networks: [],
    nomProjet: '',
    extraireSecrets: false,
    creeLe: Date.now(),
    majLe: Date.now(),
  }
}

// Charge tous les projets depuis le stockage. Migre automatiquement l'ancien
// format mono-projet s'il existe et qu'aucun projet n'a encore été créé.
export function chargerProjets() {
  try {
    const brut = localStorage.getItem(CLE_PROJETS)
    if (brut) {
      const data = JSON.parse(brut)
      if (data.projets && data.projets.length > 0) return data
    }
  } catch {
    // stockage corrompu, on repart de zéro
  }

  // Migration depuis l'ancien format (une seule liste de services)
  try {
    const ancien = localStorage.getItem(CLE_ANCIEN_FORMAT)
    if (ancien) {
      const services = JSON.parse(ancien)
      if (Array.isArray(services) && services.length > 0) {
        const p = projetVide('Mon premier projet')
        p.services = services
        return { projets: [p], actifId: p.id }
      }
    }
  } catch {
    // ignore
  }

  const p = projetVide('Mon premier projet')
  return { projets: [p], actifId: p.id }
}

export function sauvegarderProjets(data) {
  localStorage.setItem(CLE_PROJETS, JSON.stringify(data))
}

export { projetVide }
