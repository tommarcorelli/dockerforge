// modeles.js — modèles de service personnalisés, réutilisables entre projets.
// Contrairement aux projets, les modèles sont partagés globalement (pas
// propres à un projet) : pratique pour rejouer rapidement une config qui
// revient souvent (ex: un pattern de TP) sans repasser par le catalogue.

import { trouverPortLibre } from './catalogue.js'

const CLE_MODELES = 'dockerforge_modeles'

export function chargerModeles() {
  try {
    const brut = localStorage.getItem(CLE_MODELES)
    const liste = brut ? JSON.parse(brut) : []
    return Array.isArray(liste) ? liste : []
  } catch {
    return []
  }
}

// N'utilise jamais un throw ici : un localStorage plein (quota dépassé) ou
// indisponible (navigation privée sur certains navigateurs) ne doit jamais
// faire planter toute l'application — au pire, le modèle reste en mémoire
// pour la session en cours mais ne survit pas à un rechargement de page.
function sauvegarderModeles(liste) {
  try {
    localStorage.setItem(CLE_MODELES, JSON.stringify(liste))
    return true
  } catch (err) {
    console.error('DockerForge — impossible de sauvegarder les modèles (stockage plein ou indisponible) :', err)
    return false
  }
}

// Enregistre un service (tel qu'affiché dans la liste) comme modèle
// réutilisable. Renvoie la liste à jour (à stocker dans le state React).
export function ajouterModele(service, nom) {
  const liste = chargerModeles()
  const { id, ...donnees } = service
  const modele = {
    id: crypto.randomUUID(),
    nom: (nom || '').trim() || service.name || 'Modèle sans nom',
    service: donnees,
    creeLe: Date.now(),
  }
  const nouvelle = [...liste, modele]
  sauvegarderModeles(nouvelle)
  return nouvelle
}

export function supprimerModele(id) {
  const nouvelle = chargerModeles().filter((m) => m.id !== id)
  sauvegarderModeles(nouvelle)
  return nouvelle
}

// Construit un service concret à partir d'un modèle, prêt à être ajouté au
// projet actif : nouvel id, port ajusté en cas de conflit avec l'existant.
export function instancierModele(modele, portsUtilisesInitial) {
  const utilises = new Set(portsUtilisesInitial)
  const s = modele.service
  const ports = (s.ports || []).map((p) => {
    if (!p.host) return { host: '', container: String(p.container || '') }
    const port = trouverPortLibre(p.host, utilises)
    if (Number.isFinite(Number(port))) utilises.add(Number(port))
    return { host: String(port), container: String(p.container) }
  })
  return {
    ...s,
    id: crypto.randomUUID(),
    ports: ports.length > 0 ? ports : [{ host: '', container: '' }],
  }
}
