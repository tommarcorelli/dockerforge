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
  genererMotDePasse,
  estValeurFaible,
  buildKubernetesManifests,
} from '../src/core/generateur.js'
import { calculerCharge, construireLiens, grouperParReseau } from '../src/core/topologie.js'
import { trouverPortLibre, portsHoteUtilises, healthcheckSuggere, trouverIcone, deviner_teinte, CATALOGUE } from '../src/core/catalogue.js'
import { STACKS, CATEGORIE_PAR_STACK, CATEGORIE_LABELS, categorieDe, construireStack } from '../src/core/stacks.js'
import { importerDockerCompose } from '../src/core/importateur.js'
import { tokeniserLigneYaml } from '../src/core/surlignageYaml.js'
import { copierTexte } from '../src/core/clipboard.js'

// Node ne fournit pas `localStorage` par défaut : les modules modeles.js et
// projets.js en dépendent directement, on installe donc un polyfill mémoire
// minimal avant de les importer (leurs fonctions ne lisent le storage qu'à
// l'appel, jamais au chargement du module, donc l'ordre est sûr).
if (typeof globalThis.localStorage === 'undefined') {
  const memoire = new Map()
  globalThis.localStorage = {
    getItem: (k) => (memoire.has(k) ? memoire.get(k) : null),
    setItem: (k, v) => { memoire.set(k, String(v)) },
    removeItem: (k) => { memoire.delete(k) },
    clear: () => { memoire.clear() },
  }
}

const { chargerModeles, ajouterModele, supprimerModele, instancierModele } = await import('../src/core/modeles.js')
const { chargerProjets, sauvegarderProjets, exporterProjet, importerProjet, projetVide } = await import('../src/core/projets.js')

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

