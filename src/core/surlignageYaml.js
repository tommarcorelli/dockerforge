// surlignageYaml.js — coloration syntaxique légère de l'aperçu docker-compose.yml
// Pas de librairie externe (le YAML généré par DockerForge est prévisible et
// simple) : un découpage par expressions régulières, ligne par ligne, suffit
// largement et évite d'alourdir le bundle avec un vrai moteur de coloration.

const RE_COMMENTAIRE = /^(\s*)(#.*)$/
const RE_CLE = /^(\s*(?:-\s+)?)([A-Za-z0-9_.\-/"']+)(:)(\s|$)/
const RE_TIRET_SEUL = /^(\s*)(-\s+)(.*)$/
const RE_CHAINE = /^(['"]).*\1$/
const RE_NOMBRE = /^-?\d+(\.\d+)?$/
const RE_BOOL = /^(true|false|yes|no|null|~)$/i

// Découpe une valeur (après le ":") en segments colorés selon son type.
function tokeniserValeur(texte) {
  const espacesDebut = texte.match(/^\s*/)[0]
  const valeur = texte.slice(espacesDebut.length)
  if (!valeur) return [{ texte, classe: null }]

  let classe = null
  if (RE_CHAINE.test(valeur)) classe = 'yaml-chaine'
  else if (RE_NOMBRE.test(valeur)) classe = 'yaml-nombre'
  else if (RE_BOOL.test(valeur)) classe = 'yaml-bool'

  return [
    { texte: espacesDebut, classe: null },
    { texte: valeur, classe },
  ]
}

// Découpe une ligne complète de YAML en segments {texte, classe} à afficher.
// classe vaut null pour du texte "normal" (pas de coloration).
export function tokeniserLigneYaml(ligne) {
  const matchCommentaire = ligne.match(RE_COMMENTAIRE)
  if (matchCommentaire) {
    return [
      { texte: matchCommentaire[1], classe: null },
      { texte: matchCommentaire[2], classe: 'yaml-commentaire' },
    ]
  }

  const matchCle = ligne.match(RE_CLE)
  if (matchCle) {
    const [complet, prefixe, cle, deuxPoints, apres] = matchCle
    const reste = ligne.slice(complet.length)
    const segments = [
      { texte: prefixe, classe: 'yaml-tiret' },
      { texte: cle, classe: 'yaml-cle' },
      { texte: deuxPoints + apres, classe: null },
    ]
    if (reste) segments.push(...tokeniserValeur(reste))
    return segments
  }

  const matchTiret = ligne.match(RE_TIRET_SEUL)
  if (matchTiret) {
    return [
      { texte: matchTiret[1], classe: null },
      { texte: matchTiret[2], classe: 'yaml-tiret' },
      ...tokeniserValeur(matchTiret[3]),
    ]
  }

  return [{ texte: ligne, classe: null }]
}
