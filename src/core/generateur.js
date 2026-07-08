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

// Détecte si une clé de variable d'env ressemble à un secret (mot de passe, token...)
export function estSecret(cle) {
  return /PASSWORD|SECRET|TOKEN|_PASS$|API_KEY|PRIVATE/i.test(cle)
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
  const { extraireSecrets = false, nomProjet = '', networks = [] } = options

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
    const secretsEnv = extraireSecrets ? validEnv.filter((e) => estSecret(e.key)) : []
    const normalEnv = extraireSecrets ? validEnv.filter((e) => !estSecret(e.key)) : validEnv

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
export function buildEnvFiles(services) {
  const fichiers = []
  for (const service of services) {
    const secrets = (service.env || []).filter((e) => e.key && e.key.trim() !== '' && estSecret(e.key))
    if (secrets.length === 0) continue
    const contenu = secrets.map((e) => `${e.key}=${e.value || ''}`).join('\n') + '\n'
    fichiers.push({ nom: `.env.${service.name || 'service'}`, contenu })
  }
  return fichiers
}

// Valide la liste de services et renvoie erreurs/avertissements en français
export function validerServices(services, options = {}) {
  const { extraireSecrets = false } = options
  const erreurs = []
  const avertissements = []
  const nomsVus = new Set()
  const portsHostVus = new Set()

  services.forEach((service, i) => {
    const label = service.name || `service #${i + 1}`

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
      const secretsEnClair = (service.env || []).filter((e) => e.key && estSecret(e.key))
      if (secretsEnClair.length > 0) {
        avertissements.push(
          `Le service "${label}" a ${secretsEnClair.length === 1 ? 'un mot de passe' : 'des mots de passe'} en clair dans le YAML (${secretsEnClair.map((e) => e.key).join(', ')}). Active "Extraire les secrets" pour les isoler dans un fichier .env.`
        )
      }
    }

    const motsDePasseParDefaut = (service.env || []).filter(
      (e) => e.key && estSecret(e.key) && e.value === 'change_moi'
    )
    if (motsDePasseParDefaut.length > 0) {
      avertissements.push(
        `Le service "${label}" utilise encore la valeur par défaut "change_moi" pour ${motsDePasseParDefaut.map((e) => e.key).join(', ')} — génère un vrai mot de passe avant de déployer.`
      )
    }
  })

  return { erreurs, avertissements, valide: erreurs.length === 0 }
}
