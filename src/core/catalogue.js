// catalogue.js — images Docker populaires prêtes à cliquer, groupées par catégorie
// Chaque image porte un vrai logo vectoriel (simple-icons) + une teinte de
// catégorie (embout coloré des conteneurs visuels) + des variables d'env usuelles

import {
  siNginx, siApache, siCaddy, siTraefikproxy, siNginxproxymanager,
  siMysql, siPostgresql, siMongodb, siRedis, siMariadb, siInfluxdb, siNeo4j, siSqlite, siCockroachlabs,
  siNodedotjs, siPython, siPhp, siDjango, siFlask, siLaravel, siSymfony, siRubyonrails, siGo, siRust, siDotnet, siOpenjdk, siSpring,
  siGrafana, siPrometheus, siPortainer, siKibana, siUptimekuma, siNetdata,
  siRabbitmq, siElasticsearch, siApachekafka,
  siWordpress, siAdminer, siPhpmyadmin, siMinio, siKeycloak, siJenkins, siNextcloud, siVaultwarden, siGitlab, siSonarqube, siJupyter,
  siPihole, siPocketbase, siStrapi, siDirectus, siN8n, siHomeassistant, siPlex, siJellyfin,
  siRocketdotchat, siDiscourse, siMattermost, siGhost,
  siAuthelia, siVault, siTailscale, siWireguard,
  siOwncloud, siDuplicati, siRclone, siSyncthing,
  siTrilium, siOutline, siWikidotjs, siBookstack,
  siImmich, siPaperlessngx, siCalibreweb,
  siBaserow, siMetabase, siUmami, siMatomo,
  siPrestashop, siOdoo,
  siGitea, siHomepage, siGrocy,
  siOllama,
  siAdguard, siActualbudget,
} from 'simple-icons'

