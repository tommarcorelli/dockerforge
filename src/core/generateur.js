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

// Petit résumé chiffré de l'état "sécurité/bonnes pratiques" du projet — pas
// une vraie analyse de sécurité, juste un coup d'œil rapide sur des points
// déjà vérifiés individuellement ailleurs (secrets, healthcheck, tags...),
// pour donner une vue d'ensemble sans avoir à les recompter à la main.
export function auditSecurite(services, options = {}) {
  const { extraireSecrets = false, secretsInclus = [], secretsExclus = [] } = options
  const optsSecret = { inclusions: secretsInclus, exclusions: secretsExclus }

  let portsExposes = 0
  let servicesAvecHealthcheck = 0
  let secretsEnClair = 0
  let motsDePasseParDefaut = 0
  let tagsNonFiges = 0

  for (const s of services) {
    portsExposes += (s.ports || []).filter((p) => p.host && p.container).length
    if (s.healthcheck && s.healthcheck.enabled) servicesAvecHealthcheck += 1

    const secretsService = (s.env || []).filter((e) => e.key && estSecret(e.key, optsSecret))
    if (!extraireSecrets) secretsEnClair += secretsService.length
    motsDePasseParDefaut += secretsService.filter((e) => estValeurFaible(e.value)).length

    if (s.image && (tagImage(s.image) === null || tagImage(s.image) === 'latest')) tagsNonFiges += 1
  }

  const totalServices = services.length
  let niveau = 'bon'
  if (motsDePasseParDefaut > 0 || secretsEnClair > 0) niveau = 'a_ameliorer'
  else if (tagsNonFiges > 0 || servicesAvecHealthcheck < totalServices) niveau = 'moyen'

  return {
    totalServices,
    portsExposes,
    servicesAvecHealthcheck,
    secretsEnClair,
    motsDePasseParDefaut,
    tagsNonFiges,
    niveau,
  }
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

// Génère un mot de passe aléatoire robuste (32 caractères, alphanumérique
// sans caractères ambigus type 0/O ou 1/l), utilisable partout où il faut
// remplacer une valeur d'exemple par un vrai secret.
export function genererMotDePasse() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const tableau = new Uint32Array(32)
  crypto.getRandomValues(tableau)
  return Array.from(tableau, (n) => alphabet[n % alphabet.length]).join('')
}

