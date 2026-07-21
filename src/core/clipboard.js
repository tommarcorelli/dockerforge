// clipboard.js — copie presse-papier robuste, avec repli.
//
// navigator.clipboard peut être absent (contexte non-HTTPS) ou son appel
// rejeté (permission refusée, document non focus, restrictions de certains
// navigateurs embarqués...). Sans filet, la promesse rejetée finit en erreur
// non interceptée dans la console et l'appelant n'a aucun moyen de savoir
// que la copie a échoué pour proposer un retour visuel adapté.
//
// copierTexte() tente l'API moderne, puis un repli via un <textarea> caché
// et document.execCommand('copy') si elle échoue ou est indisponible.
// Renvoie une Promise<boolean> : true si la copie a réussi par un des deux
// moyens, false sinon (l'appelant peut alors éviter d'afficher "Copié !").
export async function copierTexte(texte) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(texte)
      return true
    } catch {
      // on retente avec le repli ci-dessous plutôt que d'abandonner
    }
  }

  try {
    const zoneTemp = document.createElement('textarea')
    zoneTemp.value = texte
    zoneTemp.style.position = 'fixed'
    zoneTemp.style.opacity = '0'
    document.body.appendChild(zoneTemp)
    zoneTemp.select()
    const succes = document.execCommand('copy')
    document.body.removeChild(zoneTemp)
    return succes
  } catch {
    return false
  }
}
