// importateur.js — lit un docker-compose.yml existant et le convertit
// vers le format interne de services utilisé par le formulaire/l'aperçu.

import yaml from 'js-yaml'

function normaliserPorts(ports) {
  if (!ports) return [{ host: '', container: '' }]
  const resultat = []
  for (const p of ports) {
    // Formats possibles : "8080:80", "8080:80/tcp", ou objet {published, target}
    if (typeof p === 'string') {
      const sansProto = p.split('/')[0]
      const parts = sansProto.split(':')
      if (parts.length >= 2) {
        resultat.push({ host: parts[parts.length - 2], container: parts[parts.length - 1] })
      } else {
        resultat.push({ host: '', container: parts[0] })
      }
    } else if (typeof p === 'object') {
      resultat.push({ host: String(p.published || ''), container: String(p.target || '') })
    }
  }
  return resultat.length > 0 ? resultat : [{ host: '', container: '' }]
}

function normaliserEnv(environment) {
  if (!environment) return [{ key: '', value: '' }]
  const resultat = []
  if (Array.isArray(environment)) {
    for (const e of environment) {
      const idx = e.indexOf('=')
      if (idx === -1) {
        resultat.push({ key: e, value: '' })
      } else {
        resultat.push({ key: e.slice(0, idx), value: e.slice(idx + 1) })
      }
    }
  } else if (typeof environment === 'object') {
    for (const [key, value] of Object.entries(environment)) {
      resultat.push({ key, value: String(value ?? '') })
    }
  }
  return resultat.length > 0 ? resultat : [{ key: '', value: '' }]
}

function normaliserDependsOn(dependsOn) {
  if (!dependsOn) return []
  if (Array.isArray(dependsOn)) return dependsOn
  if (typeof dependsOn === 'object') return Object.keys(dependsOn)
  return []
}

function normaliserHealthcheck(hc) {
  const vide = { enabled: false, test: '', interval: '30s', timeout: '5s', retries: 3 }
  if (!hc || !hc.test) return vide
  let test = hc.test
  if (Array.isArray(test)) {
    // ["CMD-SHELL", "..."] ou ["CMD", "arg1", "arg2"]
    test = test[0] === 'CMD-SHELL' || test[0] === 'NONE' ? test[1] || '' : test.slice(1).join(' ')
  }
  return {
    enabled: true,
    test: test || '',
    interval: hc.interval || '30s',
    timeout: hc.timeout || '5s',
    retries: hc.retries || 3,
  }
}

// Parse le texte d'un docker-compose.yml et renvoie { services, erreurs }
// services : tableau au format interne, prêt à être ajouté à l'état de l'app.
export function importerDockerCompose(texteYaml) {
  let doc
  try {
    doc = yaml.load(texteYaml)
  } catch (err) {
    return { services: [], erreurs: [`Fichier YAML invalide : ${err.message}`] }
  }

  if (!doc || typeof doc !== 'object' || !doc.services) {
    return { services: [], erreurs: ['Aucune clé "services:" trouvée dans ce fichier.'] }
  }

  const services = []
  const erreurs = []

  for (const [nom, def] of Object.entries(doc.services)) {
    if (!def || typeof def !== 'object') continue
    if (!def.image) {
      erreurs.push(`Le service "${nom}" n'a pas de champ "image" (les builds locaux ne sont pas supportés) — ignoré.`)
      continue
    }
    services.push({
      id: crypto.randomUUID(),
      name: nom,
      image: def.image,
      ports: normaliserPorts(def.ports),
      volumes: def.volumes && def.volumes.length > 0 ? def.volumes.map(String) : [''],
      env: normaliserEnv(def.environment),
      restart: def.restart || 'unless-stopped',
      dependsOn: normaliserDependsOn(def.depends_on),
      healthcheck: normaliserHealthcheck(def.healthcheck),
      memLimit: def.mem_limit || '',
      cpus: def.cpus ? String(def.cpus) : '',
    })
  }

  if (services.length === 0 && erreurs.length === 0) {
    erreurs.push('Aucun service exploitable trouvé dans ce fichier.')
  }

  return { services, erreurs }
}