// Reconnaît une valeur de secret "faible" : vide, ou un des mots de passe
// d'exemple utilisés par les stacks prêtes à l'emploi de DockerForge
// (change_moi, admin, password...) — sert à ne régénérer que ce qui a
// vraiment besoin de l'être, sans écraser un mot de passe déjà personnalisé.
export function estValeurFaible(valeur) {
  const v = (valeur || '').trim().toLowerCase()
  if (v === '') return true
  if (v.startsWith('change_moi') || v.startsWith('change-moi') || v.startsWith('changeme')) return true
  return [
    'change_moi', 'changeme', 'change-me', 'changer_moi', 'password',
    'admin', 'root', '123456', 'secret', 'default', 'demo', 'test',
  ].includes(v)
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

// Nettoie un nom de service pour l'utiliser comme identifiant de routeur
// Traefik (uniquement lettres/chiffres/tirets, comme l'exige Traefik).
function nomRouteurTraefik(nom) {
  const propre = String(nom || 'service').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return propre || 'service'
}

// Détermine le port interne à exposer via Traefik : celui saisi manuellement
// si présent, sinon le premier port conteneur déclaré, sinon 80 par défaut.
function portConteneurTraefik(service) {
  const portManuel = service.traefik && String(service.traefik.port || '').trim()
  if (portManuel) return portManuel
  const premierPort = (service.ports || []).find((p) => p.container && String(p.container).trim() !== '')
  return premierPort ? String(premierPort.container).trim() : '80'
}

// Construit les labels Docker que Traefik (v2+) lit pour router automatique-
// ment le trafic HTTPS vers ce service par nom de domaine. Renvoie un tableau
// vide si l'option n'est pas activée ou si aucun domaine n'est renseigné (les
// labels seraient invalides/inutiles sans domaine).
export function construireLabelsTraefik(service) {
  if (!service.traefik || !service.traefik.active) return []
  const domaine = (service.traefik.domaine || '').trim()
  if (!domaine) return []
  const routeur = nomRouteurTraefik(service.name)
  const port = portConteneurTraefik(service)
  return [
    'traefik.enable=true',
    `traefik.http.routers.${routeur}.rule=Host(\`${domaine}\`)`,
    `traefik.http.routers.${routeur}.entrypoints=websecure`,
    `traefik.http.routers.${routeur}.tls.certresolver=letsencrypt`,
    `traefik.http.services.${routeur}.loadbalancer.server.port=${port}`,
  ]
}

// Nettoie un nom de service pour l'utiliser comme nom de ressource
// Kubernetes (RFC 1123 : minuscules, chiffres, tirets uniquement).
function nomK8s(nom) {
  const propre = String(nom || 'service').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return propre || 'service'
}

// Encode une chaîne en base64 en gérant correctement l'UTF-8 (accents,
// emojis...), utilisable aussi bien dans le navigateur qu'en Node (tests).
function base64Utf8(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch {
    return btoa(String(str))
  }
}

// Génère un manifeste Kubernetes basique (Deployment + Service, et
// éventuellement un Secret) pour chaque conteneur — un point de départ pour
// migrer vers un cluster, pas un export production-ready : pas de
// PersistentVolumeClaim ni d'Ingress générés automatiquement.
export function buildKubernetesManifests(services, options = {}) {
  const { extraireSecrets = false, secretsInclus = [], secretsExclus = [] } = options
  const optsSecret = { inclusions: secretsInclus, exclusions: secretsExclus }

  if (!services || services.length === 0) {
    return '# Ajoute au moins un conteneur pour générer les manifestes Kubernetes.\n'
  }

  const documents = [
    [
      '# Manifestes Kubernetes générés par DockerForge — un point de départ, à adapter :',
      "# - le stockage persistant (PersistentVolumeClaim) n'est PAS généré, les volumes",
      '#   Docker déclarés ici doivent être recréés manuellement selon ton cluster ;',
      "# - aucune Ingress n'est créée : les Services sont en ClusterIP, expose-les avec",
      "#   \"kubectl port-forward\", un Ingress, ou en changeant le type de Service ;",
      '# - vérifie les limites de ressources (requests/limits) avant un déploiement réel.',
    ].join('\n'),
  ]

  for (const service of services) {
    const nom = nomK8s(service.name)
    const secretsService = (service.env || []).filter((e) => e.key && estSecret(e.key, optsSecret))
    const envNormal = (service.env || []).filter((e) => e.key && !estSecret(e.key, optsSecret))
    const utiliseSecret = extraireSecrets && secretsService.length > 0
    const portsConteneur = (service.ports || []).filter((p) => p.container && String(p.container).trim() !== '')

    if (utiliseSecret) {
      const lignesSecret = [
        'apiVersion: v1',
        'kind: Secret',
        'metadata:',
        `  name: ${nom}-secret`,
        '  labels:',
        `    app: ${nom}`,
        'type: Opaque',
        'data:',
        ...secretsService.map((e) => `  ${e.key}: ${base64Utf8(e.value || '')}`),
      ]
      documents.push(lignesSecret.join('\n'))
    }

    const lignes = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      `  name: ${nom}`,
      '  labels:',
      `    app: ${nom}`,
      'spec:',
      '  replicas: 1',
      '  selector:',
      '    matchLabels:',
      `      app: ${nom}`,
      '  template:',
      '    metadata:',
      '      labels:',
      `        app: ${nom}`,
      '    spec:',
      '      containers:',
      `        - name: ${nom}`,
      `          image: ${yamlValue(service.image || '')}`,
    ]
    if (portsConteneur.length > 0) {
      lignes.push('          ports:')
      for (const p of portsConteneur) {
        lignes.push(`            - containerPort: ${p.container}`)
      }
    }
    if (envNormal.length > 0 || secretsService.length > 0) {
      lignes.push('          env:')
      for (const e of envNormal) {
        lignes.push(`            - name: ${e.key}`)
        lignes.push(`              value: ${yamlValue(e.value || '')}`)
      }
      for (const e of secretsService) {
        lignes.push(`            - name: ${e.key}`)
        if (utiliseSecret) {
          lignes.push('              valueFrom:')
          lignes.push('                secretKeyRef:')
          lignes.push(`                  name: ${nom}-secret`)
          lignes.push(`                  key: ${e.key}`)
        } else {
          lignes.push(`              value: ${yamlValue(e.value || '')}`)
        }
      }
    }
    if (service.memLimit || service.cpus) {
      lignes.push('          resources:')
      lignes.push('            limits:')
      if (service.memLimit) lignes.push(`              memory: ${yamlValue(service.memLimit)}`)
      if (service.cpus) lignes.push(`              cpu: ${yamlValue(String(service.cpus))}`)
    }
    documents.push(lignes.join('\n'))

    if (portsConteneur.length > 0) {
      const lignesService = [
        'apiVersion: v1',
        'kind: Service',
        'metadata:',
        `  name: ${nom}`,
        'spec:',
        '  selector:',
        `    app: ${nom}`,
        '  ports:',
        ...portsConteneur.flatMap((p) => [`    - port: ${p.container}`, `      targetPort: ${p.container}`]),
        '  type: ClusterIP',
      ]
      documents.push(lignesService.join('\n'))
    }
  }

  return documents.join('\n---\n') + '\n'
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

    if ((service.logMaxSize && service.logMaxSize.trim() !== '') || (service.logMaxFile && service.logMaxFile.trim() !== '')) {
      lines.push('    logging:')
      lines.push('      driver: json-file')
      lines.push('      options:')
      if (service.logMaxSize && service.logMaxSize.trim() !== '') {
        lines.push(`        max-size: ${yamlValue(service.logMaxSize)}`)
      }
      if (service.logMaxFile && service.logMaxFile.trim() !== '') {
        lines.push(`        max-file: ${yamlValue(String(service.logMaxFile))}`)
      }
    }

    if (service.networks && service.networks.length > 0) {
      lines.push('    networks:')
      for (const net of service.networks) {
        lines.push(`      - ${net}`)
      }
    }

    const labelsTraefik = construireLabelsTraefik(service)
    if (labelsTraefik.length > 0) {
      lines.push('    labels:')
      for (const l of labelsTraefik) {
        lines.push(`      - ${yamlValue(l)}`)
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
      if (net.interne) {
        lines.push('    internal: true')
      }
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
      lignes.push(`docker network create --driver ${n.driver || 'bridge'}${n.interne ? ' --internal' : ''} ${shValue(n.nom)}`)
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
    for (const l of construireLabelsTraefik(service)) {
      parts.push(`-l ${shValue(l)}`)
    }
    if (service.healthcheck && service.healthcheck.enabled && service.healthcheck.test) {
      parts.push(`--health-cmd ${shValue(service.healthcheck.test)}`)
      parts.push(`--health-interval ${service.healthcheck.interval || '30s'}`)
      parts.push(`--health-timeout ${service.healthcheck.timeout || '5s'}`)
      parts.push(`--health-retries ${service.healthcheck.retries || 3}`)
    }
    if (service.memLimit && service.memLimit.trim() !== '') parts.push(`-m ${shValue(service.memLimit)}`)
    if (service.cpus && service.cpus.trim() !== '') parts.push(`--cpus ${shValue(service.cpus)}`)
    if (service.logMaxSize && service.logMaxSize.trim() !== '') {
      parts.push('--log-driver json-file')
      parts.push(`--log-opt max-size=${shValue(service.logMaxSize)}`)
    }
    if (service.logMaxFile && service.logMaxFile.trim() !== '') parts.push(`--log-opt max-file=${shValue(String(service.logMaxFile))}`)
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
// Applications connues pour avoir presque toujours besoin d'une base de
// données externe pour fonctionner correctement. `satisfaitPar` est vérifié
// contre l'image de TOUS les autres services du projet (peu importe les
// dépendances déclarées) : le but est juste d'attirer l'attention si rien
// dans le projet ne ressemble à une base de données adaptée, pas de forcer
// un lien — certaines de ces applis savent aussi tourner sur SQLite intégré.
const SUGGESTIONS_DEPENDANCE = [
  { motif: /wordpress/i, appli: 'WordPress', besoin: 'une base de données MySQL/MariaDB', satisfaitPar: /mysql|mariadb/i },
  { motif: /^ghost(:|$)/i, appli: 'Ghost', besoin: 'une base de données MySQL (sinon il reste sur SQLite intégré)', satisfaitPar: /mysql|mariadb/i },
  { motif: /gitea/i, appli: 'Gitea', besoin: 'une base de données (sinon il reste sur SQLite intégré)', satisfaitPar: /postgres|mysql|mariadb/i },
  { motif: /nextcloud/i, appli: 'Nextcloud', besoin: 'une base de données (SQLite fonctionne mais est déconseillé au-delà d\'un usage perso)', satisfaitPar: /postgres|mysql|mariadb/i },
  { motif: /matomo/i, appli: 'Matomo', besoin: 'une base de données MySQL/MariaDB', satisfaitPar: /mysql|mariadb/i },
  { motif: /redmine/i, appli: 'Redmine', besoin: 'une base de données MySQL/PostgreSQL', satisfaitPar: /mysql|mariadb|postgres/i },
  { motif: /bookstack/i, appli: 'BookStack', besoin: 'une base de données MySQL/MariaDB', satisfaitPar: /mysql|mariadb/i },
  { motif: /keycloak/i, appli: 'Keycloak', besoin: 'une base de données PostgreSQL (recommandée en production)', satisfaitPar: /postgres/i },
]

// Repère les applications qui ont presque toujours besoin d'une base de
// données externe, et suggère (sans bloquer) d'en ajouter une si rien dans
// le projet ne semble en tenir lieu.
export function suggererDependancesManquantes(services) {
  const images = services.map((s) => s.image || '')
  const suggestions = []

  for (const regle of SUGGESTIONS_DEPENDANCE) {
    const concernes = services.filter((s) => regle.motif.test(s.image || ''))
    if (concernes.length === 0) continue
    const dejaSatisfait = images.some((img) => regle.satisfaitPar.test(img))
    if (!dejaSatisfait) {
      const noms = concernes.map((s) => s.name || regle.appli).join(', ')
      suggestions.push(
        `${regle.appli} (${noms}) fonctionne généralement avec ${regle.besoin} — ajoute-la si ce n'est pas déjà prévu ailleurs.`
      )
    }
  }

  return suggestions
}

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
      // Number("") vaut 0 (pas NaN) et Number("abc") vaut NaN : dans les deux
      // cas, `hostNum < 1 || hostNum > 65535` ne suffit pas (une comparaison
      // avec NaN est toujours fausse, donc "abc" passait inaperçu et finissait
      // tel quel dans le docker-compose.yml généré, invalide au démarrage).
      if (p.host && (!Number.isInteger(hostNum) || hostNum < 1 || hostNum > 65535)) {
        erreurs.push(`Le port hôte "${p.host}" du service "${label}" est invalide (doit être un nombre entre 1 et 65535).`)
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
      (e) => e.key && estSecret(e.key, optsSecret) && estValeurFaible(e.value)
    )
    if (motsDePasseParDefaut.length > 0) {
      avertissements.push(
        `Le service "${label}" utilise encore une valeur d'exemple (${motsDePasseParDefaut.map((e) => e.key).join(', ')}) — utilise le bouton 🎲 ou "Sécuriser tous les mots de passe faibles" avant de déployer.`
      )
    }

    if (service.traefik && service.traefik.active && !(service.traefik.domaine || '').trim()) {
      avertissements.push(
        `Le service "${label}" a "Exposer via Traefik" activé mais aucun nom de domaine renseigné — aucun label ne sera généré tant que le domaine est vide.`
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
