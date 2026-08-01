// i18n.js — traduction de l'interface (FR/EN).
//
// Approche volontairement légère plutôt qu'une lib i18n complète : un
// dictionnaire plat { fr: {...}, en: {...} }, une clé par chaîne d'interface,
// et un hook useLangue() qui renvoie { langue, definirLangue, t }.
//
// t(cle) se rabat sur le français puis sur la clé elle-même si une
// traduction manque, pour ne jamais afficher de blanc ou planter pendant
// que la traduction se complète progressivement.

import { createContext, useContext, useState, useCallback } from 'react'

const CLE_STOCKAGE = 'dockerforge_langue'

export const TRADUCTIONS = {
  fr: {
    // --- Hero / en-tête ---
    'hero.eyebrow': 'GÉNÉRATEUR DE DOCKER-COMPOSE',
    'hero.sousTitre': 'Assemble tes conteneurs, ajuste les ports et volumes, et récupère un docker-compose.yml prêt à l\'emploi — sans jamais écrire une ligne de YAML à la main.',
    'hero.nomProjetLabel': 'Nom du projet',
    'hero.nomProjetPlaceholder': 'mon-projet',
    'hero.statsServices': 'service(s)',
    'hero.statsPorts': 'port(s) exposé(s)',
    'hero.statsVolumes': 'volume(s)',
    // --- Navigation / actions globales ---
    'nav.palette': 'Rechercher une action',
    'nav.raccourcis': 'Raccourcis clavier',
    'nav.guideUtilisation': 'Guide d\'utilisation',
    'nav.guideInstallation': 'Guide d\'installation',
    'nav.themeClair': 'Passer en clair',
    'nav.themeSombre': 'Passer en sombre',
    'nav.langue': 'English',
    'nav.toutEffacer': 'Tout effacer',
    'nav.annuler': '↺ Annuler',
    // --- Onglets ---
    'onglet.services': 'Services',
    'onglet.reseaux': 'Réseaux',
    'onglet.apercu': 'Aperçu',
    'onglet.stacks': 'Stacks prêtes à l\'emploi',
    'onglet.modeles': 'Mes modèles',
    // --- Sections ---
    'section.ajouterService': 'Ajouter un service',
    'section.servicesActuels': 'Conteneurs',
    'section.apercu': 'Aperçu',
    // --- ServiceForm ---
    'sf.modification': 'MODIFICATION',
    'sf.nouveauConteneur': 'NOUVEAU CONTENEUR',
    'sf.modifierTitre': 'Modifier',
    'sf.nomService': 'Nom du service',
    'sf.nomServiceAide': 'Identifiant du conteneur dans ton projet (ex: web, db). Utilisé aussi comme nom d\'hôte : un autre conteneur peut y accéder via ce nom.',
    'sf.nomServicePlaceholder': 'ex: web, db, redis...',
    'sf.imageDocker': 'Image Docker',
    'sf.imageDockerAide': 'Le modèle du conteneur, publié sur Docker Hub. Format : nom:version (ex: nginx:latest = toujours la dernière version stable).',
    'sf.imageDockerPlaceholder': 'ex: nginx:latest, postgres:16',
    'sf.ports': 'Ports (hôte → conteneur)',
    'sf.portsAide': 'Le port hôte est celui que tu utilises depuis ton navigateur (ex: localhost:8080). Le port conteneur est celui que l\'appli écoute à l\'intérieur — souvent fixé par l\'image, ne le change pas au hasard.',
    'sf.portHotePlaceholder': 'Port hôte, ex: 8080',
    'sf.decale': 'décalé ✓',
    'sf.portConteneurPlaceholder': 'Port conteneur, ex: 80',
    'sf.ajouterPort': '+ Ajouter un port',
    'sf.volumesEtEnv': 'Volumes et variables d\'environnement',
    'sf.volumes': 'Volumes',
    'sf.volumesAide': 'Un volume relie un dossier de ton PC à un dossier du conteneur, pour que les données survivent même si le conteneur est supprimé. Format : ./dossier-local:/dossier-dans-le-conteneur',
    'sf.volumePlaceholder': 'ex: ./data:/var/lib/mysql',
    'sf.ajouterVolume': '+ Ajouter un volume',
    'sf.variablesEnv': 'Variables d\'environnement',
    'sf.variablesEnvAide': 'Des réglages passés au conteneur au démarrage (mots de passe, options...). Chaque image documente les siennes sur Docker Hub.',
    'sf.clePlaceholder': 'CLE',
    'sf.valeurPlaceholder': 'valeur',
    'sf.cleAppAide': 'Cette clé n\'est pas un simple mot de passe : c\'est une clé de chiffrement propre à l\'application (souvent 32 caractères encodés en base64). Le bouton 🎲 génère une valeur aléatoire de bonne longueur pour démarrer, mais vérifie la doc Docker Hub de l\'image : certaines applis exigent un format précis (ex: préfixe \'base64:\', ou une commande dédiée comme \'php artisan key:generate\') et refuseront de démarrer sinon.',
    'sf.genererSecretTitle': 'Générer une valeur aléatoire sécurisée',
    'sf.ajouterVariable': '+ Ajouter une variable',
    'sf.optionsAvancees': 'Options avancées (redémarrage, dépendances, réseaux, profils, santé, ressources, sécurité)',
    'sf.commandePerso': 'Commande personnalisée (command)',
    'sf.commandePersoAide': 'Remplace la commande de démarrage par défaut de l\'image. Utile pour certaines images qui exigent une sous-commande précise pour fonctionner (ex. « serve » pour ntfy, ou « bundle exec sidekiq -C config/sidekiq.yml » pour un worker Rails). Laisse vide pour garder le comportement par défaut de l\'image — c\'est le bon choix dans la grande majorité des cas.',
    'sf.commandePersoPlaceholder': 'ex: serve (laisser vide sauf besoin précis)',
    'sf.redemarrage': 'Redémarrage',
    'sf.redemarrageAide': 'Que faire si le conteneur plante ou si la machine redémarre. « Sauf arrêt manuel » est le bon choix par défaut : il repart tout seul sauf si tu l\'as arrêté volontairement.',
    'sf.delaiArret': 'Délai d\'arrêt propre (stop_grace_period)',
    'sf.delaiArretAide': 'Temps laissé au conteneur pour s\'arrêter proprement (terminer ses requêtes en cours, fermer sa connexion à la base...) avant que Docker ne le tue de force. Utile pour les services qui ont besoin de quelques secondes pour fermer proprement. Format : ex. 30s, 1m.',
    'sf.delaiArretPlaceholder': 'ex: 30s (par défaut : 10s)',
    'sf.dependDe': 'Dépend de',
    'sf.dependDeAide': 'Ce service démarrera après ceux que tu sélectionnes ici (utile si ton appli a besoin que sa base de données soit déjà lancée).',
    'sf.reseaux': 'Réseaux',
    'sf.reseauxAide': 'Place ce service sur un ou plusieurs réseaux personnalisés pour l\'isoler des autres conteneurs (ex: mettre la base de données seule avec l\'appli, sans exposer au reste).',
    'sf.profils': 'Profils',
    'sf.profilsAide': 'Un service avec un profil ne démarre pas avec un simple « docker compose up » — il faut préciser --profile nom. Pratique pour des outils optionnels (debug, seed de données...).',
    'sf.profilNeDemarreQue': 'Ce service ne démarrera qu\'avec',
    'sf.profilAutresChoisis': ' (ou un des autres profils choisis)',
    'sf.veriSante': 'Vérification de santé',
    'sf.veriSanteAide': 'Docker vérifie régulièrement que le conteneur répond bien, pas juste qu\'il est démarré. Utile avec « depends_on » pour attendre qu\'une base de données soit vraiment prête.',
    'sf.activerSante': 'Activer la vérification de santé du conteneur',
    'sf.testSantePlaceholder': 'ex: curl -f http://localhost/ || exit 1',
    'sf.intervallePlaceholder': 'Intervalle (30s)',
    'sf.timeoutPlaceholder': 'Timeout (5s)',
    'sf.essaisPlaceholder': 'Essais (3)',
    'sf.limitesRessources': 'Limites de ressources',
    'sf.limitesRessourcesAide': 'Empêche ce conteneur de consommer toute la RAM/CPU de ta machine. Optionnel, utile si tu fais tourner beaucoup de conteneurs en même temps.',
    'sf.ramPlaceholder': 'RAM max, ex: 512m',
    'sf.cpuPlaceholder': 'CPU max, ex: 0.5',
    'sf.rotationLogs': 'Rotation des logs',
    'sf.rotationLogsAide': 'Sans limite, les logs d\'un conteneur peuvent grossir indéfiniment et remplir le disque avec le temps (driver json-file par défaut). Optionnel, recommandé pour un service qui tourne longtemps en production.',
    'sf.tailleMaxPlaceholder': 'Taille max par fichier, ex: 10m',
    'sf.nbFichiersPlaceholder': 'Nb de fichiers conservés, ex: 3',
    'sf.reverseProxy': 'Reverse proxy (Traefik)',
    'sf.reverseProxyAide': 'Génère automatiquement les labels Docker lus par Traefik pour router le trafic vers ce service par nom de domaine, avec HTTPS automatique (Let\'s Encrypt). Suppose qu\'un conteneur Traefik tourne déjà sur le même réseau Docker (voir la stack « Traefik » prête à charger).',
    'sf.exposerTraefik': 'Exposer ce service via Traefik',
    'sf.domainePlaceholder': 'Nom de domaine, ex: app.mondomaine.fr',
    'sf.portInternePlaceholder': 'Port interne (auto si vide)',
    'sf.durcissement': 'Durcissement du conteneur',
    'sf.durcissementAide': 'Réduit ce que le conteneur peut faire, même s\'il est compromis : moins de capacités Linux, pas d\'écriture sur le système de fichiers, pas d\'élévation de privilèges. Recommandé pour tout service exposé, surtout via Traefik.',
    'sf.utilisateur': 'Utilisateur (UID:GID)',
    'sf.utilisateurAide': 'Force le conteneur à tourner avec un utilisateur non-root, même si l\'image ne le fait pas par défaut. Réduit fortement l\'impact d\'une éventuelle faille dans l\'application. Exemple : 1000:1000. Laisse vide pour garder le comportement par défaut de l\'image.',
    'sf.utilisateurPlaceholder': 'ex: 1000:1000 (vide = défaut de l\'image)',
    'sf.initProcess': 'Utiliser un init-process (tini) pour nettoyer les processus zombies',
    'sf.lectureSeule': 'Système de fichiers en lecture seule (read_only)',
    'sf.noNewPriv': 'Interdire l\'élévation de privilèges (no-new-privileges)',
    'sf.dropCaps': 'Supprimer toutes les capacités Linux par défaut (cap_drop: ALL)',
    'sf.capacitesPlaceholder': 'Capacités à rendre (ex: NET_BIND_SERVICE, CHOWN)',
    'sf.lectureSeuleExplication': 'Le système de fichiers est en lecture seule : ajoute ici les dossiers où l\'appli a quand même besoin d\'écrire (cache, fichiers temporaires...). Ils seront montés en mémoire (perdus au redémarrage), sans quoi l\'appli risque de planter au démarrage.',
    'sf.tmpfsPlaceholder': 'ex: /tmp ou /var/cache/nginx',
    'sf.ajouterDossierMemoire': '+ Ajouter un dossier en mémoire',
    'sf.hotesSupp': 'Hôtes supplémentaires (extra_hosts)',
    'sf.hotesSuppAide': 'Ajoute des entrées à la résolution DNS interne du conteneur, comme /etc/hosts. Utile pour faire pointer un nom de domaine vers une IP locale (ex: un service qui tourne sur la machine hôte). Format : nom-hote:adresse-ip.',
    'sf.hotePlaceholder': 'ex: host.docker.internal:172.17.0.1',
    'sf.ajouterHote': '+ Ajouter un hôte',
    'sf.enregistrerModifs': '✓ Enregistrer les modifications',
    'sf.ajouterConteneur': '+ Ajouter ce conteneur',
    'sf.annuler': 'Annuler',
  },
  en: {
    'hero.eyebrow': 'DOCKER-COMPOSE GENERATOR',
    'hero.sousTitre': 'Assemble your containers, adjust ports and volumes, and get a ready-to-use docker-compose.yml — without writing a single line of YAML by hand.',
    'hero.nomProjetLabel': 'Project name',
    'hero.nomProjetPlaceholder': 'my-project',
    'hero.statsServices': 'service(s)',
    'hero.statsPorts': 'exposed port(s)',
    'hero.statsVolumes': 'volume(s)',
    'nav.palette': 'Search an action',
    'nav.raccourcis': 'Keyboard shortcuts',
    'nav.guideUtilisation': 'Usage guide',
    'nav.guideInstallation': 'Installation guide',
    'nav.themeClair': 'Switch to light',
    'nav.themeSombre': 'Switch to dark',
    'nav.langue': 'Français',
    'nav.toutEffacer': 'Clear all',
    'nav.annuler': '↺ Undo',
    'onglet.services': 'Services',
    'onglet.reseaux': 'Networks',
    'onglet.apercu': 'Preview',
    'onglet.stacks': 'Ready-made stacks',
    'onglet.modeles': 'My templates',
    'section.ajouterService': 'Add a service',
    'section.servicesActuels': 'Containers',
    'section.apercu': 'Preview',
    // --- ServiceForm ---
    'sf.modification': 'EDITING',
    'sf.nouveauConteneur': 'NEW CONTAINER',
    'sf.modifierTitre': 'Edit',
    'sf.nomService': 'Service name',
    'sf.nomServiceAide': 'The container\'s identifier in your project (e.g. web, db). Also used as its hostname: other containers can reach it by this name.',
    'sf.nomServicePlaceholder': 'e.g.: web, db, redis...',
    'sf.imageDocker': 'Docker image',
    'sf.imageDockerAide': 'The container\'s template, published on Docker Hub. Format: name:tag (e.g. nginx:latest = always the latest stable version).',
    'sf.imageDockerPlaceholder': 'e.g.: nginx:latest, postgres:16',
    'sf.ports': 'Ports (host → container)',
    'sf.portsAide': 'The host port is the one you use from your browser (e.g. localhost:8080). The container port is the one the app listens on inside — usually fixed by the image, don\'t change it at random.',
    'sf.portHotePlaceholder': 'Host port, e.g. 8080',
    'sf.decale': 'shifted ✓',
    'sf.portConteneurPlaceholder': 'Container port, e.g. 80',
    'sf.ajouterPort': '+ Add a port',
    'sf.volumesEtEnv': 'Volumes and environment variables',
    'sf.volumes': 'Volumes',
    'sf.volumesAide': 'A volume links a folder on your machine to a folder inside the container, so data survives even if the container is removed. Format: ./local-folder:/folder-in-container',
    'sf.volumePlaceholder': 'e.g.: ./data:/var/lib/mysql',
    'sf.ajouterVolume': '+ Add a volume',
    'sf.variablesEnv': 'Environment variables',
    'sf.variablesEnvAide': 'Settings passed to the container at startup (passwords, options...). Each image documents its own on Docker Hub.',
    'sf.clePlaceholder': 'KEY',
    'sf.valeurPlaceholder': 'value',
    'sf.cleAppAide': 'This key isn\'t a simple password: it\'s an encryption key specific to the app (often 32 base64-encoded characters). The 🎲 button generates a random value of the right length to get started, but check the image\'s Docker Hub docs: some apps require a precise format (e.g. a \'base64:\' prefix, or a dedicated command like \'php artisan key:generate\') and will refuse to start otherwise.',
    'sf.genererSecretTitle': 'Generate a secure random value',
    'sf.ajouterVariable': '+ Add a variable',
    'sf.optionsAvancees': 'Advanced options (restart, dependencies, networks, profiles, health, resources, security)',
    'sf.commandePerso': 'Custom command (command)',
    'sf.commandePersoAide': 'Overrides the image\'s default startup command. Useful for images that require a specific subcommand to work (e.g. \'serve\' for ntfy, or \'bundle exec sidekiq -C config/sidekiq.yml\' for a Rails worker). Leave empty to keep the image\'s default behaviour — the right choice in the vast majority of cases.',
    'sf.commandePersoPlaceholder': 'e.g.: serve (leave empty unless you need it)',
    'sf.redemarrage': 'Restart',
    'sf.redemarrageAide': 'What to do if the container crashes or the machine restarts. \'Unless stopped\' is the right default: it comes back on its own unless you stopped it yourself.',
    'sf.delaiArret': 'Graceful stop delay (stop_grace_period)',
    'sf.delaiArretAide': 'Time given to the container to shut down cleanly (finish in-flight requests, close its database connection...) before Docker force-kills it. Useful for services that need a few seconds to close properly. Format: e.g. 30s, 1m.',
    'sf.delaiArretPlaceholder': 'e.g.: 30s (default: 10s)',
    'sf.dependDe': 'Depends on',
    'sf.dependDeAide': 'This service will start after the ones you select here (useful if your app needs its database already running).',
    'sf.reseaux': 'Networks',
    'sf.reseauxAide': 'Places this service on one or more custom networks to isolate it from other containers (e.g. keeping the database alone with the app, without exposing it to the rest).',
    'sf.profils': 'Profiles',
    'sf.profilsAide': 'A service with a profile doesn\'t start with a plain \'docker compose up\' — you need to specify --profile name. Handy for optional tools (debug, data seeding...).',
    'sf.profilNeDemarreQue': 'This service will only start with',
    'sf.profilAutresChoisis': ' (or one of the other profiles chosen)',
    'sf.veriSante': 'Health check',
    'sf.veriSanteAide': 'Docker regularly checks that the container actually responds, not just that it started. Useful with \'depends_on\' to wait for a database to be truly ready.',
    'sf.activerSante': 'Enable the container\'s health check',
    'sf.testSantePlaceholder': 'e.g.: curl -f http://localhost/ || exit 1',
    'sf.intervallePlaceholder': 'Interval (30s)',
    'sf.timeoutPlaceholder': 'Timeout (5s)',
    'sf.essaisPlaceholder': 'Retries (3)',
    'sf.limitesRessources': 'Resource limits',
    'sf.limitesRessourcesAide': 'Prevents this container from using up all your machine\'s RAM/CPU. Optional, useful if you run many containers at once.',
    'sf.ramPlaceholder': 'Max RAM, e.g. 512m',
    'sf.cpuPlaceholder': 'Max CPU, e.g. 0.5',
    'sf.rotationLogs': 'Log rotation',
    'sf.rotationLogsAide': 'Without a limit, a container\'s logs can grow indefinitely and fill up the disk over time (default json-file driver). Optional, recommended for a service running long-term in production.',
    'sf.tailleMaxPlaceholder': 'Max size per file, e.g. 10m',
    'sf.nbFichiersPlaceholder': 'Number of files kept, e.g. 3',
    'sf.reverseProxy': 'Reverse proxy (Traefik)',
    'sf.reverseProxyAide': 'Automatically generates the Docker labels read by Traefik to route traffic to this service by domain name, with automatic HTTPS (Let\'s Encrypt). Assumes a Traefik container is already running on the same Docker network (see the ready-made \'Traefik\' stack).',
    'sf.exposerTraefik': 'Expose this service via Traefik',
    'sf.domainePlaceholder': 'Domain name, e.g. app.mydomain.com',
    'sf.portInternePlaceholder': 'Internal port (auto if empty)',
    'sf.durcissement': 'Container hardening',
    'sf.durcissementAide': 'Reduces what the container can do, even if compromised: fewer Linux capabilities, no filesystem writes, no privilege escalation. Recommended for any exposed service, especially via Traefik.',
    'sf.utilisateur': 'User (UID:GID)',
    'sf.utilisateurAide': 'Forces the container to run as a non-root user, even if the image doesn\'t by default. Greatly reduces the impact of a potential flaw in the app. Example: 1000:1000. Leave empty to keep the image\'s default behaviour.',
    'sf.utilisateurPlaceholder': 'e.g.: 1000:1000 (empty = image default)',
    'sf.initProcess': 'Use an init process (tini) to reap zombie processes',
    'sf.lectureSeule': 'Read-only filesystem (read_only)',
    'sf.noNewPriv': 'Forbid privilege escalation (no-new-privileges)',
    'sf.dropCaps': 'Drop all Linux capabilities by default (cap_drop: ALL)',
    'sf.capacitesPlaceholder': 'Capabilities to re-add (e.g. NET_BIND_SERVICE, CHOWN)',
    'sf.lectureSeuleExplication': 'The filesystem is read-only: add here the folders where the app still needs to write (cache, temp files...). They\'ll be mounted in memory (lost on restart) — otherwise the app may crash on startup.',
    'sf.tmpfsPlaceholder': 'e.g.: /tmp or /var/cache/nginx',
    'sf.ajouterDossierMemoire': '+ Add an in-memory folder',
    'sf.hotesSupp': 'Extra hosts (extra_hosts)',
    'sf.hotesSuppAide': 'Adds entries to the container\'s internal DNS resolution, like /etc/hosts. Useful to point a domain name to a local IP (e.g. a service running on the host machine). Format: host-name:ip-address.',
    'sf.hotePlaceholder': 'e.g.: host.docker.internal:172.17.0.1',
    'sf.ajouterHote': '+ Add a host',
    'sf.enregistrerModifs': '✓ Save changes',
    'sf.ajouterConteneur': '+ Add this container',
    'sf.annuler': 'Cancel',
  },
}

