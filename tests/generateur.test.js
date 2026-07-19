// Tests du cœur de génération — exécuter avec : npm test
// Pas de framework externe : assertions simples avec messages clairs.

import {
  buildDockerCompose,
  buildEnvFiles,
  buildDockerRunScript,
  validerServices,
  estSecret,
  suggererDependancesManquantes,
  auditSecurite,
  construireLabelsTraefik,
} from '../src/core/generateur.js'
import { calculerCharge, construireLiens, grouperParReseau } from '../src/core/topologie.js'
import { trouverPortLibre, portsHoteUtilises } from '../src/core/catalogue.js'
import { STACKS } from '../src/core/stacks.js'

let nbTests = 0
let nbEchecs = 0

function test(nom, fn) {
  nbTests += 1
  try {
    fn()
    console.log(`  ✓ ${nom}`)
  } catch (e) {
    nbEchecs += 1
    console.error(`  ✗ ${nom}`)
    console.error(`    ${e.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion échouée')
}

function assertInclut(texte, sousChaine, message) {
  assert(texte.includes(sousChaine), message || `Attendu que le texte contienne "${sousChaine}"`)
}

const serviceBase = (overrides = {}) => ({
  id: 'test-id',
  name: 'web',
  image: 'nginx:latest',
  ports: [{ host: '8080', container: '80' }],
  volumes: ['./data:/data'],
  env: [],
  restart: 'unless-stopped',
  dependsOn: [],
  networks: [],
  ...overrides,
})

console.log('\n--- generateur.js ---')

test('génère un service simple avec image et ports', () => {
  const yaml = buildDockerCompose([serviceBase()])
  assertInclut(yaml, 'services:')
  assertInclut(yaml, 'web:')
  assertInclut(yaml, 'image: nginx:latest')
  assertInclut(yaml, '"8080:80"')
})

test('ne met pas de guillemets inutiles sur une image simple', () => {
  const yaml = buildDockerCompose([serviceBase({ image: 'mysql:8' })])
  assertInclut(yaml, 'image: mysql:8')
  assert(!yaml.includes('"mysql:8"'), 'ne devrait pas mettre de guillemets sur "mysql:8"')
})

test('génère la liste vide avec un commentaire explicite', () => {
  const yaml = buildDockerCompose([])
  assertInclut(yaml, 'Ajoute au moins un service')
})

test('ajoute depends_on quand des dépendances existent', () => {
  const yaml = buildDockerCompose([
    serviceBase({ name: 'web', dependsOn: ['db'] }),
    serviceBase({ name: 'db', image: 'postgres:16', ports: [{ host: '5432', container: '5432' }] }),
  ])
  assertInclut(yaml, 'depends_on:')
  assertInclut(yaml, '- db')
})

test('extrait les secrets dans un env_file si demandé', () => {
  const services = [
    serviceBase({ env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'secret123' }] }),
  ]
  const yaml = buildDockerCompose(services, { extraireSecrets: true })
  assertInclut(yaml, 'env_file:')
  assert(!yaml.includes('secret123'), 'le mot de passe ne doit pas apparaître en clair dans le YAML')
})

test('inclut le nom de projet si fourni', () => {
  const yaml = buildDockerCompose([serviceBase()], { nomProjet: 'mon-app' })
  assertInclut(yaml, 'name: mon-app')
})

test('génère un fichier .env avec les variables de tous les services', () => {
  const services = [
    serviceBase({ name: 'db', env: [{ key: 'DB_PASSWORD', value: 'abc' }] }),
  ]
  const fichiers = buildEnvFiles(services)
  assert(Object.keys(fichiers).length > 0, 'devrait produire au moins un fichier .env')
})

console.log('\n--- construireLabelsTraefik ---')

test("ne génère aucun label si l'option Traefik est désactivée", () => {
  const labels = construireLabelsTraefik(serviceBase({ traefik: { active: false, domaine: 'app.test' } }))
  assert(labels.length === 0, 'aucun label attendu quand traefik.active est false')
})

test("ne génère aucun label si activé mais sans domaine", () => {
  const labels = construireLabelsTraefik(serviceBase({ traefik: { active: true, domaine: '' } }))
  assert(labels.length === 0, 'aucun label attendu sans domaine renseigné')
})

test('génère les labels attendus avec domaine et port explicites', () => {
  const labels = construireLabelsTraefik(
    serviceBase({ name: 'app', traefik: { active: true, domaine: 'app.example.com', port: '3000' } })
  )
  assert(labels.includes('traefik.enable=true'), 'devrait activer Traefik')
  assert(
    labels.some((l) => l === 'traefik.http.routers.app.rule=Host(`app.example.com`)'),
    'devrait router sur le bon nom de domaine'
  )
  assert(
    labels.some((l) => l === 'traefik.http.services.app.loadbalancer.server.port=3000'),
    'devrait cibler le port explicite'
  )
})

test('retombe sur le premier port conteneur si aucun port Traefik explicite', () => {
  const labels = construireLabelsTraefik(
    serviceBase({
      name: 'app',
      ports: [{ host: '8080', container: '4000' }],
      traefik: { active: true, domaine: 'app.example.com', port: '' },
    })
  )
  assert(
    labels.some((l) => l === 'traefik.http.services.app.loadbalancer.server.port=4000'),
    'devrait retomber sur le port conteneur déclaré'
  )
})

test('nettoie le nom de service pour construire un identifiant de routeur valide', () => {
  const labels = construireLabelsTraefik(
    serviceBase({ name: 'Mon Appli_01', traefik: { active: true, domaine: 'app.example.com' } })
  )
  assert(
    labels.some((l) => l.includes('traefik.http.routers.mon-appli-01.rule=')),
    'devrait produire un identifiant de routeur en minuscules sans caractères spéciaux'
  )
})

test('buildDockerCompose inclut les labels Traefik générés', () => {
  const yaml = buildDockerCompose([
    serviceBase({ name: 'app', traefik: { active: true, domaine: 'app.example.com', port: '3000' } }),
  ])
  assertInclut(yaml, 'labels:')
  assertInclut(yaml, 'traefik.enable=true')
})

test('buildDockerRunScript ajoute les labels Traefik via -l', () => {
  const script = buildDockerRunScript([
    serviceBase({ name: 'app', traefik: { active: true, domaine: 'app.example.com', port: '3000' } }),
  ])
  assertInclut(script, '-l')
  assertInclut(script, 'traefik.enable=true')
})

test('validerServices avertit si Traefik est activé sans domaine', () => {
  const { avertissements } = validerServices([
    serviceBase({ volumes: ['/data'], traefik: { active: true, domaine: '' } }),
  ])
  assert(
    avertissements.some((a) => a.includes('Traefik') && a.includes('domaine')),
    "devrait avertir de l'absence de domaine"
  )
})

console.log('\n--- validerServices ---')

test('détecte un nom de service manquant', () => {
  const { erreurs } = validerServices([serviceBase({ name: '' })])
  assert(erreurs.some((e) => e.includes("n'a pas de nom")), 'devrait signaler le nom manquant')
})

test('détecte deux services avec le même nom', () => {
  const { erreurs } = validerServices([serviceBase({ name: 'web' }), serviceBase({ name: 'web' })])
  assert(erreurs.some((e) => e.includes('utilisé plusieurs fois')), 'devrait signaler le doublon')
})

test('détecte un port hôte dupliqué', () => {
  const { erreurs } = validerServices([
    serviceBase({ name: 'a', ports: [{ host: '8080', container: '80' }] }),
    serviceBase({ name: 'b', ports: [{ host: '8080', container: '81' }] }),
  ])
  assert(erreurs.some((e) => e.includes('8080')), 'devrait signaler le port en double')
})

test('avertit si aucun volume défini', () => {
  const { avertissements } = validerServices([serviceBase({ volumes: [] })])
  assert(avertissements.some((a) => a.includes('aucun volume')), 'devrait avertir sur le volume manquant')
})

test('avertit sur une image sans version figée (tag latest implicite ou explicite)', () => {
  const { avertissements: a1 } = validerServices([serviceBase({ volumes: ['/data'], image: 'nginx' })])
  assert(a1.some((a) => a.includes('version figée')), 'devrait avertir quand il n\'y a aucun tag')

  const { avertissements: a2 } = validerServices([serviceBase({ volumes: ['/data'], image: 'nginx:latest' })])
  assert(a2.some((a) => a.includes('latest')), 'devrait avertir sur le tag "latest" explicite')

  const { avertissements: a3 } = validerServices([serviceBase({ volumes: ['/data'], image: 'nginx:1.25' })])
  assert(!a3.some((a) => a.includes('version figée') || a.includes('latest')), 'ne devrait rien dire pour un tag précis')

  const { avertissements: a4 } = validerServices([serviceBase({ volumes: ['/data'], image: 'registry.local:5000/app:2.0' })])
  assert(!a4.some((a) => a.includes('version figée')), 'ne doit pas confondre le port du registre avec un tag absent')
})

test('suggererDependancesManquantes propose une base de données pour WordPress seul', () => {
  const suggestions = suggererDependancesManquantes([serviceBase({ name: 'site', image: 'wordpress:latest' })])
  assert(suggestions.some((s) => s.includes('WordPress')), 'devrait suggérer une base de données pour WordPress')
})

test("suggererDependancesManquantes ne dit rien si la base de données est déjà présente", () => {
  const suggestions = suggererDependancesManquantes([
    serviceBase({ name: 'site', image: 'wordpress:latest' }),
    serviceBase({ name: 'db', image: 'mariadb:latest' }),
  ])
  assert(suggestions.length === 0, 'ne devrait rien suggérer, la base de données est déjà là')
})

console.log('\n--- auditSecurite ---')

test('auditSecurite compte correctement ports, healthcheck, secrets et tags', () => {
  const services = [
    serviceBase({
      name: 'web', image: 'nginx:latest',
      ports: [{ host: '8080', container: '80' }],
      healthcheck: { enabled: true, test: 'curl -f http://localhost' },
    }),
    serviceBase({
      name: 'db', image: 'mysql:8',
      ports: [{ host: '3306', container: '3306' }],
      env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' }],
    }),
  ]
  const audit = auditSecurite(services, { extraireSecrets: false })
  assert(audit.totalServices === 2, `totalServices devrait être 2, obtenu ${audit.totalServices}`)
  assert(audit.portsExposes === 2, `portsExposes devrait être 2, obtenu ${audit.portsExposes}`)
  assert(audit.servicesAvecHealthcheck === 1, `servicesAvecHealthcheck devrait être 1, obtenu ${audit.servicesAvecHealthcheck}`)
  assert(audit.secretsEnClair === 1, `secretsEnClair devrait être 1, obtenu ${audit.secretsEnClair}`)
  assert(audit.motsDePasseParDefaut === 1, `motsDePasseParDefaut devrait être 1, obtenu ${audit.motsDePasseParDefaut}`)
  assert(audit.tagsNonFiges === 1, `tagsNonFiges devrait être 1 (nginx:latest), obtenu ${audit.tagsNonFiges}`)
  assert(audit.niveau === 'a_ameliorer', `niveau devrait être "a_ameliorer", obtenu ${audit.niveau}`)
})

test('auditSecurite renvoie "bon" pour un projet propre', () => {
  const services = [
    serviceBase({
      name: 'web', image: 'nginx:1.25',
      healthcheck: { enabled: true, test: 'curl -f http://localhost' },
      env: [],
    }),
  ]
  const audit = auditSecurite(services)
  assert(audit.niveau === 'bon', `niveau devrait être "bon", obtenu ${audit.niveau}`)
})

test("auditSecurite ne compte pas les secrets en clair si l'extraction est activée", () => {
  const services = [serviceBase({ env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'xyz' }] })]
  const audit = auditSecurite(services, { extraireSecrets: true })
  assert(audit.secretsEnClair === 0, 'ne devrait pas compter les secrets déjà extraits comme "en clair"')
})

test('un service valide ne remonte aucune erreur', () => {
  const { valide, erreurs } = validerServices([serviceBase()])
  assert(valide === true, `devrait être valide, erreurs: ${erreurs.join(', ')}`)
})

console.log('\n--- estSecret ---')

test('reconnaît les clés sensibles courantes', () => {
  assert(estSecret('MYSQL_ROOT_PASSWORD') === true)
  assert(estSecret('API_TOKEN') === true)
  assert(estSecret('SECRET_KEY') === true)
})

test('ne signale pas une clé normale comme sensible', () => {
  assert(estSecret('PORT') === false)
  assert(estSecret('NODE_ENV') === false)
})

console.log('\n--- topologie.js ---')

test('construireLiens relie correctement dépendant et dépendance', () => {
  const services = [serviceBase({ name: 'web', dependsOn: ['db'] }), serviceBase({ name: 'db' })]
  const liens = construireLiens(services)
  assert(liens.length === 1, 'devrait produire un seul lien')
  assert(liens[0].de === 'db' && liens[0].vers === 'web', 'le lien doit aller de db vers web')
})

test('grouperParReseau met les services sans réseau dans le groupe par défaut', () => {
  const services = [serviceBase({ name: 'web', networks: [] })]
  const groupes = grouperParReseau(services, [])
  assert(groupes.length === 1 && groupes[0].defaut === true, 'devrait créer un seul groupe par défaut')
})

test("grouperParReseau ne fait apparaître un service qu'une seule fois même sur plusieurs réseaux", () => {
  const services = [
    serviceBase({ name: 'web', networks: ['frontend', 'backend'] }),
    serviceBase({ name: 'db', networks: ['backend'] }),
  ]
  const networks = [{ nom: 'frontend' }, { nom: 'backend' }]
  const groupes = grouperParReseau(services, networks)
  const occurrences = groupes.filter((g) => g.services.some((s) => s.name === 'web')).length
  assert(occurrences === 1, `"web" devrait apparaître dans 1 groupe, trouvé dans ${occurrences}`)
})

test('calculerCharge compte les services avec limites définies', () => {
  const services = [
    serviceBase({ memLimit: '512m', cpus: '0.5' }),
    serviceBase({ name: 'db' }),
  ]
  const charge = calculerCharge(services)
  assert(charge.servicesAvecLimite === 1, 'un seul service a des limites définies')
  assert(charge.totalServices === 2, 'deux services au total')
})

console.log('\n--- catalogue.js (ports) ---')

test('trouverPortLibre renvoie le port demandé si libre', () => {
  const port = trouverPortLibre(8080, new Set())
  assert(port === 8080)
})

test('trouverPortLibre décale le port en cas de conflit', () => {
  const port = trouverPortLibre(8080, new Set([8080, 8081]))
  assert(port === 8082, `attendu 8082, reçu ${port}`)
})

test('portsHoteUtilises recense tous les ports occupés', () => {
  const services = [serviceBase({ ports: [{ host: '3000', container: '3000' }] })]
  const utilises = portsHoteUtilises(services)
  assert(utilises.has(3000))
})

console.log('\n--- stacks.js (intégrité du catalogue) ---')

test('chaque stack a un id unique', () => {
  const ids = STACKS.map((s) => s.id)
  const doublons = ids.filter((id, i) => ids.indexOf(id) !== i)
  assert(doublons.length === 0, `id(s) en double : ${[...new Set(doublons)].join(', ')}`)
})

test('chaque stack a au moins un service avec nom et image', () => {
  for (const stack of STACKS) {
    assert(stack.services.length > 0, `la stack "${stack.id}" n'a aucun service`)
    for (const s of stack.services) {
      assert(s.name && s.name.trim() !== '', `un service de "${stack.id}" n'a pas de nom`)
      assert(s.image && s.image.trim() !== '', `le service "${s.name}" de "${stack.id}" n'a pas d'image`)
    }
  }
})

test('les dépendances (dependsOn) déclarées dans une stack pointent vers un service existant de la même stack', () => {
  for (const stack of STACKS) {
    const noms = new Set(stack.services.map((s) => s.name))
    for (const s of stack.services) {
      for (const dep of s.dependsOn || []) {
        assert(noms.has(dep), `"${stack.id}" : "${s.name}" dépend de "${dep}", absent de la stack`)
      }
    }
  }
})

console.log(`\n${nbTests - nbEchecs}/${nbTests} tests réussis.`)
if (nbEchecs > 0) {
  console.error(`${nbEchecs} échec(s).`)
  process.exit(1)
}
