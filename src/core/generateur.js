// generateur.js — construit le YAML du docker-compose.yml à partir des services

// Échappe une valeur si elle contient des caractères spéciaux YAML
// Un ":" simple (ex: "nginx:latest") n'a besoin de guillemets que s'il est
// suivi d'un espace ou en fin de chaîne — sinon YAML le lit très bien tel quel.
function yamlValue(value) {
  if (value === '') return '""'
  const needsQuotes =
    /[#{}\[\],&*!|>'"%@`]/.test(value) ||
    /:(\s|$)/.test(value) ||
    /^\s|\s$/.test(value) ||
    /^(true|false|null|yes|no|~)$/i.test(value) ||
    /^-?\d+(\.\d+)?$/.test(value)
  return needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value
}

export const POLITIQUES_RESTART = [
  { valeur: 'unless-stopped', label: 'Sauf arrêt manuel (recommandé)' },
  { valeur: 'always', label: 'Toujours' },
  { valeur: 'on-failure', label: 'En cas d\'échec seulement' },
  { valeur: 'no', label: 'Jamais' },
]

// Extrait le tag d'une image Docker ("nginx:1.25" -> "1.25"), en tenant
// compte d'un éventuel registre privé avec port ("registry.local:5000/app").
// Renvoie null si aucun tag n'est précisé (donc "latest" implicite).
function tagImage(image) {
  const img = String(image || '').trim()
  const derniereSlash = img.lastIndexOf('/')
  const dernierSegment = derniereSlash === -1 ? img : img.slice(derniereSlash + 1)
  const idx = dernierSegment.indexOf(':')
  return idx === -1 ? null : dernierSegment.slice(idx + 1)
}

// Détecte si une clé de variable d'env ressemble à un secret (mot de passe,
// token, clé applicative...). `options.exclusions` (liste blanche) est
// prioritaire sur tout : une clé qui y figure n'est jamais traitée comme un
// secret. `options.inclusions` (liste noire) force l'inverse pour une clé qui
// ne correspondrait pas aux motifs habituels.
export function estSecret(cle, options = {}) {
  const { inclusions = [], exclusions = [] } = options
  const c = (cle || '').toUpperCase().trim()
  if (!c) return false
  if (exclusions.some((x) => (x || '').toUpperCase().trim() === c)) return false
  if (inclusions.some((x) => (x || '').toUpperCase().trim() === c)) return true
  // Le dernier motif (^|_)KEY$ couvre aussi les clés applicatives comme
  // APP_KEY ou SSH_KEY, qui ne contiennent ni "password" ni "secret" mais
  // doivent être traitées comme sensibles au même titre (cohérent avec
  // estCleApplicative() dans ServiceForm.jsx).
  return /PASSWORD|SECRET|TOKEN|_PASS$|API_KEY|PRIVATE|(^|_)KEY$/i.test(cle)
}

// Un volume est "nommé" (géré par Docker) si sa source ne commence pas par
// ./ ../ / ~ — sinon c'est un montage lié (bind mount) vers un dossier local.
export function estVolumeNomme(volumeStr) {
  const source = (volumeStr || '').split(':')[0].trim()
  if (!source) return false
  return !/^(\.{1,2}\/|\/|~)/.test(source)
}

// Récupère l'ensemble des noms de volumes nommés utilisés par tous les services
export function collecterVolumesNommes(services) {
  const noms = new Set()
  for (const s of services || []) {
    for (const v of s.volumes || []) {
      if (v && v.trim() !== '' && estVolumeNomme(v)) {
        noms.add(v.split(':')[0].trim())
      }
    }
  }
  return noms
}

export function buildDockerCompose(services, options = {}) {
  const { extraireSecrets = false, nomProjet = '', networks = [], secretsInclus = [], secretsExclus = [] } = options
  const optsSecret = { inclusions: secretsInclus, exclusions: secretsExclus }

  if (!services || services.length === 0) {
    return '# Ajoute au moins un service pour générer le docker-compose.yml\n'
  }

  const lines = []

  if (nomProjet && nomProjet.trim() !== '') {
    lines.push(`name: ${yamlValue(nomProjet.trim())}`)
    lines.push('')
  }

  lines.push('services:')

  for (const service of services) {
    const name = service.name || 'service_sans_nom'
    lines.push(`  ${name}:`)
    lines.push(`    image: ${yamlValue(service.image || 'nginx:latest')}`)

    if (service.profiles && service.profiles.length > 0) {
      lines.push('    profiles:')
      for (const p of service.profiles) {
        lines.push(`      - ${p}`)
      }
    }

    if (service.ports && service.ports.length > 0) {
      const validPorts = service.ports.filter((p) => p.host && p.container)
      if (validPorts.length > 0) {
        lines.push('    ports:')
        for (const p of validPorts) {
          lines.push(`      - "${p.host}:${p.container}"`)
        }
      }
    }

    if (service.volumes && service.volumes.length > 0) {
      const validVolumes = service.volumes.filter((v) => v && v.trim() !== '')
      if (validVolumes.length > 0) {
        lines.push('    volumes:')
        for (const v of validVolumes) {
          lines.push(`      - ${v}`)
        }
      }
    }

    const validEnv = (service.env || []).filter((e) => e.key && e.key.trim() !== '')
    const secretsEnv = extraireSecrets ? validEnv.filter((e) => estSecret(e.key, optsSecret)) : []
    const normalEnv = extraireSecrets ? validEnv.filter((e) => !estSecret(e.key, optsSecret)) : validEnv

    if (secretsEnv.length > 0) {
      lines.push(`    env_file:`)
      lines.push(`      - .env.${name}`)
    }

    if (normalEnv.length > 0) {
      lines.push('    environment:')
      for (const e of normalEnv) {
        lines.push(`      ${e.key}: ${yamlValue(e.value || '')}`)
      }
    }

    if (service.dependsOn && service.dependsOn.length > 0) {
      lines.push('    depends_on:')
      for (const dep of service.dependsOn) {
        lines.push(`      - ${dep}`)
      }
    }

    if (service.healthcheck && service.healthcheck.enabled && service.healthcheck.test) {
      lines.push('    healthcheck:')
      lines.push(`      test: ["CMD-SHELL", ${yamlValue(service.healthcheck.test)}]`)
      lines.push(`      interval: ${service.healthcheck.interval || '30s'}`)
      lines.push(`      timeout: ${service.healthcheck.timeout || '5s'}`)
      lines.push(`      retries: ${service.healthcheck.retries || 3}`)
    }

    if (service.memLimit && service.memLimit.trim() !== '') {
      lines.push(`    mem_limit: ${service.memLimit}`)
    }
    if (service.cpus && service.cpus.trim() !== '') {
      lines.push(`    cpus: "${service.cpus}"`)
    }

    if (service.networks && service.networks.length > 0) {
      lines.push('    networks:')
      for (const net of service.networks) {
        lines.push(`      - ${net}`)
      }
    }

    lines.push(`    restart: ${service.restart || 'unless-stopped'}`)
    lines.push('')
  }

  if (options.networks && options.networks.length > 0) {
    lines.push('networks:')
    for (const net of options.networks) {
      lines.push(`  ${net.nom}:`)
      lines.push(`    driver: ${net.driver || 'bridge'}`)
    }
    lines.push('')
  }

  const volumesNommes = collecterVolumesNommes(services)
  if (volumesNommes.size > 0) {
    lines.push('volumes:')
    for (const nom of volumesNommes) {
      lines.push(`  ${nom}:`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

// Construit le contenu des fichiers .env.<service> pour les variables sensibles,
// un fichier par service qui en a besoin. Renvoie [{ nom, contenu }].
export function buildEnvFiles(services, options = {}) {
  const { secretsInclus = [], secretsExclus = [] } = options
  const optsSecret = { inclusions: secretsInclus, exclusions: secretsExclus }
  const fichiers = []
  for (const service of services) {
    const secrets = (service.env || []).filter((e) => e.key && e.key.trim() !== '' && estSecret(e.key, optsSecret))
    if (secrets.length === 0) continue
    const contenu = secrets.map((e) => `${e.key}=${e.value || ''}`).join('\n') + '\n'
    fichiers.push({ nom: `.env.${service.name || 'service'}`, contenu })
  }
  return fichiers
}

// Échappe une valeur pour une commande shell (sh/bash) : simple guillemets,
// en échappant les guillemets simples internes. Les tokens "simples" (sans
// caractère spécial) restent tels quels pour rester lisibles.
function shValue(valeur) {
  const v = valeur === undefined || valeur === null ? '' : String(valeur)
  if (v === '') return "''"
  if (/^[A-Za-z0-9_.\-/:@%+=,]+$/.test(v)) return v
  return `'${v.replace(/'/g, "'\\''")}'`
}

// Construit un script shell de commandes "docker run" équivalentes au
// docker-compose.yml généré — utile pour qui veut lancer les conteneurs sans
// installer docker-compose, ou juste comprendre ce que fait chaque service.
// docker run n'a pas d'équivalent direct à "depends_on" (ordre de démarrage)
// ni aux profils : on le signale en commentaire plutôt que de l'ignorer.
export function buildDockerRunScript(services, options = {}) {
  const { extraireSecrets = false, networks = [], secretsInclus = [], secretsExclus = [] } = options
  const optsSecret = { inclusions: secretsInclus, exclusions: secretsExclus }

  if (!services || services.length === 0) {
    return '# Ajoute au moins un service pour générer les commandes docker run\n'
  }

  const lignes = [
    '#!/bin/sh',
    '# Commandes docker run équivalentes, générées par DockerForge.',
    "# docker run ne gère pas l'ordre de démarrage (pas d'équivalent à",
    '# "depends_on") : lance d\'abord les services dont dépendent les autres.',
    '',
  ]

  if (networks.length > 0) {
    lignes.push('# --- Réseaux personnalisés (à exécuter une seule fois) ---')
    for (const n of networks) {
      lignes.push(`docker network create --driver ${n.driver || 'bridge'} ${shValue(n.nom)}`)
    }
    lignes.push('')
  }

  for (const service of services) {
    const name = service.name || 'service_sans_nom'
    lignes.push(`# --- ${name} ---`)
    if (service.dependsOn && service.dependsOn.length > 0) {
      lignes.push(`# démarre après : ${service.dependsOn.join(', ')}`)
    }
    if (service.profiles && service.profiles.length > 0) {
      lignes.push(`# profil(s) d'origine (sans effet avec docker run) : ${service.profiles.join(', ')}`)
    }

    const parts = ['docker run -d', `--name ${shValue(name)}`, `--restart ${service.restart || 'unless-stopped'}`]

    const validEnv = (service.env || []).filter((e) => e.key && e.key.trim() !== '')
    const secretsEnv = extraireSecrets ? validEnv.filter((e) => estSecret(e.key, optsSecret)) : []
    const normalEnv = extraireSecrets ? validEnv.filter((e) => !estSecret(e.key, optsSecret)) : validEnv

    if (secretsEnv.length > 0) parts.push(`--env-file .env.${name}`)

    const reseauxService = service.networks || []
    if (reseauxService.length > 0) parts.push(`--network ${shValue(reseauxService[0])}`)

    for (const p of (service.ports || []).filter((p) => p.host && p.container)) {
      parts.push(`-p ${p.host}:${p.container}`)
    }
    for (const v of (service.volumes || []).filter((v) => v && v.trim() !== '')) {
      parts.push(`-v ${shValue(v)}`)
    }
    for (const e of normalEnv) {
      parts.push(`-e ${e.key}=${shValue(e.value || '')}`)
    }
    if (service.healthcheck && service.healthcheck.enabled && service.healthcheck.test) {
      parts.push(`--health-cmd ${shValue(service.healthcheck.test)}`)
      parts.push(`--health-interval ${service.healthcheck.interval || '30s'}`)
      parts.push(`--health-timeout ${service.healthcheck.timeout || '5s'}`)
      parts.push(`--health-retries ${service.healthcheck.retries || 3}`)
    }
    if (service.memLimit && service.memLimit.trim() !== '') parts.push(`-m ${shValue(service.memLimit)}`)
    if (service.cpus && service.cpus.trim() !== '') parts.push(`--cpus ${shValue(service.cpus)}`)
    parts.push(shValue(service.image || 'nginx:latest'))

    lignes.push(parts.join(' \\\n  '))

    // docker run n'accepte qu'un seul --network au lancement ; les réseaux
    // supplémentaires nécessitent une connexion après coup.
    for (const n of reseauxService.slice(1)) {
      lignes.push(`docker network connect ${shValue(n)} ${shValue(name)}`)
    }

    lignes.push('')
  }

  return lignes.join('\n').trimEnd() + '\n'
}

// Valide la liste de services et renvoie erreurs/avertissements en français
export function validerServices(services, options = {}) {
  const { extraireSecrets = false, secretsInclus = [], secretsExclus = [] } = options
  const optsSecret = { inclusions: secretsInclus, exclusions: secretsExclus }
  const erreurs = []
  const avertissements = []
  const nomsVus = new Set()
  const portsHostVus = new Set()
  const nomsServices = new Set(services.map((s) => s.name).filter(Boolean))

  services.forEach((service, i) => {
    const label = service.name || `service #${i + 1}`

    for (const dep of service.dependsOn || []) {
      if (dep === service.name) {
        erreurs.push(`Le service "${label}" ne peut pas dépendre de lui-même.`)
      } else if (!nomsServices.has(dep)) {
        erreurs.push(`Le service "${label}" dépend de "${dep}", qui n'existe pas (ou plus) dans ce projet.`)
      }
    }

    if (!service.name || service.name.trim() === '') {
      erreurs.push(`Le service #${i + 1} n'a pas de nom.`)
    } else if (nomsVus.has(service.name)) {
      erreurs.push(`Le nom de service "${service.name}" est utilisé plusieurs fois.`)
    } else {
      nomsVus.add(service.name)
    }

    if (!service.image || service.image.trim() === '') {
      erreurs.push(`Le service "${label}" n'a pas d'image Docker définie.`)
    }

    for (const p of service.ports || []) {
      const hostNum = Number(p.host)
      if (p.host && portsHostVus.has(p.host)) {
        erreurs.push(`Le port hôte ${p.host} est utilisé par plusieurs services.`)
      } else if (p.host) {
        portsHostVus.add(p.host)
      }
      if (p.host && (hostNum < 1 || hostNum > 65535)) {
        erreurs.push(`Le port hôte ${p.host} du service "${label}" est invalide (1-65535).`)
      }
    }

    if (!service.volumes || service.volumes.every((v) => !v || v.trim() === '')) {
      avertissements.push(`Le service "${label}" n'a aucun volume : ses données seront perdues à l'arrêt du conteneur.`)
    }

    if (!extraireSecrets) {
      const secretsEnClair = (service.env || []).filter((e) => e.key && estSecret(e.key, optsSecret))
      if (secretsEnClair.length > 0) {
        avertissements.push(
          `Le service "${label}" a ${secretsEnClair.length === 1 ? 'un mot de passe' : 'des mots de passe'} en clair dans le YAML (${secretsEnClair.map((e) => e.key).join(', ')}). Active "Extraire les secrets" pour les isoler dans un fichier .env.`
        )
      }
    }

    const motsDePasseParDefaut = (service.env || []).filter(
      (e) => e.key && estSecret(e.key, optsSecret) && e.value === 'change_moi'
    )
    if (motsDePasseParDefaut.length > 0) {
      avertissements.push(
        `Le service "${label}" utilise encore la valeur par défaut "change_moi" pour ${motsDePasseParDefaut.map((e) => e.key).join(', ')} — génère un vrai mot de passe avant de déployer.`
      )
    }

    if (service.image && tagImage(service.image) === null) {
      avertissements.push(
        `Le service "${label}" utilise l'image "${service.image}" sans version figée (tag implicite "latest") — précise une version (ex: "${service.image}:1.2.3") pour des déploiements reproductibles.`
      )
    } else if (service.image && tagImage(service.image) === 'latest') {
      avertissements.push(
        `Le service "${label}" utilise explicitement le tag "latest" — pratique pour tester, mais déconseillé en production car la version peut changer sans prévenir.`
      )
    }
  })

  return { erreurs, avertissements, valide: erreurs.length === 0 }
}
