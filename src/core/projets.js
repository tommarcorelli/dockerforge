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
    secretsInclus: [],
    secretsExclus: [],
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

// N'utilise jamais un throw ici : cette fonction est appelée depuis un
// useEffect à chaque changement d'état — une exception non interceptée y
// remonterait jusqu'au ErrorBoundary racine et afficherait un écran
// "erreur fatale" (avec option de tout effacer !) juste parce que le
// stockage local est plein ou indisponible, ce qui serait bien pire que de
// perdre silencieusement la dernière sauvegarde automatique.
export function sauvegarderProjets(data) {
  try {
    localStorage.setItem(CLE_PROJETS, JSON.stringify(data))
    return true
  } catch (err) {
    console.error('DockerForge — impossible de sauvegarder les projets (stockage plein ou indisponible) :', err)
    return false
  }
}

// Exporte un projet vers un objet JSON portable (sans son id interne), pour
// pouvoir le sauvegarder hors du navigateur ou le partager/réimporter ailleurs.
export function exporterProjet(projet) {
  return {
    formatDockerForge: 1,
    nom: projet.nom,
    services: projet.services,
    networks: projet.networks,
    nomProjet: projet.nomProjet,
    extraireSecrets: projet.extraireSecrets,
    secretsInclus: projet.secretsInclus || [],
    secretsExclus: projet.secretsExclus || [],
    exporteLe: Date.now(),
  }
}

// Reconstruit un projet interne complet à partir d'un JSON exporté par
// exporterProjet — régénère systématiquement tous les id (projet + chaque
// service) pour ne jamais entrer en collision avec un projet déjà présent.
export function importerProjet(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.services)) {
    throw new Error("Fichier JSON invalide : ce n'est pas un projet DockerForge exporté.")
  }
  return {
    id: idProjet(),
    nom: data.nom ? `${data.nom} (importé)` : 'Projet importé',
    services: data.services.map((s) => ({ ...s, id: crypto.randomUUID() })),
    networks: Array.isArray(data.networks) ? data.networks : [],
    nomProjet: data.nomProjet || '',
    extraireSecrets: !!data.extraireSecrets,
    secretsInclus: Array.isArray(data.secretsInclus) ? data.secretsInclus : [],
    secretsExclus: Array.isArray(data.secretsExclus) ? data.secretsExclus : [],
    creeLe: Date.now(),
    majLe: Date.now(),
  }
}

export { projetVide }