export const LangueContext = createContext(null)

function detecterLangueInitiale() {
  try {
    const stockee = localStorage.getItem(CLE_STOCKAGE)
    if (stockee === 'fr' || stockee === 'en') return stockee
  } catch {
    // localStorage indisponible : on retombe sur la détection navigateur.
  }
  return 'fr'
}

// À utiliser une seule fois, à la racine (App.jsx) : fournit la langue et la
// fonction t() à tout l'arbre de composants via le contexte.
export function useLangueProvider() {
  const [langue, setLangue] = useState(detecterLangueInitiale)

  const definirLangue = useCallback((nouvelle) => {
    setLangue(nouvelle)
    try {
      localStorage.setItem(CLE_STOCKAGE, nouvelle)
    } catch {
      // Pas grave si ça échoue : le choix ne persistera juste pas.
    }
  }, [])

  const t = useCallback(
    (cle) => TRADUCTIONS[langue]?.[cle] ?? TRADUCTIONS.fr[cle] ?? cle,
    [langue]
  )

  return { langue, definirLangue, t }
}

// À utiliser dans n'importe quel composant descendant pour lire la langue
// actuelle et traduire du texte.
export function useLangue() {
  const ctx = useContext(LangueContext)
  if (!ctx) {
    // Filet de sécurité si un composant est rendu hors du Provider (tests
    // unitaires isolés, par exemple) : se comporte comme si tout était en
    // français plutôt que de planter.
    return { langue: 'fr', definirLangue: () => {}, t: (cle) => TRADUCTIONS.fr[cle] ?? cle }
  }
  return ctx
}
