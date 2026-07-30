// favoris.js — stacks marquées comme favorites par l'utilisateur (StackPresets)
// Stockage global (pas propre à un projet), même logique défensive que
// modeles.js/projets.js : jamais de throw, un localStorage plein ou
// indisponible ne doit jamais faire planter l'application.

const CLE_FAVORIS = 'dockerforge_favoris_stacks'

// Renvoie l'ensemble des ids de stacks marquées comme favorites.
export function chargerFavoris() {
  try {
    const brut = localStorage.getItem(CLE_FAVORIS)
    const liste = brut ? JSON.parse(brut) : []
    return Array.isArray(liste) ? liste.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function sauvegarderFavoris(liste) {
  try {
    localStorage.setItem(CLE_FAVORIS, JSON.stringify(liste))
    return true
  } catch (err) {
    console.error('DockerForge — impossible de sauvegarder les favoris (stockage plein ou indisponible) :', err)
    return false
  }
}

// Ajoute ou retire l'id donné de la liste des favoris, puis renvoie la
// nouvelle liste (à stocker dans le state React qui pilote l'affichage).
export function basculerFavori(id) {
  const liste = chargerFavoris()
  const dejaPresent = liste.includes(id)
  const nouvelle = dejaPresent ? liste.filter((x) => x !== id) : [...liste, id]
  sauvegarderFavoris(nouvelle)
  return nouvelle
}
