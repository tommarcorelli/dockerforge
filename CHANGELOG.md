# Journal des modifications — DockerForge

Résumé de tout ce qui a été ajouté/corrigé, dans l'ordre.

## Fonctionnalités de base
- Formulaire d'ajout de service (nom, image, ports, volumes, variables d'env)
- Catalogue d'images cliquables par catégorie, avec pré-remplissage (nom, port, env)
- Résolution automatique des conflits de ports
- Aperçu du `docker-compose.yml` en direct, copie et téléchargement
- Validation en direct (erreurs + avertissements)

## Stacks prêtes à l'emploi (montée progressive : 4 → 16 → 23 → 33 → 42 → 50)
- Vague 1 : LAMP, WordPress, Monitoring, Node+Mongo
- Vague 2 : LEMP, Observabilité complète, ELK, n8n, Ghost, Metabase, Gitea, Matomo, Mailpit (+ d'autres)
- Vague 3 : Pi-hole, Uptime Kuma, Home Assistant, Jellyfin, Directus, Redis+RedisInsight, Portainer
- Vague 4 : Mattermost, Wiki.js, Vaultwarden, Syncthing, Meilisearch, Umami, WireGuard Easy, SonarQube, pgAdmin, Linkding
- Vague 5 : Firefly III, Mealie, BookStack, Redmine, Miniflux, Shlink, Grocy, Homepage, changedetection.io
- Vague 6 (dernière) : GitLab, Jupyter, PocketBase, Plex, Neo4j, Kafka+Zookeeper, Jenkins, RabbitMQ

## Fonctions ajoutées après la base
- Options avancées par service : politique de redémarrage, dépendances (`depends_on`)
- Vérification de santé (`healthcheck`) et limites de ressources (`mem_limit`, `cpus`)
- Réseaux Docker personnalisés (créer un réseau, assigner des services)
- Extraction des secrets vers des fichiers `.env` séparés (option à cocher)
- Import d'un `docker-compose.yml` existant pour l'éditer visuellement
- Export en `.zip` complet (compose + `.env` + `.gitignore` + notes de lancement)
- Sauvegarde automatique dans le navigateur (localStorage)
- Gestionnaire multi-projets (onglets "Mon premier projet", renommer, dupliquer)
- Schéma visuel des conteneurs (vue d'ensemble façon navire)
- Guides intégrés (installation Docker, mode d'emploi de l'outil)

## Correctifs récents

- **Rotation des logs par service** : ajouté — nouvelle option « Rotation
  des logs » dans les options avancées (`logMaxSize`/`logMaxFile`), génère
  un bloc `logging: { driver: json-file, options: { max-size, max-file } }`
  dans le `docker-compose.yml`, les `--log-driver`/`--log-opt` équivalents
  dans le script `docker run`, et relu à l'import d'un compose existant
  (`def.logging.options`). Par défaut vide (aucun changement de
  comportement pour les projets existants).
- **Vague 9 de stacks** (79 → 82) : AdGuard Home, Vikunja, Actual Budget —
  ajoutées à la fois comme stacks 1-clic et comme images du catalogue
  (`adguard-home` → catégorie réseau, `vikunja` → outils, `actual-budget`
  → perso dans `CATEGORIE_PAR_STACK`).
- **Export SVG du schéma** : ajouté, avec un bug de câblage corrigé au
  passage (la `ref` et la fonction `exporterSvg()` avaient été écrites
  mais jamais reliées au `<svg>`/au bouton dans un tour précédent — code
  mort, sans impact visible mais inutilisable). Vérifié : plus aucune
  fonction/ref ajoutée cette session n'est orpheline (grep de contrôle).
- **Export Kubernetes** : ajouté — 3e onglet dans l'Aperçu (☸ Kubernetes),
  `buildKubernetesManifests()` génère un `Deployment` + `Service` par
  conteneur (et un `Secret` si "Extraire les secrets" est actif), inclus
  dans le zip complet (`k8s.yaml`). Point de départ, pas un export
  production-ready. `auditSecurite` utilise maintenant `estValeurFaible`
  au lieu d'une simple égalité à `'change_moi'`.
- **Filtre par catégorie des stacks** : ajouté — chips (Web & CMS, Données
  & dev, Réseau & sécurité, Monitoring & maintenance, Auto-hébergement
  perso, Communication & outils) combinables avec la recherche, sur les 79
  stacks. `CATEGORIE_PAR_STACK` exporté depuis `stacks.js`, test garde-fou
  de couverture complète.
- **Sécurisation globale des secrets** : ajouté — "🎲 Sécuriser tous les
  mots de passe faibles" (palette de commandes + bouton dans le mini-audit)
  régénère en un clic les secrets encore à `change_moi`/`admin`/vide dans
  tout le projet, sans écraser ceux déjà personnalisés. Annulable.
  `genererMotDePasse` mutualisé dans `generateur.js` (plus de duplication
  entre `ServiceForm.jsx` et l'action globale).
- **Bug de centrage du hero corrigé** : la vraie cause était `.colonne`
  (grille Services/Aperçu) sans `min-width: 0` — le contenu large de
  l'aperçu YAML forçait un débordement horizontal de toute la page.
  Ajout de `overflow-x: hidden` sur `html, body` et d'un double centrage
  du hero via flexbox en plus du `margin: 0 auto` existant.
- **Réseaux internes** : option "Réseau interne" par réseau Docker
  (`internal: true` / `--internal`), bascule possible après création,
  parsing fidèle à l'import.
- **Aide-mémoire clavier** (`?`) : nouvelle modale listant les raccourcis.
- **Vague 8 de stacks** (73 → 79) : Watchtower, Traefik + Authelia (2FA),
  MinIO, Code Server, FreshRSS, Excalidraw.
- **Labels Traefik automatiques** : ajouté — option "Exposer via Traefik"
  par service (domaine + port interne optionnel), génère les labels
  (`traefik.enable`, routeur, entrypoint HTTPS, certresolver Let's Encrypt)
  dans le `docker-compose.yml` et dans `dockerforge-run.sh` (`-l`).
  Avertissement de validation si activé sans domaine. Nouvelle stack
  "Traefik (reverse proxy)" (Traefik + whoami) qui démontre la
  fonctionnalité prête à charger.
- **Palette de commandes (Ctrl/Cmd+K)** : ajoutée — nouveau composant
  `CommandPalette.jsx`, recherche unifiée parmi les 73 stacks et les
  actions rapides de l'appli (navigation d'onglet, nouveau projet, thème,
  téléchargement, tout effacer), entièrement navigable au clavier.
- **Vague 7 de stacks** (65 → 73) : Traefik + whoami, Baserow, NocoDB,
  Duplicati, Trilium Notes, Calibre-Web, Journalisation (Loki + Promtail +
  Grafana), Tailscale.
- **Id de stack "gitea" dupliqué** : corrigé (renommé en `gitea-ssh` pour la
  variante avec port SSH). Ajout de tests garde-fou sur l'intégrité du
  catalogue de stacks (id unique, service avec nom/image, `dependsOn`
  valide) pour éviter une régression similaire.
- **Micro-animations & accessibilité clavier** : légères transitions au
  survol des cartes, style `focus-visible` unifié sur tous les éléments
  interactifs.
- **Édition en place d'un service** : ajoutée (bouton ✎ dans la liste). En
  corrigeant les effets de bord : le service en cours d'édition ne pouvait
  plus se sélectionner lui-même comme dépendance ni se voir imposer un faux
  conflit de port sur son propre port ; renommer un service propage
  maintenant le nouveau nom dans les `depends_on` des autres services.
- **Healthcheck jamais rempli** : corrigé — 7 images du catalogue (MySQL,
  PostgreSQL, MariaDB, MongoDB, Redis, RabbitMQ, Elasticsearch) proposent
  désormais une commande de healthcheck fiable, reprise aussi par les stacks.
- **Import docker-compose.yml perdait réseaux et profils** : corrigé — les
  sections `networks:`/`profiles:` de chaque service et les réseaux définis
  en haut du fichier sont maintenant reconstruits à l'import.
- **Recherche dans la liste des conteneurs** : ajoutée, à partir de 5 conteneurs.
- **Annuler (undo) après suppression** : ajouté pour la suppression d'un
  conteneur et pour "Tout effacer" (remplace l'ancien `confirm()` bloquant).
  Corrigé au passage : un conteneur ajouté entre le "Tout effacer" et le
  clic sur "Annuler" ne disparaît plus.
- **Export/import JSON complet d'un projet** : ajouté (bouton dans la barre de
  gestion des projets), pour sauvegarder/transférer un projet indépendamment
  du `docker-compose.yml`.
- **Nettoyage de la racine du dépôt** : suppression de résidus de build qui
  traînaient en double avec `public/` (`assets/`, `icons/`, `manifest.webmanifest`,
  `sw.js`) et du `yarn.lock` superflu (le projet utilise `npm`). Suppression
  aussi de `GuideModal.jsx`, un composant devenu mort après son remplacement
  par `GuideUtilisationModal.jsx`/`GuideInstallationModal.jsx`.
- **Coloration syntaxique de l'aperçu YAML** : ajoutée (clés, chaînes,
  nombres, booléens, commentaires), sans dépendance externe.
- **Incohérence de détection des secrets** : corrigée — `APP_KEY`/`SSH_KEY`
  déclenchaient le générateur de mot de passe 🎲 dans le formulaire sans être
  reconnus par le générateur de YAML (donc jamais extraits dans un `.env`
  malgré "Extraire les secrets" activé). Détection unifiée sur une seule
  fonction, désormais personnalisable par projet (liste blanche/noire).
- **Export en commandes `docker run`** : ajouté (onglet dans l'aperçu), avec
  gestion de l'ordre de démarrage en commentaire, des réseaux multiples via
  `docker network connect`, et de l'extraction des secrets vers `--env-file`.
- **Vrai glisser-déposer** pour réordonner les conteneurs (poignée ⠿),
  en complément des flèches ▲▼ existantes.
- **Services générés par une stack sans `networks`/`profiles`** : corrigé
  (incohérence de forme avec les services créés à la main — sans effet
  visible actuellement grâce aux protections existantes ailleurs, mais
  corrigé par précaution).
- **Schéma du navire faussé pour un service sur plusieurs réseaux** : corrigé
  — un conteneur assigné à 2+ réseaux apparaissait dans chaque groupe
  correspondant, ce qui écrasait sa position et faussait la taille des
  groupes affichés. Il n'apparaît maintenant qu'une seule fois (dans le
  premier réseau auquel il est assigné).
- **Avertissement sur les images sans version figée** : ajouté — un tag
  `:latest` (explicite ou implicite) déclenche un avertissement pour
  encourager à figer une version précise avant de déployer.
- **Raccourcis clavier** : `Ctrl+S`/`Cmd+S` télécharge directement le
  `docker-compose.yml` depuis n'importe quel onglet ; `Échap` annule
  l'édition d'un service en cours ou ferme un guide ouvert.
- **Copier un service seul en JSON** : bouton 📋 sur chaque conteneur, pour
  le recoller ailleurs (autre projet, note...) sans passer par l'export
  complet du projet.
- **Modèles de service réutilisables** : bouton ★ sur chaque conteneur pour
  l'enregistrer comme modèle personnel (nommé), réutilisable en un clic dans
  n'importe quel projet (section "Mes modèles", partagée entre tous les
  projets — contrairement aux stacks qui sont fixes).
- **Suggestion de service manquant probable** : un bloc "💡 Suggestions"
  (distinct des avertissements, volontairement moins insistant) propose
  d'ajouter une base de données quand WordPress, Ghost, Gitea, Nextcloud,
  Matomo, Redmine, BookStack ou Keycloak sont présents sans base de données
  correspondante détectée dans le projet.
- **Mini-audit sécurité** : panneau repliable dans l'aperçu (🛡), résumant
  ports exposés, services sans healthcheck, secrets en clair, mots de passe
  encore à "change_moi" et images sans version figée, avec un niveau global
  (bon / à surveiller / à améliorer).
- **Conflit entre l'Échap global et les champs de saisie en ligne** : corrigé
  — annuler le nommage d'un modèle ou un renommage de projet via Échap
  annulait aussi, en silence, l'édition d'un service en cours ailleurs sur la
  page (l'événement remontait jusqu'au raccourci clavier global). Corrigé
  avec `stopPropagation()`, plus une protection contre la course entre Échap
  et le `blur` du champ (qui pouvait revalider avec l'ancienne saisie).
- **5 nouveaux services/stacks orientés réseau & sécurité** (BTS SIO SISR) :
  - Catalogue : Registre Docker privé (`registry:2`), CrowdSec.
  - Nouvelle catégorie "Sécurité & annuaire" : OpenLDAP, phpLDAPadmin, Zabbix
    (serveur + interface web), GLPI.
  - Nouvelles stacks prêtes à charger : **Annuaire LDAP** (OpenLDAP +
    phpLDAPadmin), **Supervision (Zabbix)** (serveur + web + PostgreSQL, choisi
    plutôt que MySQL pour éviter les réglages de collation que l'outil ne
    permet pas de configurer), **GLPI** (+ MariaDB — la BDD se relie via
    l'assistant d'installation web de GLPI, pas d'auto-configuration par
    variables d'env pour cette image).
- **Port bloqué en cliquant plusieurs images du catalogue** : corrigé — le port
  se met à jour à chaque clic tant qu'il n'a pas été modifié à la main.
- **Bulle d'aide pour les clés type `APP_KEY`** : ajoutée — explique que ce
  n'est pas un simple mot de passe (format souvent précis, ex: base64).
- **Recherche parmi les stacks** : ajoutée, vu leur nombre croissant.
- **Centrage du hero** : renforcé (flexbox en plus du `margin: auto`).

## Déploiement
- Workflow GitHub Actions (`.github/workflows/deploy.yml`) : republie
  automatiquement sur GitHub Pages à chaque `push` sur `main`.

## Qualité du code — robustesse & couverture de tests
- **Import fidèle du réglage Traefik** : l'import d'un `docker-compose.yml`
  relit désormais les labels `traefik.*` (domaine + port) et restaure le
  réglage dans le formulaire — auparavant, réimporter un compose généré par
  DockerForge faisait disparaître silencieusement ce réglage.
- **Sauvegarde locale résiliente** : `sauvegarderProjets`, `sauvegarderModeles`
  et l'écriture du thème sont protégées par un `try/catch` — un `localStorage`
  plein ou indisponible (quota dépassé, navigation privée) ne fait plus
  planter toute l'application via l'ErrorBoundary (qui proposait, dans ce cas,
  de tout effacer alors que rien n'était corrompu) ; l'erreur est journalisée
  et l'app continue de fonctionner en mémoire pour la session en cours.
- **Port hôte non numérique non détecté (bug NaN)** : corrigé — la validation
  comparait `Number(port.host) < 1 || > 65535`, or une comparaison avec `NaN`
  est toujours fausse ; un port saisi/importé comme `"abc"` passait donc la
  validation et finissait tel quel dans le `docker-compose.yml` généré
  (`"abc:80"`, invalide au démarrage). La validation exige maintenant
  explicitement un entier dans la plage 1–65535.
- **Confusion entre images au préfixe commun** (ex: `redis` vs
  `redis/redisinsight`, ou `mysql` vs un hypothétique `mysqld-exporter`) :
  corrigée — la détection d'icône/teinte/healthcheck suggéré utilisait un
  simple `startsWith`, qui faisait hériter à `redis/redisinsight` (dans la
  stack "Redis + RedisInsight") le healthcheck `redis-cli ping` de Redis,
  sans aucun sens sur cette image. La comparaison exige désormais une
  égalité stricte ou un préfixe suivi de `:` (début du tag) — jamais un `/`,
  qui indique un espace de noms Docker Hub différent, pas une variante.
- **+36 tests** (53 → 89, toujours sans framework externe) couvrant :
  - `importateur.js` (jusqu'ici non testé) : YAML invalide, service sans
    image, formats de ports/env/depends_on/healthcheck, réseaux internes,
    et le nouveau round-trip Traefik.
  - `surlignageYaml.js` (jusqu'ici non testé) : coloration clé/valeur,
    commentaires, tirets, nombres/booléens.
  - `modeles.js` et `projets.js` (jusqu'ici non testés) : cycle complet
    ajout/chargement/suppression/instanciation de modèle, migration de
    l'ancien format de stockage, export/import de projet, et robustesse face
    à un stockage corrompu.
  - Port hôte invalide (NaN), unités de mémoire de `calculerCharge`, faux
    positifs de correspondance d'image, et un test d'intégrité qui construit
    chacune des 82 stacks du catalogue puis vérifie qu'elle passe la
    validation sans aucune erreur (garde-fou contre une future stack cassée).
- **Corruption "NaN" d'un port non numérique, bug élargi et corrigé à la
  source** : le même piège (`Number("abc")` vaut `NaN`, et `NaN !== NaN` est
  toujours vrai en JS) touchait en fait 3 endroits qui dupliquaient chacun
  leur propre logique de "port libre" : import d'un `docker-compose.yml`,
  duplication d'un service, instanciation d'un modèle, plus la correction de
  conflit au blur du champ port dans le formulaire. Cas concret le plus
  parlant : importer un compose utilisant une **plage de ports**
  (`"3000-3005:3000-3005"`, syntaxe Compose valide mais non gérée par
  DockerForge) remplaçait silencieusement la plage par la chaîne littérale
  `"NaN"`. `trouverPortLibre` (catalogue.js) renvoie désormais la valeur
  d'origine inchangée quand elle n'est pas un port numérique valide ; les 3
  endroits concernés (`App.jsx`, `modeles.js`, `stacks.js`) partagent
  maintenant cette même fonction au lieu de réimplémenter chacun leur
  propre boucle (moins de code dupliqué, un seul endroit à corriger/tester).
- **Copier dans le presse-papier plus robuste, et factorisé** :
  `navigator.clipboard` peut être absent (contexte non-HTTPS) ou son appel
  rejeté (permission refusée, document non focus...). Ce cas n'était pas
  géré à deux endroits distincts (aperçu du compose dans `Preview.jsx`,
  copie JSON d'un service dans `ServiceList.jsx`) — plutôt que dupliquer le
  correctif, la logique de copie-avec-repli (`document.execCommand('copy')`
  si l'API moderne échoue) est désormais centralisée dans un nouvel
  utilitaire `src/core/clipboard.js` (`copierTexte`), réutilisé par les deux
  composants et testé indépendamment (4 tests dédiés).
- **+6 tests** pour la corruption "NaN" élargie et `clipboard.js` (95 au total).
- **Filtre par catégorie des stacks dérivé, plus dupliqué à la main** :
  `StackPresets.jsx` recopiait manuellement la liste des catégories
  (`['web', 'dev', 'reseau', ...]`), déjà définie dans `CATEGORIE_LABELS`
  (stacks.js) — un risque de désynchronisation si une nouvelle catégorie est
  ajoutée un jour côté données sans mettre à jour le composant (le chip de
  filtre correspondant n'apparaîtrait alors jamais). L'ordre est maintenant
  dérivé directement de `Object.keys(CATEGORIE_LABELS)`, une seule source de
  vérité. Un test d'intégrité vérifie en plus que chaque catégorie assignée
  à une stack correspond bien à une entrée connue de `CATEGORIE_LABELS`.
- **+1 test** pour cette cohérence catégories/libellés (96 au total).
- **Échec silencieux à l'import d'un fichier** : les deux imports par
  fichier (`docker-compose.yml` et projet `.json`) construisaient un
  `FileReader` sans jamais définir `onerror` — si la lecture échouait
  (fichier déplacé/supprimé entre la sélection et la lecture, accès
  refusé...), `onload` ne se déclenchait tout simplement jamais : l'import
  échouait en silence, sans le moindre message pour la personne qui vient de
  cliquer sur "Importer". Un gestionnaire `onerror` a été ajouté aux deux,
  réutilisant la même zone d'erreurs déjà affichée pour les autres échecs
  d'import.


