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
- **Port bloqué en cliquant plusieurs images du catalogue** : corrigé — le port
  se met à jour à chaque clic tant qu'il n'a pas été modifié à la main.
- **Bulle d'aide pour les clés type `APP_KEY`** : ajoutée — explique que ce
  n'est pas un simple mot de passe (format souvent précis, ex: base64).
- **Recherche parmi les stacks** : ajoutée, vu leur nombre croissant.
- **Centrage du hero** : renforcé (flexbox en plus du `margin: auto`).

## Déploiement
- Workflow GitHub Actions (`.github/workflows/deploy.yml`) : republie
  automatiquement sur GitHub Pages à chaque `push` sur `main`.
