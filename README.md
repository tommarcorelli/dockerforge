# 🐳 DockerForge

Générateur de `docker-compose.yml` — React + Vite. Décris tes conteneurs sur
un « quai de chargement » visuel, DockerForge génère un YAML propre et validé.

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvre `http://localhost:5173/`.

## Build & déploiement

```bash
npm run build
```

Le dossier `dist/` généré peut être déployé sur GitHub Pages, Netlify ou Vercel (gratuit).

### Déploiement automatique sur GitHub Pages

Un workflow est déjà prêt dans `.github/workflows/deploy.yml` : à chaque
`push` sur la branche `main`, le site est reconstruit et republié
automatiquement. **Une seule chose à faire une fois** après avoir push le
projet sur GitHub :

1. Sur GitHub, va dans **Settings** du repo → **Pages** (menu de gauche).
2. Sous "Build and deployment" → **Source**, choisis **GitHub Actions**
   (pas "Deploy from a branch").
3. Fais un `push` (ou relance le workflow depuis l'onglet **Actions** du repo).
4. Après 1-2 minutes, l'URL publique apparaît dans **Settings → Pages**
   (format `https://tommarcorelli.github.io/nom-du-repo/`).

Ensuite, plus rien à faire : chaque `push` sur `main` republie le site à jour.

## Structure

```
dockerforge/
├── src/
│   ├── components/
│   │   ├── ServiceForm.jsx          formulaire d'ajout d'un conteneur (3 niveaux : essentiel/config/avancé)
│   │   ├── ServiceList.jsx          liste des conteneurs (affichage "cargo", réordonnable)
│   │   ├── Preview.jsx              aperçu du docker-compose.yml + export .zip
│   │   ├── ImageCatalog.jsx         catalogue d'images cliquables + recherche
│   │   ├── StackPresets.jsx         stacks prêtes à charger en un clic
│   │   ├── MesModeles.jsx           modèles de service personnels réutilisables
│   │   ├── NetworkManager.jsx       création/suppression de réseaux Docker
│   │   ├── ProjectManager.jsx       gestion de plusieurs projets (onglets de projets)
│   │   ├── SchemaNavire.jsx         schéma visuel du "navire" (vue d'ensemble des conteneurs/réseaux)
│   │   ├── GuideUtilisationModal.jsx  modale d'aide à l'utilisation de l'outil
│   │   ├── GuideInstallationModal.jsx modale d'aide à l'installation de Docker
│   │   ├── Aide.jsx                 bulle d'aide ⓘ réutilisable (tooltip)
│   │   └── Icon.jsx                 rendu d'icônes simple-icons (logo Docker...)
│   ├── core/
│   │   ├── generateur.js            construction + validation du YAML, extraction des secrets, export docker run
│   │   ├── surlignageYaml.js        coloration syntaxique légère de l'aperçu YAML
│   │   ├── catalogue.js             images populaires, résolution de ports, healthchecks suggérés
│   │   ├── stacks.js                combos de services (LAMP, WordPress...)
│   │   ├── importateur.js           lecture d'un docker-compose.yml existant pour l'éditer
│   │   ├── modeles.js                modèles de service réutilisables (localStorage, partagés entre projets)
│   │   └── projets.js               gestion de plusieurs projets (stockage, création, etc.)
│   ├── styles/
│   │   └── index.css                identité visuelle claire, façon dashboard moderne
│   ├── App.jsx                      composant racine (navigation par onglets)
│   └── main.jsx                     point d'entrée
├── index.html
├── vite.config.js
└── package.json                     dépend de react, jszip, js-yaml, simple-icons
```

## Fonctionnalités actuelles

**Navigation**
- Interface organisée en **3 onglets** : Services (formulaire + quai de
  chargement), Réseaux (création + répartition des services par réseau),
  Aperçu (YAML généré + export). Réduit la longueur de page par rapport à
  tout afficher en une fois.
- **Multi-projets** : plusieurs configurations distinctes gérées en parallèle
  (créer, renommer, dupliquer, supprimer un projet), chacune avec ses propres
  services/réseaux/réglages, sauvegardées séparément.

**Formulaire & catalogue**
- 3 niveaux de complexité : champs essentiels toujours visibles (nom, image,
  ports), "Volumes et variables d'environnement" repliable, "Options avancées"
  repliable (redémarrage, dépendances, réseaux, profils, santé, ressources).
- **Édition en place** d'un service déjà ajouté (bouton ✎), plutôt que de devoir
  le supprimer et le recréer — le renommage propage automatiquement les
  `depends_on` des autres services qui le référençaient.
- **Bulles d'aide ⓘ** sur chaque champ, pensées pour quelqu'un qui débute avec Docker.
- Catalogue d'images cliquables **avec barre de recherche**, groupé par
  catégorie — pré-remplit image, nom suggéré, port par défaut, variables
  d'env usuelles et commande de healthcheck.
- Résolution automatique des conflits de port (choix d'image, saisie
  manuelle, duplication, import).
- Génération de mot de passe sécurisé en un clic pour les champs sensibles.

**Options avancées par service**
- Politique de redémarrage (`restart`), dépendances (`depends_on`),
  vérification de santé (`healthcheck`), limites de ressources (`mem_limit`,
  `cpus`), profils d'activation (`profiles`).
- **Durcissement du conteneur (nouveau)** : système de fichiers en lecture
  seule (`read_only`), interdiction de l'élévation de privilèges
  (`security_opt: no-new-privileges:true`), suppression de toutes les
  capacités Linux par défaut (`cap_drop: ALL`) avec possibilité d'en
  rendre certaines explicitement (`cap_add`), exécution sous un utilisateur
  non-root (`user: UID:GID`), init-process anti-zombies (`init: true`),
  délai d'arrêt propre (`stop_grace_period`) et hôtes DNS supplémentaires
  (`extra_hosts`). Généré dans le YAML, le script `docker run` équivalent
  (`--read-only`, `--cap-drop`, `--cap-add`, `--security-opt`, `--user`,
  `--init`, `--stop-timeout`, `--add-host`, `--tmpfs`) et le manifeste
  Kubernetes (`securityContext.runAsUser/runAsGroup`,
  `terminationGracePeriodSeconds`, `hostAliases`, volumes `emptyDir` en
  mémoire pour `tmpfs`) ; relu correctement à l'import d'un compose
  existant. Quand la lecture seule est activée, le formulaire propose
  directement d'ajouter les dossiers à monter en mémoire (`tmpfs`).
- **Rotation des logs (nouveau)** : taille max par fichier et nombre de
  fichiers conservés (driver `json-file`), pour éviter qu'un conteneur qui
  tourne longtemps ne remplisse le disque avec ses logs. Génère le bloc
  `logging:` dans le YAML et les `--log-opt` équivalents dans le script
  `docker run` ; relu correctement à l'import d'un compose existant.
- **Reverse proxy Traefik en un clic** : coche "Exposer via Traefik", indique
  un nom de domaine (+ port interne optionnel), et les labels Docker
  (`traefik.enable`, routeur, entrypoint HTTPS, certresolver Let's Encrypt)
  sont générés automatiquement dans le YAML *et* dans le script `docker run`
  équivalent. Un avertissement apparaît si l'option est activée sans domaine.

**Export du schéma en SVG (nouveau)**
- Bouton "⬇ Exporter le schéma en .svg" au-dessus du schéma des conteneurs
  (onglet Réseaux) : télécharge un fichier `.svg` autonome (couleurs du
  thème actif figées en dur, lisible même hors de l'appli), pour
  l'intégrer dans une documentation par exemple.

**Export Kubernetes (nouveau)**
- Un 3e onglet dans l'Aperçu génère un manifeste Kubernetes basique
  (`Deployment` + `Service` par conteneur, `Secret` si "Extraire les
  secrets" est actif) à partir des mêmes services — un point de départ pour
  migrer vers un cluster, pas un export production-ready (pas de
  `PersistentVolumeClaim` ni d'`Ingress` générés). Inclus dans le zip
  complet (`k8s.yaml`) et téléchargeable seul.

**Sécurisation des secrets**
- Génération d'un mot de passe aléatoire robuste par champ (déjà existant),
  désormais complétée par une action globale **"🎲 Sécuriser tous les mots
  de passe faibles"** (palette de commandes, ou bouton direct dans le
  mini-audit sécurité) : régénère en un clic tous les secrets encore à leur
  valeur d'exemple (`change_moi`, `admin`, vide...) dans tous les services
  du projet, sans toucher à ceux déjà personnalisés. Annulable.

**Réseaux Docker**
- Réseaux personnalisés isolés par service, avec option **réseau interne**
  (`internal: true`) pour couper l'accès sortant à internet d'un réseau —
  utile pour isoler une base de données. Import/export fidèle depuis un
  `docker-compose.yml` existant.

**Aide-mémoire clavier**
- La touche **`?`** (hors saisie de texte) affiche un aide-mémoire des
  raccourcis disponibles (Ctrl+K, Ctrl+S, Échap...), aussi accessible via un
  bouton dans l'en-tête ou la palette de commandes.
- **Ctrl/Cmd+K** ouvre une palette de recherche unifiée (façon éditeur de
  code) : charger n'importe quelle stack, changer d'onglet, créer un
  nouveau projet, basculer le thème, télécharger le compose ou tout effacer
  — navigable entièrement au clavier (↑↓, Entrée, Échap). Un bouton dans
  l'en-tête l'ouvre aussi à la souris pour ceux qui ne connaissent pas le
  raccourci.

**Réseaux**
- Créer des réseaux Docker personnalisés et assigner chaque service à un ou
  plusieurs réseaux. L'onglet Réseaux affiche aussi un récapitulatif de la
  répartition des services par réseau.

**Stacks & import**
- **82 stacks prêtes à l'emploi**, filtrables par catégorie (Web & CMS,
  Données & dev, Réseau & sécurité, Monitoring & maintenance,
  Auto-hébergement perso, Communication & outils) en plus de la recherche
  texte libre :
  - *Web/CMS* : LAMP, LEMP, WordPress, Ghost, Strapi, Directus.
  - *Données/dev* : Node+Mongo, Metabase, Gitea (2 variantes), GitLab,
    SonarQube, pgAdmin, Redmine, Jupyter, PocketBase, Neo4j, Kafka+Zookeeper,
    Jenkins, RabbitMQ, Baserow, NocoDB, MinIO, Code Server.
  - *Réseau/reverse proxy* : Traefik + démo whoami, **Traefik + Authelia**
    (2FA devant vos services), Tailscale (VPN mesh), **AdGuard Home**
    (blocage pub/traqueurs au niveau DNS, alternative à Pi-hole).
  - *Monitoring/logs* : Monitoring léger, Observabilité complète, ELK,
    Journalisation (Loki + Promtail + Grafana), Uptime Kuma, Matomo,
    Umami, changedetection.io, **Watchtower** (mise à jour auto des images).
  - *Auto-hébergement perso* : Nextcloud, Pi-hole, Home Assistant, Jellyfin,
    Plex, Syncthing, Vaultwarden, Linkding, Firefly III, Mealie, Grocy,
    Homepage, Duplicati, Trilium Notes, Calibre-Web, FreshRSS, Excalidraw,
    **Actual Budget** (budget personnel à enveloppes).
  - *Communication/outils* : n8n, Mattermost, Wiki.js, BookStack, Mailpit,
    Meilisearch, WireGuard Easy, Keycloak, Portainer, Redis+RedisInsight,
    Miniflux, Shlink, **Vikunja** (gestion de tâches/projets).
- Import d'un `docker-compose.yml` existant pour l'éditer visuellement,
  réseaux et profils de chaque service compris.

**Sécurité**
- Extraction des mots de passe/secrets vers des fichiers `.env` séparés, avec
  `.gitignore` généré automatiquement dans l'export.
- Détection des secrets personnalisable par projet (liste noire : toujours
  traiter comme secret ; liste blanche : ne jamais traiter comme secret).
- Mini-audit sécurité repliable dans l'aperçu (ports exposés, healthchecks,
  secrets en clair, mots de passe par défaut, images sans version figée,
  conteneurs durcis). **Score chiffré sur 100 (nouveau)** affiché sous forme
  d'anneau à côté du badge Bon/À surveiller/À améliorer, pour un coup d'œil
  encore plus rapide.

**Export**
- Copier le YAML, télécharger le `docker-compose.yml` seul, ou un `.zip`
  complet (compose + `.env.*` + `.gitignore` + `LANCEMENT.md` +
  `dockerforge-run.sh`).
- Onglet alternatif avec les commandes `docker run` équivalentes (utile sans
  docker-compose), qui respecte aussi l'extraction des secrets.
- Aperçu du YAML avec coloration syntaxique légère (clés, chaînes, nombres,
  commentaires).

**Aide intégrée**
- Guide d'utilisation de l'outil et guide d'installation de Docker,
  accessibles depuis des boutons dans l'en-tête.
- Schéma visuel du "navire" (vue d'ensemble des conteneurs et réseaux),
  repliable.

**Confort**
- Duplication et réordonnancement des conteneurs (flèches ▲▼ ou glisser-déposer).
- Recherche dans la liste des conteneurs ajoutés (à partir de 5).
- **Annuler/Rétablir multi-niveaux (nouveau)** : `Ctrl+Z` / `Ctrl+Maj+Z`
  (ou `Ctrl+Y`) annule/rétablit l'historique complet des actions du projet
  actif (ajout, édition, duplication, réordonnancement, chargement de
  stack/modèle, réseaux, import) — jusqu'à 50 étapes. Vient compléter le
  toast "↺ Annuler" existant (suppression/tout-effacer/sécurisation), qui
  reste dédié à une seule action ponctuelle. Boutons dédiés dans l'en-tête
  et la palette de commandes, réinitialisé à chaque changement de projet.
- Annuler (↺) après suppression d'un conteneur ou "Tout effacer", pendant
  quelques secondes.
- **Modèles de service réutilisables** (★) : enregistre un conteneur configuré
  pour le réutiliser en un clic dans n'importe quel projet — partagés entre
  tous les projets, contrairement aux stacks qui sont fixes.
- Copier un service seul en JSON (indépendamment de l'export complet du projet).
- Export/import d'un projet complet en JSON (services, réseaux, réglages),
  indépendamment du `docker-compose.yml` — pratique pour sauvegarder ou
  transférer un projet tel quel.
- Validation en direct (erreurs bloquantes + avertissements), y compris la
  détection de dépendances invalides (auto-référence, service inexistant).
- Suggestion douce (non-bloquante) d'ajouter une base de données quand une
  application qui en a presque toujours besoin (WordPress, Nextcloud...) est
  seule dans le projet.
- Sauvegarde automatique dans le navigateur (localStorage), par projet.
- **Thème clair (par défaut) / sombre** basculable en un clic (bouton dans
  l'en-tête), préférence mémorisée.
- Identité visuelle claire, façon dashboard moderne (cartes blanches
  arrondies, ombres douces, police Inter) — inspirée d'interfaces comme CasaOS.

## Idées de suites possibles

_Aucune pour l'instant — toutes les pistes envisagées ont été réalisées, voir
Correctifs récents._

## Correctifs récents

- **Audit d'accessibilité des fenêtres modales** : les 3 modales qui
  n'avaient ni sémantique ARIA ni focus géré (raccourcis clavier, guide
  d'utilisation, guide d'installation) sont alignées sur le standard déjà
  utilisé par la palette de commandes (`role="dialog"`, `aria-modal`,
  focus posé à l'ouverture, `aria-label` sur les boutons ✕). Suppression
  au passage d'un fichier de composant mort (`GuideModal.jsx`, jamais
  importé) trouvé pendant l'audit. Corrections aussi côté durcissement
  des conteneurs : adresse IPv6 tronquée dans `extra_hosts` → `hostAliases`
  (Kubernetes), deux avertissements manquants (`extra_hosts` mal formé,
  `read_only` sans volume ni `tmpfs`), et une variable morte supprimée.
  **+3 tests** (117 au total).
- **Support `tmpfs`** : complète le mode lecture seule — quand `read_only`
  est activé, le formulaire propose directement d'ajouter les dossiers à
  monter en mémoire (ex: `/tmp`, `/var/cache/nginx`), pour que l'appli
  puisse encore écrire ce dont elle a besoin sans casser le durcissement.
  Traduit en `tmpfs:` dans le compose, `--tmpfs` dans le script `docker
  run`, et en volumes `emptyDir (medium: Memory)` + `volumeMounts` côté
  Kubernetes. Relu à l'import, liste ou chaîne unique.
- **Durcissement du conteneur, étendu** : exécution sous utilisateur
  non-root (`user: UID:GID`), init-process anti-zombies (`init: true`),
  délai d'arrêt propre (`stop_grace_period`) et hôtes DNS supplémentaires
  (`extra_hosts`) — vient compléter `read_only`/`cap_drop`/`cap_add`/
  `no-new-privileges`. Traduit aussi côté Kubernetes (`runAsUser`,
  `runAsGroup`, `terminationGracePeriodSeconds`, `hostAliases`) et dans le
  script `docker run` (`--user`, `--init`, `--stop-timeout`, `--add-host`).
- **Durcissement du conteneur** : nouvelle section dans « Options avancées »
  — lecture seule (`read_only`), `no-new-privileges`, `cap_drop: ALL` +
  `cap_add` personnalisé. Généré dans le YAML, le script `docker run` et le
  manifeste Kubernetes (`securityContext`), relu fidèlement à l'import.
- **Score de sécurité chiffré** : le mini-audit affiche désormais un score
  sur 100 (anneau visuel à côté du badge Bon/À surveiller/À améliorer),
  calculé à partir des mêmes constats (mots de passe faibles, secrets en
  clair, tags non figés, healthchecks manquants). Nouvelle ligne dans
  l'audit comptant les conteneurs durcis.
- **Annuler/Rétablir multi-niveaux** : `Ctrl+Z` / `Ctrl+Maj+Z` (ou `Ctrl+Y`)
  annule/rétablit jusqu'à 50 actions du projet actif (édition, duplication,
  réordonnancement, chargement de stack/modèle, réseaux, import) —
  complète le toast d'annulation ponctuelle existant. Boutons dans
  l'en-tête (avec compteur) et entrées dans la palette de commandes ;
  réinitialisé à chaque changement de projet.
- **Rotation des logs par service** : nouvelle option dans « Options
  avancées » (taille max par fichier + nombre de fichiers conservés,
  driver `json-file`) — génère `logging:` dans le `docker-compose.yml` et
  `--log-driver`/`--log-opt` dans le script `docker run` équivalent.
  Repris à l'import d'un compose existant, comme les autres réglages.
- **Vague 9 de stacks** (79 → 82) : AdGuard Home (DNS anti-pub, alternative
  à Pi-hole), Vikunja (gestion de tâches), Actual Budget (budget
  personnel). Les 3 images correspondantes rejoignent aussi le catalogue
  (catégories Sécurité & annuaire, Productivité & documentation,
  Auto-hébergement).
- **Export SVG du schéma** : ajouté (et corrigé en cours de route — la
  première version avait la fonction `exporterSvg()` et la `ref` définies
  mais jamais reliées au bouton/au `<svg>`, donc inutilisables ; c'est
  réparé). Bouton "⬇ Exporter le schéma en .svg" au-dessus du schéma des
  conteneurs, produit un fichier autonome avec les couleurs du thème actif
  figées en dur.
- **Export Kubernetes** : ajouté — 3e onglet dans l'Aperçu (☸ Kubernetes),
  génère un `Deployment` + `Service` par conteneur (et un `Secret` si
  "Extraire les secrets" est actif), inclus dans le zip complet. Point de
  départ pour un cluster, pas un export production-ready (pas de PVC ni
  d'Ingress). `estValeurFaible` réutilisé aussi dans `auditSecurite` pour
  détecter plus de mots de passe faibles qu'un simple `=== 'change_moi'`.
- **Filtre par catégorie des stacks** : ajouté — avec 79 stacks, la liste
  devenait longue à parcourir. Chips de filtre (Web & CMS, Données & dev,
  Réseau & sécurité, Monitoring & maintenance, Auto-hébergement perso,
  Communication & outils) combinables avec la recherche texte, au-dessus
  de la liste de stacks. Test garde-fou : chaque stack doit avoir une
  catégorie explicitement assignée (pas de repli silencieux).
- **Sécurisation globale des secrets** : ajouté — action "🎲 Sécuriser tous
  les mots de passe faibles" (palette de commandes + bouton direct dans le
  mini-audit) qui régénère en un clic toutes les valeurs de secret encore
  à `change_moi`/`admin`/vide dans tout le projet, sans écraser celles déjà
  personnalisées. Annulable comme les autres actions groupées.
- **Centrage du hero** : corrigé — `.colonne` (colonnes de la grille
  Services/Aperçu) n'avait pas `min-width: 0`, ce qui laissait le contenu
  large de l'aperçu YAML forcer un débordement horizontal de toute la page
  et décaler visuellement le hero vers la gauche sur grand écran. Ajout
  d'un filet de sécurité (`overflow-x: hidden` sur `html, body`) et d'un
  double centrage du hero via flexbox en plus du `margin: 0 auto` existant.
- **Réseaux internes** : ajouté — case "Réseau interne (pas d'accès sortant
  à internet)" dans le gestionnaire de réseaux, génère `internal: true`
  dans le `docker-compose.yml` et `--internal` dans `dockerforge-run.sh`.
  Bascule possible après création, import fidèle depuis un compose existant.
- **Aide-mémoire clavier** : ajouté — touche `?` (hors saisie de texte)
  ouvre une modale listant les raccourcis disponibles.
- **Vague 8 de stacks** (73 → 79) : Watchtower, Traefik + Authelia (2FA),
  MinIO, Code Server, FreshRSS, Excalidraw.
- **Labels Traefik automatiques** : nouvelle option "Exposer via Traefik"
  dans les options avancées de chaque service (domaine + port interne
  optionnel) — génère les labels `traefik.enable`, routeur (règle `Host`),
  entrypoint HTTPS et certresolver Let's Encrypt, aussi bien dans le YAML
  que dans le script `docker run` équivalent (`-l`). Un avertissement
  apparaît si l'option est activée sans domaine renseigné.
- **Palette de commandes (Ctrl/Cmd+K)** : recherche unifiée façon éditeur de
  code pour charger une stack, changer d'onglet, créer un projet, basculer
  le thème, télécharger le compose ou tout effacer — navigable au clavier.
- **Vague 7 de stacks** (65 → 73) : Traefik + whoami (démo du nouveau champ
  reverse proxy), Baserow, NocoDB, Duplicati, Trilium Notes, Calibre-Web,
  Journalisation (Loki + Promtail + Grafana), Tailscale.
- **Id de stack dupliqué** : corrigé — deux stacks "Gitea" partageaient le
  même identifiant interne (`gitea`), ce qui pouvait perturber leur
  affichage ; la variante avec port SSH exposé porte maintenant l'id
  `gitea-ssh`. Un test garde-fou empêche qu'un futur doublon d'id, un
  service sans nom/image, ou une dépendance orpheline dans une stack ne
  passe inaperçu.
- **Micro-interactions** : légères animations au survol des cartes de
  stacks/modèles et des boutons, style `focus-visible` cohérent sur tous
  les éléments interactifs pour la navigation au clavier.
- **Vague 6 de stacks** : GitLab, Jupyter, PocketBase, Plex, Neo4j,
  Kafka+Zookeeper, Jenkins, RabbitMQ — 8 stacks de plus (42 → 50).
- **Recherche pour les stacks** : un champ de recherche est apparu
  au-dessus de la liste des stacks (nom, description, ou image cherchée),
  pour les retrouver facilement maintenant qu'elles sont nombreuses.
- **Hero toujours décalé à gauche malgré le premier correctif** : centrage
  renforcé. En plus du `margin: 0 auto` sur `.hero-contenu`, `.hero` centre
  maintenant aussi son contenu via flexbox (`display: flex; justify-content:
  center`) — une double sécurité qui élimine le risque de dépendre d'un seul
  mécanisme de centrage CSS.
- **Aide pour les clés applicatives (`APP_KEY` et similaires)** : une bulle
  d'aide ⓘ apparaît maintenant à côté de ces variables pour expliquer qu'il
  ne s'agit pas d'un simple mot de passe (souvent une clé encodée en base64,
  avec un format précis attendu par l'appli — voir la doc Docker Hub de
  l'image). Le générateur 🎲 produit aussi des valeurs plus longues (32
  caractères) pour ce genre de champ.
- **Port toujours identique en cliquant plusieurs images du catalogue** :
  corrigé. Cliquer sur une image du catalogue ne mettait à jour le port que
  si les champs port étaient encore vides — en cliquant sur une deuxième
  image pour comparer/changer d'avis, le port restait bloqué sur celui de la
  première. Le port se met maintenant à jour à chaque clic sur le catalogue,
  tant que tu ne l'as pas modifié toi-même à la main (dans ce cas, ton choix
  manuel est respecté et n'est plus écrasé).
- **Débordement horizontal / hero décalé à gauche** : corrigé. Les colonnes
  de la grille (`.colonne`) n'avaient pas `min-width: 0`, ce qui est un piège
  classique de CSS Grid — le contenu large de l'aperçu YAML (lignes non
  retournées à la ligne) forçait toute la page à s'élargir au-delà de l'écran,
  décalant visuellement l'en-tête vers la gauche. `overflow-x: hidden` ajouté
  en sécurité sur `body` en complément.

## Notes techniques

- Tout est calculé côté client (aucun backend) : le site est 100% statique.
- `crypto.randomUUID()` est utilisé pour les identifiants — nécessite un
  navigateur récent et un contexte sécurisé (`localhost` ou HTTPS).
- Dépendances à installer via `npm install` : `jszip` (export .zip), `js-yaml`
  (import), `simple-icons` (logo Docker dans l'en-tête).
