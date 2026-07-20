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