export const CATALOGUE = [
  {
    categorie: 'Serveurs web',
    teinte: 'cyan',
    images: [
      { nom: 'Nginx', image: 'nginx:latest', portDefaut: 80, suggestionNom: 'web', envDefaut: [], icone: siNginx },
      { nom: 'Apache (httpd)', image: 'httpd:latest', portDefaut: 80, suggestionNom: 'web', envDefaut: [], icone: siApache },
      { nom: 'Caddy', image: 'caddy:latest', portDefaut: 80, suggestionNom: 'web', envDefaut: [], icone: siCaddy },
      { nom: 'Traefik', image: 'traefik:latest', portDefaut: 8080, suggestionNom: 'traefik', envDefaut: [], icone: siTraefikproxy },
      { nom: 'Nginx Proxy Manager', image: 'jc21/nginx-proxy-manager:latest', portDefaut: 81, suggestionNom: 'npm', envDefaut: [], icone: siNginxproxymanager },
    ],
  },
  {
    categorie: 'Bases de données',
    teinte: 'orange',
    images: [
      { nom: 'MySQL', image: 'mysql:8', portDefaut: 3306, suggestionNom: 'db', icone: siMysql, envDefaut: [
        { key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' },
        { key: 'MYSQL_DATABASE', value: 'app' },
      ], healthcheck: 'mysqladmin ping -h 127.0.0.1 --silent' },
      { nom: 'PostgreSQL', image: 'postgres:16', portDefaut: 5432, suggestionNom: 'db', icone: siPostgresql, envDefaut: [
        { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
        { key: 'POSTGRES_DB', value: 'app' },
      ], healthcheck: 'pg_isready -U postgres' },
      { nom: 'MongoDB', image: 'mongo:latest', portDefaut: 27017, suggestionNom: 'mongo', icone: siMongodb, envDefaut: [
        { key: 'MONGO_INITDB_ROOT_USERNAME', value: 'root' },
        { key: 'MONGO_INITDB_ROOT_PASSWORD', value: 'change_moi' },
      ], healthcheck: 'mongosh --quiet --eval "db.adminCommand({ ping: 1 })"' },
      { nom: 'Redis', image: 'redis:latest', portDefaut: 6379, suggestionNom: 'redis', envDefaut: [], icone: siRedis, healthcheck: 'redis-cli ping' },
      { nom: 'MariaDB', image: 'mariadb:latest', portDefaut: 3306, suggestionNom: 'db', icone: siMariadb, envDefaut: [
        { key: 'MARIADB_ROOT_PASSWORD', value: 'change_moi' },
        { key: 'MARIADB_DATABASE', value: 'app' },
      ], healthcheck: 'mysqladmin ping -h 127.0.0.1 --silent' },
      { nom: 'InfluxDB', image: 'influxdb:latest', portDefaut: 8086, suggestionNom: 'influxdb', envDefaut: [], icone: siInfluxdb },
      { nom: 'Neo4j', image: 'neo4j:latest', portDefaut: 7474, suggestionNom: 'neo4j', icone: siNeo4j, envDefaut: [
        { key: 'NEO4J_AUTH', value: 'neo4j/change_moi' },
      ] },
      { nom: 'CockroachDB', image: 'cockroachdb/cockroach:latest', portDefaut: 26257, suggestionNom: 'cockroach', envDefaut: [], icone: siCockroachlabs },
    ],
  },
  {
    categorie: 'Langages & frameworks',
    teinte: 'jaune',
    images: [
      { nom: 'Node.js', image: 'node:22-alpine', portDefaut: 3000, suggestionNom: 'app', envDefaut: [], icone: siNodedotjs },
      { nom: 'Python', image: 'python:3.12-slim', portDefaut: 8000, suggestionNom: 'app', envDefaut: [], icone: siPython },
      { nom: 'PHP + Apache', image: 'php:8.3-apache', portDefaut: 80, suggestionNom: 'app', envDefaut: [], icone: siPhp },
      { nom: 'Django', image: 'django:latest', portDefaut: 8000, suggestionNom: 'app', envDefaut: [], icone: siDjango },
      { nom: 'Flask (Python)', image: 'python:3.12-slim', portDefaut: 5000, suggestionNom: 'app', envDefaut: [], icone: siFlask },
      { nom: 'Laravel (PHP)', image: 'php:8.3-fpm', portDefaut: 8000, suggestionNom: 'app', envDefaut: [], icone: siLaravel },
      { nom: 'Symfony (PHP)', image: 'php:8.3-fpm', portDefaut: 8000, suggestionNom: 'app', envDefaut: [], icone: siSymfony },
      { nom: 'Ruby on Rails', image: 'ruby:3.3', portDefaut: 3000, suggestionNom: 'app', envDefaut: [], icone: siRubyonrails },
      { nom: 'Go', image: 'golang:1.23-alpine', portDefaut: 8080, suggestionNom: 'app', envDefaut: [], icone: siGo },
      { nom: 'Rust', image: 'rust:1.80-slim', portDefaut: 8080, suggestionNom: 'app', envDefaut: [], icone: siRust },
      { nom: '.NET', image: 'mcr.microsoft.com/dotnet/aspnet:8.0', portDefaut: 8080, suggestionNom: 'app', envDefaut: [], icone: siDotnet },
      { nom: 'Java (OpenJDK)', image: 'openjdk:21-slim', portDefaut: 8080, suggestionNom: 'app', envDefaut: [], icone: siOpenjdk },
      { nom: 'Spring Boot', image: 'eclipse-temurin:21-jre', portDefaut: 8080, suggestionNom: 'app', envDefaut: [], icone: siSpring },
    ],
  },
  {
    categorie: 'Monitoring & observabilité',
    teinte: 'cyan',
    images: [
      { nom: 'Grafana', image: 'grafana/grafana:latest', portDefaut: 3000, suggestionNom: 'grafana', envDefaut: [], icone: siGrafana },
      { nom: 'Prometheus', image: 'prom/prometheus:latest', portDefaut: 9090, suggestionNom: 'prometheus', envDefaut: [], icone: siPrometheus },
      { nom: 'Portainer', image: 'portainer/portainer-ce:latest', portDefaut: 9000, suggestionNom: 'portainer', envDefaut: [], icone: siPortainer },
      { nom: 'Kibana', image: 'kibana:8.15.0', portDefaut: 5601, suggestionNom: 'kibana', envDefaut: [], icone: siKibana },
      { nom: 'Uptime Kuma', image: 'louislam/uptime-kuma:latest', portDefaut: 3001, suggestionNom: 'uptime-kuma', envDefaut: [], icone: siUptimekuma },
      { nom: 'Netdata', image: 'netdata/netdata:latest', portDefaut: 19999, suggestionNom: 'netdata', envDefaut: [], icone: siNetdata },
    ],
  },
  {
    categorie: 'Messagerie & files',
    teinte: 'orange',
    images: [
      { nom: 'RabbitMQ', image: 'rabbitmq:3-management', portDefaut: 15672, suggestionNom: 'rabbitmq', icone: siRabbitmq, envDefaut: [
        { key: 'RABBITMQ_DEFAULT_USER', value: 'admin' },
        { key: 'RABBITMQ_DEFAULT_PASS', value: 'change_moi' },
      ], healthcheck: 'rabbitmq-diagnostics -q ping' },
      { nom: 'Elasticsearch', image: 'elasticsearch:8.15.0', portDefaut: 9200, suggestionNom: 'elasticsearch', icone: siElasticsearch, envDefaut: [
        { key: 'discovery.type', value: 'single-node' },
      ], healthcheck: 'curl -s http://localhost:9200 >/dev/null || exit 1' },
      { nom: 'Apache Kafka', image: 'apache/kafka:latest', portDefaut: 9092, suggestionNom: 'kafka', envDefaut: [], icone: siApachekafka },
    ],
  },
  {
    categorie: 'Outils & DevOps',
    teinte: 'steel',
    images: [
      { nom: 'WordPress', image: 'wordpress:latest', portDefaut: 80, suggestionNom: 'wordpress', icone: siWordpress, envDefaut: [
        { key: 'WORDPRESS_DB_HOST', value: 'db' },
        { key: 'WORDPRESS_DB_PASSWORD', value: 'change_moi' },
      ] },
      { nom: 'Adminer', image: 'adminer:latest', portDefaut: 8080, suggestionNom: 'adminer', envDefaut: [], icone: siAdminer },
      { nom: 'phpMyAdmin', image: 'phpmyadmin:latest', portDefaut: 8080, suggestionNom: 'phpmyadmin', icone: siPhpmyadmin, envDefaut: [
        { key: 'PMA_HOST', value: 'db' },
      ] },
      { nom: 'MinIO', image: 'minio/minio:latest', portDefaut: 9000, suggestionNom: 'minio', icone: siMinio, envDefaut: [
        { key: 'MINIO_ROOT_USER', value: 'admin' },
        { key: 'MINIO_ROOT_PASSWORD', value: 'change_moi' },
      ] },
      { nom: 'Keycloak', image: 'quay.io/keycloak/keycloak:latest', portDefaut: 8080, suggestionNom: 'keycloak', icone: siKeycloak, envDefaut: [
        { key: 'KEYCLOAK_ADMIN', value: 'admin' },
        { key: 'KEYCLOAK_ADMIN_PASSWORD', value: 'change_moi' },
      ] },
      { nom: 'Jenkins', image: 'jenkins/jenkins:lts', portDefaut: 8080, suggestionNom: 'jenkins', envDefaut: [], icone: siJenkins },
      { nom: 'Nextcloud', image: 'nextcloud:latest', portDefaut: 80, suggestionNom: 'nextcloud', envDefaut: [], icone: siNextcloud },
      { nom: 'Vaultwarden', image: 'vaultwarden/server:latest', portDefaut: 80, suggestionNom: 'vaultwarden', envDefaut: [], icone: siVaultwarden },
      { nom: 'GitLab', image: 'gitlab/gitlab-ce:latest', portDefaut: 80, suggestionNom: 'gitlab', envDefaut: [], icone: siGitlab },
      { nom: 'SonarQube', image: 'sonarqube:latest', portDefaut: 9000, suggestionNom: 'sonarqube', envDefaut: [], icone: siSonarqube },
      { nom: 'Jupyter', image: 'jupyter/base-notebook:latest', portDefaut: 8888, suggestionNom: 'jupyter', envDefaut: [], icone: siJupyter },
      { nom: 'Registre Docker privé', image: 'registry:2', portDefaut: 5000, suggestionNom: 'registry', envDefaut: [] },
      { nom: 'CrowdSec', image: 'crowdsecurity/crowdsec:latest', portDefaut: 8080, suggestionNom: 'crowdsec', envDefaut: [
        { key: 'COLLECTIONS', value: 'crowdsecurity/nginx crowdsecurity/sshd' },
      ] },
      { nom: 'Gitea', image: 'gitea/gitea:latest', portDefaut: 3000, suggestionNom: 'gitea', envDefaut: [], icone: siGitea },
      { nom: 'Homepage (dashboard)', image: 'ghcr.io/gethomepage/homepage:latest', portDefaut: 3000, suggestionNom: 'homepage', envDefaut: [], icone: siHomepage },
      { nom: 'Grocy', image: 'linuxserver/grocy:latest', portDefaut: 80, suggestionNom: 'grocy', envDefaut: [], icone: siGrocy },
      { nom: 'Umami (analytics)', image: 'ghcr.io/umami-software/umami:postgresql-latest', portDefaut: 3000, suggestionNom: 'umami', envDefaut: [
        { key: 'DATABASE_URL', value: 'postgresql://umami:change_moi@db:5432/umami' },
        { key: 'APP_SECRET', value: 'change_moi' },
      ], icone: siUmami },
      { nom: 'Matomo (analytics)', image: 'matomo:latest', portDefaut: 80, suggestionNom: 'matomo', envDefaut: [
        { key: 'MATOMO_DATABASE_HOST', value: 'db' },
      ], icone: siMatomo },
    ],
  },
  {
    categorie: 'Auto-hébergement',
    teinte: 'jaune',
    images: [
      { nom: 'Pi-hole', image: 'pihole/pihole:latest', portDefaut: 80, suggestionNom: 'pihole', icone: siPihole, envDefaut: [
        { key: 'TZ', value: 'Europe/Paris' },
      ] },
      { nom: 'PocketBase', image: 'spectado/pocketbase:latest', portDefaut: 8090, suggestionNom: 'pocketbase', envDefaut: [], icone: siPocketbase },
      { nom: 'Strapi', image: 'strapi/strapi:latest', portDefaut: 1337, suggestionNom: 'strapi', envDefaut: [], icone: siStrapi },
      { nom: 'Directus', image: 'directus/directus:latest', portDefaut: 8055, suggestionNom: 'directus', envDefaut: [], icone: siDirectus },
      { nom: 'n8n', image: 'n8nio/n8n:latest', portDefaut: 5678, suggestionNom: 'n8n', envDefaut: [], icone: siN8n },
      { nom: 'Home Assistant', image: 'homeassistant/home-assistant:latest', portDefaut: 8123, suggestionNom: 'homeassistant', envDefaut: [], icone: siHomeassistant },
      { nom: 'Plex', image: 'plexinc/pms-docker:latest', portDefaut: 32400, suggestionNom: 'plex', envDefaut: [], icone: siPlex },
      { nom: 'Jellyfin', image: 'jellyfin/jellyfin:latest', portDefaut: 8096, suggestionNom: 'jellyfin', envDefaut: [], icone: siJellyfin },
      { nom: 'Mealie (recettes)', image: 'ghcr.io/mealie-recipes/mealie:latest', portDefaut: 9000, suggestionNom: 'mealie', envDefaut: [], icone: null },
      { nom: 'Shlink (raccourcisseur URL)', image: 'ghcr.io/shlinkio/shlink:latest', portDefaut: 8080, suggestionNom: 'shlink', envDefaut: [
        { key: 'DEFAULT_DOMAIN', value: 'localhost' },
      ], icone: null },
      { nom: 'Miniflux (flux RSS)', image: 'miniflux/miniflux:latest', portDefaut: 8080, suggestionNom: 'miniflux', envDefaut: [
        { key: 'DATABASE_URL', value: 'postgres://miniflux:change_moi@db/miniflux?sslmode=disable' },
        { key: 'RUN_MIGRATIONS', value: '1' },
        { key: 'ADMIN_USERNAME', value: 'admin' },
        { key: 'ADMIN_PASSWORD', value: 'change_moi' },
      ], icone: null },
      { nom: 'Linkding (marque-pages)', image: 'sissbruecker/linkding:latest', portDefaut: 9090, suggestionNom: 'linkding', envDefaut: [], icone: null },
      { nom: 'Changedetection.io', image: 'ghcr.io/dgtlmoon/changedetection.io:latest', portDefaut: 5000, suggestionNom: 'changedetection', envDefaut: [], icone: null },
      { nom: 'Actual Budget', image: 'actualbudget/actual-server:latest', portDefaut: 5006, suggestionNom: 'actual-budget', envDefaut: [], icone: siActualbudget },
    ],
  },
  {
    categorie: 'Sécurité & annuaire',
    teinte: 'cyan',
    images: [
      { nom: 'OpenLDAP', image: 'osixia/openldap:latest', portDefaut: 389, suggestionNom: 'openldap', envDefaut: [
        { key: 'LDAP_ORGANISATION', value: 'Mon Entreprise' },
        { key: 'LDAP_DOMAIN', value: 'example.local' },
        { key: 'LDAP_ADMIN_PASSWORD', value: 'change_moi' },
      ] },
      { nom: 'phpLDAPadmin', image: 'osixia/phpldapadmin:latest', portDefaut: 8081, suggestionNom: 'phpldapadmin', envDefaut: [
        { key: 'PHPLDAPADMIN_LDAP_HOSTS', value: 'openldap' },
        { key: 'PHPLDAPADMIN_HTTPS', value: 'false' },
      ] },
      { nom: 'Zabbix (serveur)', image: 'zabbix/zabbix-server-pgsql:latest', portDefaut: 10051, suggestionNom: 'zabbix-server', envDefaut: [
        { key: 'DB_SERVER_HOST', value: 'db' },
        { key: 'POSTGRES_USER', value: 'zabbix' },
        { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
        { key: 'POSTGRES_DB', value: 'zabbix' },
      ] },
      { nom: 'Zabbix (interface web)', image: 'zabbix/zabbix-web-nginx-pgsql:latest', portDefaut: 8080, suggestionNom: 'zabbix-web', envDefaut: [
        { key: 'DB_SERVER_HOST', value: 'db' },
        { key: 'POSTGRES_USER', value: 'zabbix' },
        { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
        { key: 'POSTGRES_DB', value: 'zabbix' },
        { key: 'ZBX_SERVER_HOST', value: 'zabbix-server' },
        { key: 'PHP_TZ', value: 'Europe/Paris' },
      ] },
      { nom: 'GLPI', image: 'diouxx/glpi:latest', portDefaut: 80, suggestionNom: 'glpi', envDefaut: [
        { key: 'TIMEZONE', value: 'Europe/Paris' },
      ] },
      { nom: 'Authelia', image: 'authelia/authelia:latest', portDefaut: 9091, suggestionNom: 'authelia', envDefaut: [], icone: siAuthelia },
      { nom: 'HashiCorp Vault', image: 'hashicorp/vault:latest', portDefaut: 8200, suggestionNom: 'vault', envDefaut: [
        { key: 'VAULT_DEV_ROOT_TOKEN_ID', value: 'change_moi' },
      ], icone: siVault },
      { nom: 'Tailscale', image: 'tailscale/tailscale:latest', portDefaut: 41641, suggestionNom: 'tailscale', envDefaut: [
        { key: 'TS_AUTHKEY', value: 'change_moi' },
      ], icone: siTailscale },
      { nom: 'WireGuard Easy', image: 'ghcr.io/wg-easy/wg-easy:latest', portDefaut: 51821, suggestionNom: 'wg-easy', envDefaut: [
        { key: 'PASSWORD', value: 'change_moi' },
      ], icone: siWireguard },
      { nom: 'AdGuard Home', image: 'adguard/adguardhome:latest', portDefaut: 3000, suggestionNom: 'adguard', envDefaut: [], icone: siAdguard },
    ],
  },
  {
    categorie: 'Collaboration & communication',
    teinte: 'cyan',
    images: [
      { nom: 'Rocket.Chat', image: 'rocketchat/rocket.chat:latest', portDefaut: 3000, suggestionNom: 'rocketchat', envDefaut: [
        { key: 'MONGO_URL', value: 'mongodb://mongo:27017/rocketchat' },
      ], icone: siRocketdotchat },
      { nom: 'Mattermost', image: 'mattermost/mattermost-team-edition:latest', portDefaut: 8065, suggestionNom: 'mattermost', envDefaut: [], icone: siMattermost },
      { nom: 'Discourse', image: 'bitnami/discourse:latest', portDefaut: 3000, suggestionNom: 'discourse', envDefaut: [
        { key: 'DISCOURSE_DATABASE_HOST', value: 'db' },
        { key: 'DISCOURSE_REDIS_HOST', value: 'redis' },
      ], icone: siDiscourse },
      { nom: 'Ghost (blog)', image: 'ghost:5', portDefaut: 2368, suggestionNom: 'ghost', envDefaut: [
        { key: 'database__client', value: 'mysql' },
        { key: 'database__connection__host', value: 'db' },
      ], icone: siGhost },
    ],
  },
  {
    categorie: 'Stockage & sauvegarde',
    teinte: 'steel',
    images: [
      { nom: 'ownCloud', image: 'owncloud/server:latest', portDefaut: 8080, suggestionNom: 'owncloud', envDefaut: [
        { key: 'OWNCLOUD_DB_HOST', value: 'db' },
      ], icone: siOwncloud },
      { nom: 'Duplicati', image: 'duplicati/duplicati:latest', portDefaut: 8200, suggestionNom: 'duplicati', envDefaut: [], icone: siDuplicati },
      { nom: 'Syncthing', image: 'syncthing/syncthing:latest', portDefaut: 8384, suggestionNom: 'syncthing', envDefaut: [], icone: siSyncthing },
      { nom: 'Rclone (rcd)', image: 'rclone/rclone:latest', portDefaut: 5572, suggestionNom: 'rclone', envDefaut: [], icone: siRclone },
    ],
  },
  {
    categorie: 'Productivité & documentation',
    teinte: 'cyan',
    images: [
      { nom: 'Wiki.js', image: 'requarks/wiki:latest', portDefaut: 3000, suggestionNom: 'wikijs', envDefaut: [
        { key: 'DB_TYPE', value: 'postgres' },
        { key: 'DB_HOST', value: 'db' },
      ], icone: siWikidotjs },
      { nom: 'BookStack', image: 'linuxserver/bookstack:latest', portDefaut: 80, suggestionNom: 'bookstack', envDefaut: [
        { key: 'DB_HOST', value: 'db' },
        { key: 'DB_PASSWORD', value: 'change_moi' },
      ], icone: siBookstack },
      { nom: 'Trilium Notes', image: 'zadam/trilium:latest', portDefaut: 8080, suggestionNom: 'trilium', envDefaut: [], icone: siTrilium },
      { nom: 'Outline', image: 'outlinewiki/outline:latest', portDefaut: 3000, suggestionNom: 'outline', envDefaut: [
        { key: 'SECRET_KEY', value: 'change_moi' },
        { key: 'DATABASE_URL', value: 'postgres://outline:change_moi@db:5432/outline' },
      ], icone: siOutline },
      { nom: 'Vikunja (tâches)', image: 'vikunja/vikunja:latest', portDefaut: 3456, suggestionNom: 'vikunja', envDefaut: [
        { key: 'VIKUNJA_SERVICE_JWTSECRET', value: 'change_moi' },
      ], icone: null },
    ],
  },
  {
    categorie: 'Médias & documents',
    teinte: 'jaune',
    images: [
      { nom: 'Immich (photos)', image: 'ghcr.io/immich-app/immich-server:release', portDefaut: 2283, suggestionNom: 'immich', envDefaut: [
        { key: 'DB_HOSTNAME', value: 'db' },
        { key: 'REDIS_HOSTNAME', value: 'redis' },
      ], icone: siImmich },
      { nom: 'Paperless-ngx', image: 'ghcr.io/paperless-ngx/paperless-ngx:latest', portDefaut: 8000, suggestionNom: 'paperless', envDefaut: [
        { key: 'PAPERLESS_REDIS', value: 'redis://redis:6379' },
        { key: 'PAPERLESS_DBHOST', value: 'db' },
      ], icone: siPaperlessngx },
      { nom: 'Calibre-Web', image: 'linuxserver/calibre-web:latest', portDefaut: 8083, suggestionNom: 'calibre-web', envDefaut: [], icone: siCalibreweb },
    ],
  },
  {
    categorie: 'No-code & data',
    teinte: 'orange',
    images: [
      { nom: 'Baserow', image: 'baserow/baserow:latest', portDefaut: 80, suggestionNom: 'baserow', envDefaut: [], icone: siBaserow },
      { nom: 'Metabase', image: 'metabase/metabase:latest', portDefaut: 3000, suggestionNom: 'metabase', envDefaut: [], icone: siMetabase },
      { nom: 'NocoDB', image: 'nocodb/nocodb:latest', portDefaut: 8080, suggestionNom: 'nocodb', envDefaut: [], icone: null },
      { nom: 'pgAdmin', image: 'dpage/pgadmin4:latest', portDefaut: 80, suggestionNom: 'pgadmin', envDefaut: [
        { key: 'PGADMIN_DEFAULT_EMAIL', value: 'admin@example.com' },
        { key: 'PGADMIN_DEFAULT_PASSWORD', value: 'change_moi' },
      ], icone: null },
    ],
  },
  {
    categorie: 'E-commerce & ERP',
    teinte: 'steel',
    images: [
      { nom: 'PrestaShop', image: 'prestashop/prestashop:latest', portDefaut: 80, suggestionNom: 'prestashop', envDefaut: [
        { key: 'DB_SERVER', value: 'db' },
      ], icone: siPrestashop },
      { nom: 'Odoo', image: 'odoo:latest', portDefaut: 8069, suggestionNom: 'odoo', envDefaut: [
        { key: 'HOST', value: 'db' },
      ], icone: siOdoo },
    ],
  },
  {
    categorie: 'IA & automatisation',
    teinte: 'jaune',
    images: [
      { nom: 'Ollama', image: 'ollama/ollama:latest', portDefaut: 11434, suggestionNom: 'ollama', envDefaut: [], icone: siOllama },
      { nom: 'Open WebUI', image: 'ghcr.io/open-webui/open-webui:main', portDefaut: 8080, suggestionNom: 'open-webui', envDefaut: [
        { key: 'OLLAMA_BASE_URL', value: 'http://ollama:11434' },
      ], icone: null },
    ],
  },
]

// Compare une image utilisée par un service à la base d'une image du
// catalogue (déjà débarrassée de son tag). Un simple `startsWith` ne suffit
// pas : "redis/redisinsight" ou "mysqld-exporter" commencent respectivement
// par "redis" et "mysql" sans être ces images-là. On exige donc une égalité
// stricte, ou un préfixe suivi de ":" (début du tag) — un "/" qui suit N'EST
// PAS une frontière sûre : "redis/redisinsight" a "redis" comme espace de
// noms (organisation Docker Hub) mais désigne une image totalement
// différente, pas une variante de "redis".
function estMemeImage(img, base) {
  return img === base || img.startsWith(base + ':')
}

// Retrouve la commande de healthcheck suggérée pour une image, si connue du
// catalogue (bases de données/outils dont le client est inclus dans l'image
// officielle — mysqladmin, pg_isready, redis-cli...). Renvoie '' si inconnue.
export function healthcheckSuggere(image) {
  const img = (image || '').toLowerCase()
  for (const groupe of CATALOGUE) {
    const trouve = groupe.images.find((i) => estMemeImage(img, i.image.split(':')[0]))
    if (trouve && trouve.healthcheck) return trouve.healthcheck
  }
  return ''
}

// Retrouve l'icône (logo) associée à une image Docker, si connue du catalogue
export function trouverIcone(image) {
  const img = (image || '').toLowerCase()
  for (const groupe of CATALOGUE) {
    const trouve = groupe.images.find((i) => estMemeImage(img, i.image.split(':')[0]))
    if (trouve) return trouve.icone
  }
  return null
}

// Devine la teinte d'un service à partir de son image (pour l'affichage "conteneur")
export function deviner_teinte(image) {
  const img = (image || '').toLowerCase()
  for (const groupe of CATALOGUE) {
    if (groupe.images.some((i) => estMemeImage(img, i.image.split(':')[0]))) {
      return groupe.teinte
    }
  }
  return 'steel'
}

// Renvoie tous les ports hôte déjà utilisés par les services existants
export function portsHoteUtilises(services) {
  const utilises = new Set()
  for (const s of services || []) {
    for (const p of s.ports || []) {
      if (p.host) utilises.add(Number(p.host))
    }
  }
  return utilises
}

// Trouve le premier port disponible à partir d'un port souhaité,
// en évitant les ports déjà utilisés par les autres services du quai.
// Si la valeur fournie n'est pas un port valide (ex: une plage de ports
// "3000-3005", syntaxe Compose légitime mais non gérée par DockerForge, ou
// une saisie corrompue), on la renvoie inchangée plutôt que de la corrompre
// en la chaîne "NaN" — Number(portSouhaite) serait NaN, et NaN étant
// toujours différent de lui-même en JS, la valeur d'origine se retrouvait
// silencieusement écrasée. La validation du formulaire signale déjà ce cas.
export function trouverPortLibre(portSouhaite, portsUtilises) {
  let port = Number(portSouhaite)
  if (!Number.isFinite(port)) return portSouhaite
  while (portsUtilises.has(port)) {
    port += 1
  }
  return port
}