// Variante pour les fonctions qui renvoient une Promise (ex: copierTexte).
// Les tests sont mis en file puis exécutés séquentiellement (un seul à la
// fois, jamais en parallèle) juste avant le résumé final : plusieurs de ces
// tests redéfinissent les mêmes globals partagés (navigator, document), et
// les lancer en parallèle provoquerait des mutations concurrentes entre
// tests (l'un écrase le mock de l'autre avant qu'il ait fini).
const testsAsyncEnAttente = []
function testAsync(nom, fn) {
  testsAsyncEnAttente.push({ nom, fn })
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

console.log('\n--- buildKubernetesManifests ---')

test('génère un Deployment et un Service pour un service simple', () => {
  const yaml = buildKubernetesManifests([serviceBase({ name: 'web', ports: [{ host: '8080', container: '80' }] })])
  assertInclut(yaml, 'kind: Deployment')
  assertInclut(yaml, 'kind: Service')
  assertInclut(yaml, 'name: web')
  assertInclut(yaml, 'image: nginx:latest')
  assertInclut(yaml, 'containerPort: 80')
})

test("ne génère pas de Service si le service n'expose aucun port conteneur", () => {
  const yaml = buildKubernetesManifests([serviceBase({ ports: [] })])
  assert(!yaml.includes('kind: Service'), 'aucun Service attendu sans port conteneur')
  assertInclut(yaml, 'kind: Deployment')
})

test('nettoie le nom de service en un nom de ressource Kubernetes valide (RFC 1123)', () => {
  const yaml = buildKubernetesManifests([serviceBase({ name: 'Mon Appli_01' })])
  assertInclut(yaml, 'name: mon-appli-01')
})

test('sépare les documents avec "---"', () => {
  const yaml = buildKubernetesManifests([
    serviceBase({ name: 'web', ports: [{ host: '8080', container: '80' }] }),
    serviceBase({ name: 'db', ports: [] }),
  ])
  const nbDocuments = yaml.split('\n---\n').length
  assert(nbDocuments >= 3, `attendu au moins 3 documents (commentaire + 2 Deployments), obtenu ${nbDocuments}`)
})

test('extrait les secrets dans une ressource Secret quand extraireSecrets est actif', () => {
  const yaml = buildKubernetesManifests(
    [serviceBase({ name: 'db', env: [{ key: 'DB_PASSWORD', value: 'motdepasse123' }] })],
    { extraireSecrets: true }
  )
  assertInclut(yaml, 'kind: Secret')
  assertInclut(yaml, 'secretKeyRef')
  assert(!yaml.includes('motdepasse123'), 'le mot de passe en clair ne devrait pas apparaître (seulement encodé en base64)')
})

test("garde les secrets en clair en env si extraireSecrets n'est pas activé", () => {
  const yaml = buildKubernetesManifests([
    serviceBase({ name: 'db', env: [{ key: 'DB_PASSWORD', value: 'motdepasse123' }] }),
  ])
  assert(!yaml.includes('kind: Secret'), 'aucun Secret attendu sans extraireSecrets')
  assertInclut(yaml, 'motdepasse123')
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

test('génère internal: true pour un réseau marqué comme interne', () => {
  const yaml = buildDockerCompose(
    [serviceBase({ name: 'db', networks: ['backend'] })],
    { networks: [{ nom: 'backend', driver: 'bridge', interne: true }] }
  )
  assertInclut(yaml, '  backend:')
  assertInclut(yaml, '    internal: true')
})

test("n'ajoute pas internal: true pour un réseau normal", () => {
  const yaml = buildDockerCompose(
    [serviceBase({ name: 'db', networks: ['backend'] })],
    { networks: [{ nom: 'backend', driver: 'bridge', interne: false }] }
  )
  assert(!yaml.includes('internal: true'), "ne devrait pas contenir internal: true pour un réseau non interne")
})

test('génère un bloc logging (json-file) quand une limite de logs est renseignée', () => {
  const yaml = buildDockerCompose([serviceBase({ logMaxSize: '10m', logMaxFile: '3' })])
  assertInclut(yaml, '    logging:')
  assertInclut(yaml, '      driver: json-file')
  assertInclut(yaml, 'max-size: 10m')
  assertInclut(yaml, 'max-file: "3"')
})

test("n'ajoute aucun bloc logging si aucune limite n'est renseignée", () => {
  const yaml = buildDockerCompose([serviceBase()])
  assert(!yaml.includes('logging:'), 'ne devrait pas contenir de bloc logging par défaut')
})

test('buildDockerRunScript ajoute --log-opt quand une limite de logs est renseignée', () => {
  const script = buildDockerRunScript([serviceBase({ logMaxSize: '10m', logMaxFile: '3' })])
  assertInclut(script, '--log-driver json-file')
  assertInclut(script, '--log-opt max-size=10m')
  assertInclut(script, '--log-opt max-file=3')
})

console.log('\n--- genererMotDePasse / estValeurFaible ---')

test('genererMotDePasse produit une chaîne de 32 caractères alphanumériques', () => {
  const mdp = genererMotDePasse()
  assert(mdp.length === 32, `longueur attendue 32, obtenu ${mdp.length}`)
  assert(/^[A-Za-z0-9]+$/.test(mdp), 'devrait être purement alphanumérique')
})

test('genererMotDePasse produit des valeurs différentes à chaque appel', () => {
  assert(genererMotDePasse() !== genererMotDePasse(), 'deux appels ne devraient pas donner la même valeur')
})

test('estValeurFaible reconnaît les valeurs vides et les mots de passe d\'exemple', () => {
  assert(estValeurFaible(''), 'une valeur vide est faible')
  assert(estValeurFaible('change_moi'), '"change_moi" est faible')
  assert(estValeurFaible('change_moi_12'), '"change_moi_12" (variante avec suffixe) est faible')
  assert(estValeurFaible('admin'), '"admin" est faible')
  assert(!estValeurFaible('K7p#mZ9qL2vX8sN4wQ1rT6yU3hB0'), 'un mot de passe robuste ne doit pas être signalé comme faible')
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

test('détecte un port hôte non numérique (ex: saisie corrompue ou import malformé)', () => {
  const { erreurs, valide } = validerServices([
    serviceBase({ ports: [{ host: 'abc', container: '80' }] }),
  ])
  assert(valide === false, 'un port hôte non numérique doit invalider le service')
  assert(erreurs.some((e) => e.includes('abc')), 'devrait citer la valeur invalide dans le message')
})

test('détecte un port hôte décimal ou hors plage (0, 65536)', () => {
  const { erreurs: e1 } = validerServices([serviceBase({ ports: [{ host: '0', container: '80' }] }) ])
  assert(e1.some((e) => e.includes('invalide')), 'le port 0 devrait être invalide')

  const { erreurs: e2 } = validerServices([serviceBase({ ports: [{ host: '65536', container: '80' }] }) ])
  assert(e2.some((e) => e.includes('invalide')), 'le port 65536 devrait être invalide (max 65535)')

  const { erreurs: e3 } = validerServices([serviceBase({ ports: [{ host: '8080.5', container: '80' }] }) ])
  assert(e3.some((e) => e.includes('invalide')), 'un port décimal devrait être invalide')
})

test('un port hôte valide (1-65535) ne remonte aucune erreur de plage', () => {
  const { erreurs } = validerServices([serviceBase({ ports: [{ host: '65535', container: '80' }] }) ])
  assert(!erreurs.some((e) => e.includes('invalide')), 'le port 65535 est la borne haute valide')
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

test('calculerCharge convertit correctement les unités de mémoire (g/go/gb -> Mo)', () => {
  assert(calculerCharge([serviceBase({ memLimit: '1g' })]).memoireMo === 1024)
  assert(calculerCharge([serviceBase({ memLimit: '2Go' })]).memoireMo === 2048)
  assert(calculerCharge([serviceBase({ memLimit: '512mo' })]).memoireMo === 512)
  assert(calculerCharge([serviceBase({ memLimit: '512' })]).memoireMo === 512, 'sans unité, suppose des Mo')
})

test('calculerCharge ignore silencieusement une limite de mémoire mal formée', () => {
  const charge = calculerCharge([serviceBase({ memLimit: 'bogus', cpus: '' })])
  assert(charge.memoireMo === 0)
  assert(charge.servicesAvecLimite === 0, 'une limite illisible ne doit pas compter comme une limite définie')
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

test("trouverPortLibre renvoie la valeur d'origine inchangée si elle n'est pas un port numérique (ex: plage \"3000-3005\"), au lieu de la corrompre en \"NaN\"", () => {
  const valeur = trouverPortLibre('3000-3005', new Set())
  assert(valeur === '3000-3005', `attendu la valeur d'origine préservée, reçu ${valeur}`)
  assert(String(valeur) !== 'NaN', 'ne doit jamais produire la chaîne "NaN"')
})

test('portsHoteUtilises recense tous les ports occupés', () => {
  const services = [serviceBase({ ports: [{ host: '3000', container: '3000' }] })]
  const utilises = portsHoteUtilises(services)
  assert(utilises.has(3000))
})

test("ne confond pas une image avec une autre qui partage seulement son préfixe (ex: redis vs redis/redisinsight)", () => {
  assert(healthcheckSuggere('redis/redisinsight:latest') === '', 'redisinsight ne doit pas hériter du healthcheck de redis')
  assert(deviner_teinte('redis/redisinsight:latest') === 'steel', 'redisinsight ne doit pas hériter de la teinte de redis (repli "steel")')
  assert(trouverIcone('redis/redisinsight:latest') === null, 'redisinsight ne doit pas hériter de l\'icône de redis')
})

test("ne confond pas une image avec une autre qui partage seulement son préfixe (ex: mysql vs mysqld-exporter)", () => {
  assert(healthcheckSuggere('mysqld-exporter:latest') === '', 'mysqld-exporter ne doit pas hériter du healthcheck de mysql')
})

test('reconnaît en revanche correctement un vrai variant de tag de la même image (ex: mysql:8, postgres:16)', () => {
  assert(healthcheckSuggere('mysql:8') === 'mysqladmin ping -h 127.0.0.1 --silent')
  assert(healthcheckSuggere('postgres:16') === 'pg_isready -U postgres')
  assert(deviner_teinte('nginx:latest') === 'cyan')
})

test('chaque image du catalogue se reconnaît elle-même (auto-match, non-régression)', () => {
  for (const groupe of CATALOGUE) {
    for (const entree of groupe.images) {
      assert(
        deviner_teinte(entree.image) === groupe.teinte,
        `"${entree.image}" devrait deviner la teinte "${groupe.teinte}", obtenu "${deviner_teinte(entree.image)}"`
      )
    }
  }
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

test('chaque stack a une catégorie explicitement assignée (pas de repli silencieux)', () => {
  const sansCategorie = STACKS.filter((s) => !(s.id in CATEGORIE_PAR_STACK))
  assert(
    sansCategorie.length === 0,
    `stack(s) sans catégorie assignée dans CATEGORIE_PAR_STACK : ${sansCategorie.map((s) => s.id).join(', ')}`
  )
  for (const s of STACKS) {
    assert(typeof categorieDe(s) === 'string' && categorieDe(s) !== '', `categorieDe("${s.id}") devrait renvoyer une chaîne non vide`)
  }
})

test('chaque catégorie assignée à une stack correspond bien à une entrée de CATEGORIE_LABELS (sinon le chip de filtre afficherait "undefined")', () => {
  const inconnues = [...new Set(Object.values(CATEGORIE_PAR_STACK))].filter((c) => !(c in CATEGORIE_LABELS))
  assert(inconnues.length === 0, `catégorie(s) sans libellé dans CATEGORIE_LABELS : ${inconnues.join(', ')}`)
})

test('chaque stack, une fois construite (construireStack), passe la validation sans aucune erreur', () => {
  const problemes = []
  for (const stack of STACKS) {
    const services = construireStack(stack, new Set())
    const { erreurs } = validerServices(services)
    if (erreurs.length > 0) problemes.push(`"${stack.id}" : ${erreurs.join(' | ')}`)
  }
  assert(problemes.length === 0, `stack(s) invalide(s) une fois construites :\n${problemes.join('\n')}`)
})

console.log('\n--- importateur.js ---')

test('rejette un YAML invalide avec un message clair', () => {
  const { services, erreurs } = importerDockerCompose('services: [this is: not: valid')
  assert(services.length === 0, 'aucun service ne devrait être produit')
  assert(erreurs.some((e) => e.includes('YAML invalide')), 'devrait signaler un YAML invalide')
})

test('signale l\'absence de clé "services:"', () => {
  const { services, erreurs } = importerDockerCompose('networks:\n  frontend: {}\n')
  assert(services.length === 0)
  assert(erreurs.some((e) => e.includes('services:')))
})

test('ignore un service sans "image" (build local non supporté) avec un message explicite', () => {
  const { services, erreurs } = importerDockerCompose(
    'services:\n  app:\n    build: .\n  web:\n    image: nginx:latest\n'
  )
  assert(services.length === 1, 'seul "web" devrait être importé')
  assert(erreurs.some((e) => e.includes('app') && e.includes('image')))
})

test('importe les ports sous forme "8080:80" et objet {published, target}', () => {
  const yamlTexte = [
    'services:',
    '  web:',
    '    image: nginx:latest',
    '    ports:',
    '      - "8080:80/tcp"',
    '      - published: 9000',
    '        target: 90',
    '',
  ].join('\n')
  const { services } = importerDockerCompose(yamlTexte)
  assert(services[0].ports.length === 2)
  assert(services[0].ports[0].host === '8080' && services[0].ports[0].container === '80')
  assert(services[0].ports[1].host === '9000' && services[0].ports[1].container === '90')
})

test('importe environment sous forme liste ("K=V") et objet', () => {
  const listeYaml = 'services:\n  a:\n    image: nginx\n    environment:\n      - FOO=bar\n      - SANS_VALEUR\n'
  const { services: s1 } = importerDockerCompose(listeYaml)
  assert(s1[0].env.some((e) => e.key === 'FOO' && e.value === 'bar'))
  assert(s1[0].env.some((e) => e.key === 'SANS_VALEUR' && e.value === ''))

  const objetYaml = 'services:\n  a:\n    image: nginx\n    environment:\n      FOO: bar\n'
  const { services: s2 } = importerDockerCompose(objetYaml)
  assert(s2[0].env.some((e) => e.key === 'FOO' && e.value === 'bar'))
})

test('importe depends_on sous forme liste et objet (format long)', () => {
  const yamlTexte = 'services:\n  web:\n    image: nginx\n    depends_on:\n      db:\n        condition: service_healthy\n  db:\n    image: postgres:16\n'
  const { services } = importerDockerCompose(yamlTexte)
  const web = services.find((s) => s.name === 'web')
  assert(web.dependsOn.includes('db'), 'devrait extraire "db" du format long de depends_on')
})

test('importe un healthcheck CMD-SHELL et le format CMD classique', () => {
  const yamlCmdShell = 'services:\n  a:\n    image: nginx\n    healthcheck:\n      test: ["CMD-SHELL", "curl -f http://localhost"]\n'
  const { services: s1 } = importerDockerCompose(yamlCmdShell)
  assert(s1[0].healthcheck.enabled === true)
  assert(s1[0].healthcheck.test === 'curl -f http://localhost')

  const yamlCmd = 'services:\n  a:\n    image: nginx\n    healthcheck:\n      test: ["CMD", "curl", "-f", "http://localhost"]\n'
  const { services: s2 } = importerDockerCompose(yamlCmd)
  assert(s2[0].healthcheck.test === 'curl -f http://localhost')
})

test('marque un réseau interne (internal: true) importé', () => {
  const yamlTexte = 'services:\n  db:\n    image: postgres:16\n    networks:\n      - backend\nnetworks:\n  backend:\n    internal: true\n'
  const { networks } = importerDockerCompose(yamlTexte)
  const backend = networks.find((n) => n.nom === 'backend')
  assert(backend && backend.interne === true, 'le réseau "backend" devrait être marqué interne')
})

test('ajoute un réseau référencé par un service mais non déclaré en toplevel', () => {
  const yamlTexte = 'services:\n  web:\n    image: nginx\n    networks:\n      - frontend\n'
  const { networks } = importerDockerCompose(yamlTexte)
  assert(networks.some((n) => n.nom === 'frontend'), 'le réseau "frontend" devrait être reconstruit')
})

test('restaure le réglage Traefik (domaine + port) à partir des labels générés par DockerForge', () => {
  const yamlTexte = [
    'services:',
    '  app:',
    '    image: node:22-alpine',
    '    ports:',
    '      - "3000:3000"',
    '    labels:',
    '      - traefik.enable=true',
    '      - traefik.http.routers.app.rule=Host(`app.example.com`)',
    '      - traefik.http.routers.app.entrypoints=websecure',
    '      - traefik.http.routers.app.tls.certresolver=letsencrypt',
    '      - traefik.http.services.app.loadbalancer.server.port=3000',
    '',
  ].join('\n')
  const { services } = importerDockerCompose(yamlTexte)
  assert(services[0].traefik.active === true, 'Traefik devrait être actif après import')
  assert(services[0].traefik.domaine === 'app.example.com', `domaine attendu "app.example.com", obtenu "${services[0].traefik.domaine}"`)
  assert(services[0].traefik.port === '3000', `port attendu "3000", obtenu "${services[0].traefik.port}"`)
})

test('round-trip complet : générer un compose avec Traefik puis le réimporter donne le même réglage', () => {
  const service = serviceBase({
    name: 'app',
    ports: [{ host: '3000', container: '3000' }],
    traefik: { active: true, domaine: 'app.example.com', port: '' },
  })
  const yaml1 = buildDockerCompose([service])
  const { services } = importerDockerCompose(yaml1)
  assert(services[0].traefik.active === true)
  assert(services[0].traefik.domaine === 'app.example.com')
  // Le port explicite réimporté doit produire le même label qu'à l'origine.
  const yaml2 = buildDockerCompose(services)
  assertInclut(yaml2, 'traefik.http.services.app.loadbalancer.server.port=3000')
})

test('ne restaure aucun réglage Traefik en l\'absence de labels', () => {
  const { services } = importerDockerCompose('services:\n  a:\n    image: nginx\n')
  assert(services[0].traefik.active === false)
})

console.log('\n--- surlignageYaml.js ---')

test('colore une clé simple et sa valeur en chaîne', () => {
  const segments = tokeniserLigneYaml('  image: "nginx:latest"')
  assert(segments.some((s) => s.classe === 'yaml-cle' && s.texte === 'image'))
  assert(segments.some((s) => s.classe === 'yaml-chaine'))
})

test('colore un commentaire sur toute la ligne', () => {
  const segments = tokeniserLigneYaml('  # ceci est un commentaire')
  assert(segments.some((s) => s.classe === 'yaml-commentaire' && s.texte.includes('commentaire')))
})

test('colore un tiret de liste et distingue nombre/booléen', () => {
  const nombre = tokeniserLigneYaml('  - 42')
  assert(nombre.some((s) => s.classe === 'yaml-tiret'))
  assert(nombre.some((s) => s.classe === 'yaml-nombre'))

  const bool = tokeniserLigneYaml('enabled: true')
  assert(bool.some((s) => s.classe === 'yaml-bool'))
})

test('ne plante pas sur une ligne vide', () => {
  const segments = tokeniserLigneYaml('')
  assert(Array.isArray(segments))
})

console.log('\n--- modeles.js ---')

test('ajouterModele puis chargerModeles retrouve le modèle enregistré', () => {
  localStorage.clear()
  const service = serviceBase({ name: 'mon-service' })
  const liste = ajouterModele(service, 'Mon modèle')
  assert(liste.length === 1)
  const relu = chargerModeles()
  assert(relu.length === 1 && relu[0].nom === 'Mon modèle')
  assert(relu[0].service.name === 'mon-service', 'le service source doit être conservé dans le modèle')
  assert(!('id' in relu[0].service), 'l\'ancien id du service ne doit pas être conservé tel quel dans le modèle')
})

test('un modèle sans nom utilise le nom du service, puis un nom par défaut', () => {
  localStorage.clear()
  ajouterModele(serviceBase({ name: 'db' }), '')
  const [modele] = chargerModeles()
  assert(modele.nom === 'db')

  localStorage.clear()
  ajouterModele(serviceBase({ name: '' }), '')
  const [sansNom] = chargerModeles()
  assert(sansNom.nom === 'Modèle sans nom')
})

test('supprimerModele retire uniquement le modèle visé', () => {
  localStorage.clear()
  ajouterModele(serviceBase({ name: 'a' }), 'A')
  const liste = ajouterModele(serviceBase({ name: 'b' }), 'B')
  const idA = liste.find((m) => m.nom === 'A').id
  const restants = supprimerModele(idA)
  assert(restants.length === 1 && restants[0].nom === 'B')
})

test('instancierModele régénère un id et décale le port en cas de conflit', () => {
  localStorage.clear()
  ajouterModele(serviceBase({ name: 'web', ports: [{ host: '8080', container: '80' }] }), 'Web')
  const [modele] = chargerModeles()
  const instance = instancierModele(modele, new Set([8080]))
  assert(instance.id !== undefined && instance.id !== 'test-id', 'devrait recevoir un nouvel id')
  assert(instance.ports[0].host === '8081', `le port devrait être décalé à 8081, obtenu ${instance.ports[0].host}`)
})

test("instancierModele préserve un port non numérique (ex: plage \"3000-3005\") au lieu de le corrompre en \"NaN\"", () => {
  localStorage.clear()
  ajouterModele(serviceBase({ name: 'web', ports: [{ host: '3000-3005', container: '3000-3005' }] }), 'Plage')
  const [modele] = chargerModeles()
  const instance = instancierModele(modele, new Set())
  assert(instance.ports[0].host === '3000-3005', `attendu la plage préservée, obtenu "${instance.ports[0].host}"`)
})

test('chargerModeles renvoie une liste vide si le stockage est corrompu', () => {
  localStorage.setItem('dockerforge_modeles', '{ceci nest pas du json')
  assert(Array.isArray(chargerModeles()) && chargerModeles().length === 0)
})

console.log('\n--- projets.js ---')

test('chargerProjets crée un premier projet vide si rien n\'est stocké', () => {
  localStorage.clear()
  const etat = chargerProjets()
  assert(etat.projets.length === 1)
  assert(etat.actifId === etat.projets[0].id)
})

test('sauvegarderProjets puis chargerProjets relit le même état', () => {
  localStorage.clear()
  const p = projetVide('Test')
  p.services = [serviceBase()]
  sauvegarderProjets({ projets: [p], actifId: p.id })
  const relu = chargerProjets()
  assert(relu.projets.length === 1 && relu.projets[0].nom === 'Test')
  assert(relu.projets[0].services.length === 1)
})

test('migre automatiquement l\'ancien format mono-projet', () => {
  localStorage.clear()
  localStorage.setItem('dockerforge_services', JSON.stringify([serviceBase({ name: 'migre' })]))
  const etat = chargerProjets()
  assert(etat.projets.length === 1)
  assert(etat.projets[0].services[0].name === 'migre')
})

test('exporterProjet puis importerProjet reproduit les services avec de nouveaux id', () => {
  const p = projetVide('Original')
  p.services = [serviceBase({ id: 'ancien-id' })]
  const exporte = exporterProjet(p)
  const reimporte = importerProjet(exporte)
  assert(reimporte.nom === 'Original (importé)')
  assert(reimporte.services[0].id !== 'ancien-id', 'un nouvel id doit être généré pour éviter les collisions')
  assert(reimporte.id !== p.id, 'le projet importé doit avoir son propre id')
})

test('importerProjet rejette un JSON qui n\'est pas un projet DockerForge', () => {
  let leve = false
  try {
    importerProjet({ pas: 'un projet' })
  } catch {
    leve = true
  }
  assert(leve, 'devrait lever une erreur sur un JSON invalide')
})

console.log('\n--- clipboard.js ---')

// Node fournit déjà un `navigator` global en lecture seule (accesseur sans
// setter) : une simple affectation `globalThis.navigator = ...` échoue avec
// "Cannot set property navigator of #<Object> which has only a getter".
// Object.defineProperty permet de le redéfinir proprement pour les besoins
// du test, sans dépendre d'un environnement DOM.
function simulerNavigator(valeur) {
  Object.defineProperty(globalThis, 'navigator', { value: valeur, configurable: true, writable: true })
}

testAsync('utilise navigator.clipboard quand il fonctionne', async () => {
  let recu = null
  simulerNavigator({ clipboard: { writeText: async (t) => { recu = t } } })
  const ok = await copierTexte('bonjour')
  assert(ok === true)
  assert(recu === 'bonjour')
})

testAsync('se rabat sur document.execCommand si navigator.clipboard échoue', async () => {
  simulerNavigator({ clipboard: { writeText: async () => { throw new Error('permission refusée') } } })
  let commandeAppelee = false
  globalThis.document = {
    createElement: () => ({ style: {}, select() {}, value: '' }),
    body: { appendChild() {}, removeChild() {} },
    execCommand: () => { commandeAppelee = true; return true },
  }
  const ok = await copierTexte('bonjour')
  assert(ok === true, 'devrait réussir via le repli execCommand')
  assert(commandeAppelee === true, 'le repli devrait avoir été sollicité')
})

testAsync('se rabat sur document.execCommand si navigator.clipboard est absent', async () => {
  simulerNavigator({})
  let commandeAppelee = false
  globalThis.document = {
    createElement: () => ({ style: {}, select() {}, value: '' }),
    body: { appendChild() {}, removeChild() {} },
    execCommand: () => { commandeAppelee = true; return true },
  }
  const ok = await copierTexte('bonjour')
  assert(ok === true)
  assert(commandeAppelee === true)
})

testAsync('renvoie false si aucune des deux méthodes ne fonctionne (au lieu de lever une exception)', async () => {
  simulerNavigator({ clipboard: { writeText: async () => { throw new Error('refusé') } } })
  globalThis.document = {
    createElement: () => ({ style: {}, select() {}, value: '' }),
    body: { appendChild() {}, removeChild() {} },
    execCommand: () => false,
  }
  const ok = await copierTexte('bonjour')
  assert(ok === false)
})

for (const { nom, fn } of testsAsyncEnAttente) {
  nbTests += 1
  try {
    await fn()
    console.log(`  ✓ ${nom}`)
  } catch (e) {
    nbEchecs += 1
    console.error(`  ✗ ${nom}`)
    console.error(`    ${e.message}`)
  }
}

console.log(`\n${nbTests - nbEchecs}/${nbTests} tests réussis.`)
if (nbEchecs > 0) {
  console.error(`${nbEchecs} échec(s).`)
  process.exit(1)
}
