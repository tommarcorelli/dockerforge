// stacks.js — combos de services prêts à charger en un clic
// Chaque stack décrit plusieurs services liés (dépendances, réseau logique)

import { healthcheckSuggere } from './catalogue.js'

export const STACKS = [
  {
    id: 'lamp',
    nom: 'LAMP',
    description: 'Apache + PHP + MySQL',
    services: [
      {
        name: 'web', image: 'php:8.3-apache', ports: [{ host: 8080, container: 80 }],
        volumes: ['./www:/var/www/html'], env: [], dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mysql:8', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mysql:/var/lib/mysql'],
        env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MYSQL_DATABASE', value: 'app' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'wordpress',
    nom: 'WordPress',
    description: 'WordPress + MySQL',
    services: [
      {
        name: 'wordpress', image: 'wordpress:latest', ports: [{ host: 8080, container: 80 }],
        volumes: ['./wp-content:/var/www/html/wp-content'],
        env: [{ key: 'WORDPRESS_DB_HOST', value: 'db' }, { key: 'WORDPRESS_DB_PASSWORD', value: 'change_moi' }],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mysql:8', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mysql:/var/lib/mysql'],
        env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MYSQL_DATABASE', value: 'wordpress' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'monitoring',
    nom: 'Monitoring léger',
    description: 'Prometheus + Grafana',
    services: [
      {
        name: 'prometheus', image: 'prom/prometheus:latest', ports: [{ host: 9090, container: 9090 }],
        volumes: ['./prometheus.yml:/etc/prometheus/prometheus.yml'], env: [], dependsOn: [],
      },
      {
        name: 'grafana', image: 'grafana/grafana:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./data-grafana:/var/lib/grafana'], env: [], dependsOn: ['prometheus'],
      },
    ],
  },
  {
    id: 'observabilite',
    nom: 'Observabilité complète',
    description: 'Prometheus + Grafana + cAdvisor + Node Exporter',
    services: [
      {
        name: 'prometheus', image: 'prom/prometheus:latest', ports: [{ host: 9090, container: 9090 }],
        volumes: ['./prometheus.yml:/etc/prometheus/prometheus.yml'], env: [], dependsOn: [],
      },
      {
        name: 'grafana', image: 'grafana/grafana:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./data-grafana:/var/lib/grafana'], env: [], dependsOn: ['prometheus'],
      },
      {
        name: 'cadvisor', image: 'gcr.io/cadvisor/cadvisor:latest', ports: [{ host: 8081, container: 8080 }],
        volumes: ['/var/run:/var/run:ro', '/sys:/sys:ro', '/var/lib/docker/:/var/lib/docker:ro'],
        env: [], dependsOn: [],
      },
      {
        name: 'node-exporter', image: 'prom/node-exporter:latest', ports: [{ host: 9100, container: 9100 }],
        volumes: [], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'mean',
    nom: 'Node + Mongo',
    description: 'API Node.js + MongoDB',
    services: [
      {
        name: 'api', image: 'node:22-alpine', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./api:/usr/src/app'], env: [{ key: 'MONGO_URL', value: 'mongodb://mongo:27017/app' }],
        dependsOn: ['mongo'],
      },
      {
        name: 'mongo', image: 'mongo:latest', ports: [{ host: 27017, container: 27017 }],
        volumes: ['./data-mongo:/data/db'], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'elk',
    nom: 'ELK (logs)',
    description: 'Elasticsearch + Kibana',
    services: [
      {
        name: 'elasticsearch', image: 'elasticsearch:8.15.0', ports: [{ host: 9200, container: 9200 }],
        volumes: ['./data-es:/usr/share/elasticsearch/data'],
        env: [{ key: 'discovery.type', value: 'single-node' }, { key: 'xpack.security.enabled', value: 'false' }],
        dependsOn: [],
      },
      {
        name: 'kibana', image: 'docker.elastic.co/kibana/kibana:8.15.0', ports: [{ host: 5601, container: 5601 }],
        volumes: [], env: [{ key: 'ELASTICSEARCH_HOSTS', value: 'http://elasticsearch:9200' }],
        dependsOn: ['elasticsearch'],
      },
    ],
  },
  {
    id: 'n8n',
    nom: 'Automatisation (n8n)',
    description: 'n8n + PostgreSQL',
    services: [
      {
        name: 'n8n', image: 'n8nio/n8n:latest', ports: [{ host: 5678, container: 5678 }],
        volumes: ['./data-n8n:/home/node/.n8n'],
        env: [
          { key: 'DB_TYPE', value: 'postgresdb' },
          { key: 'DB_POSTGRESDB_HOST', value: 'db' },
          { key: 'DB_POSTGRESDB_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'n8n' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'ghost',
    nom: 'Blog (Ghost)',
    description: 'Ghost + MySQL',
    services: [
      {
        name: 'ghost', image: 'ghost:5', ports: [{ host: 2368, container: 2368 }],
        volumes: ['./data-ghost:/var/lib/ghost/content'],
        env: [
          { key: 'database__client', value: 'mysql' },
          { key: 'database__connection__host', value: 'db' },
          { key: 'database__connection__password', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mysql:8', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mysql:/var/lib/mysql'],
        env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MYSQL_DATABASE', value: 'ghost' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'metabase',
    nom: 'Analytique (Metabase)',
    description: 'Metabase + PostgreSQL',
    services: [
      {
        name: 'metabase', image: 'metabase/metabase:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: [],
        env: [
          { key: 'MB_DB_TYPE', value: 'postgres' },
          { key: 'MB_DB_HOST', value: 'db' },
          { key: 'MB_DB_DBNAME', value: 'metabase' },
          { key: 'MB_DB_PASS', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'metabase' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'keycloak',
    nom: 'Authentification (Keycloak)',
    description: 'Keycloak + PostgreSQL',
    services: [
      {
        name: 'keycloak', image: 'quay.io/keycloak/keycloak:latest', ports: [{ host: 8080, container: 8080 }],
        volumes: [],
        env: [
          { key: 'KEYCLOAK_ADMIN', value: 'admin' },
          { key: 'KEYCLOAK_ADMIN_PASSWORD', value: 'change_moi' },
          { key: 'KC_DB', value: 'postgres' },
          { key: 'KC_DB_URL', value: 'jdbc:postgresql://db:5432/keycloak' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'keycloak' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'gitea',
    nom: 'Git auto-hébergé (Gitea)',
    description: 'Gitea + PostgreSQL',
    services: [
      {
        name: 'gitea', image: 'gitea/gitea:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./data-gitea:/data'],
        env: [
          { key: 'GITEA__database__DB_TYPE', value: 'postgres' },
          { key: 'GITEA__database__HOST', value: 'db:5432' },
          { key: 'GITEA__database__PASSWD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'gitea' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'nextcloud-complet',
    nom: 'Cloud personnel (Nextcloud)',
    description: 'Nextcloud + MariaDB + Redis',
    services: [
      {
        name: 'nextcloud', image: 'nextcloud:latest', ports: [{ host: 8080, container: 80 }],
        volumes: ['./data-nextcloud:/var/www/html'],
        env: [
          { key: 'MYSQL_HOST', value: 'db' },
          { key: 'MYSQL_PASSWORD', value: 'change_moi' },
          { key: 'REDIS_HOST', value: 'redis' },
        ],
        dependsOn: ['db', 'redis'],
      },
      {
        name: 'db', image: 'mariadb:latest', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mysql:/var/lib/mysql'],
        env: [{ key: 'MARIADB_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MARIADB_DATABASE', value: 'nextcloud' }],
        dependsOn: [],
      },
      {
        name: 'redis', image: 'redis:latest', ports: [{ host: 6379, container: 6379 }],
        volumes: [], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'lemp',
    nom: 'LEMP',
    description: 'Nginx + PHP-FPM + MySQL',
    services: [
      {
        name: 'nginx', image: 'nginx:latest', ports: [{ host: 8080, container: 80 }],
        volumes: ['./www:/var/www/html', './nginx.conf:/etc/nginx/conf.d/default.conf'],
        env: [], dependsOn: ['php'],
      },
      {
        name: 'php', image: 'php:8.3-fpm', ports: [{ host: '', container: '' }],
        volumes: ['./www:/var/www/html'], env: [], dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mysql:8', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mysql:/var/lib/mysql'],
        env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MYSQL_DATABASE', value: 'app' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'strapi',
    nom: 'CMS headless (Strapi)',
    description: 'Strapi + PostgreSQL',
    services: [
      {
        name: 'strapi', image: 'strapi/strapi:latest', ports: [{ host: 1337, container: 1337 }],
        volumes: ['./data-strapi:/srv/app'],
        env: [
          { key: 'DATABASE_CLIENT', value: 'postgres' },
          { key: 'DATABASE_HOST', value: 'db' },
          { key: 'DATABASE_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'strapi' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'matomo',
    nom: 'Analytique web (Matomo)',
    description: 'Matomo + MariaDB',
    services: [
      {
        name: 'matomo', image: 'matomo:latest', ports: [{ host: 8080, container: 80 }],
        volumes: ['./data-matomo:/var/www/html'],
        env: [
          { key: 'MATOMO_DATABASE_HOST', value: 'db' },
          { key: 'MATOMO_DATABASE_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mariadb:latest', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mysql:/var/lib/mysql'],
        env: [{ key: 'MARIADB_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MARIADB_DATABASE', value: 'matomo' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'mailpit',
    nom: 'Test email dev (Mailpit)',
    description: 'Capture les emails envoyés en développement',
    services: [
      {
        name: 'mailpit', image: 'axllent/mailpit:latest',
        ports: [{ host: 8025, container: 8025 }, { host: 1025, container: 1025 }],
        volumes: [], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'pihole',
    nom: 'Anti-pub réseau (Pi-hole)',
    description: 'Bloqueur de pub DNS pour tout le réseau local',
    services: [
      {
        name: 'pihole', image: 'pihole/pihole:latest',
        ports: [
          { host: 53, container: 53 },
          { host: 80, container: 80 },
        ],
        volumes: ['./pihole/etc-pihole:/etc/pihole', './pihole/etc-dnsmasq:/etc/dnsmasq.d'],
        env: [{ key: 'WEBPASSWORD', value: 'change_moi' }, { key: 'TZ', value: 'Europe/Paris' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'uptime-kuma',
    nom: 'Supervision (Uptime Kuma)',
    description: 'Page de statut et surveillance de services en ligne',
    services: [
      {
        name: 'uptime-kuma', image: 'louislam/uptime-kuma:1',
        ports: [{ host: 3001, container: 3001 }],
        volumes: ['./uptime-kuma-data:/app/data'], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'home-assistant',
    nom: 'Domotique (Home Assistant)',
    description: 'Plateforme open source de maison connectée',
    services: [
      {
        name: 'homeassistant', image: 'homeassistant/home-assistant:stable',
        ports: [{ host: 8123, container: 8123 }],
        volumes: ['./homeassistant-config:/config'],
        env: [{ key: 'TZ', value: 'Europe/Paris' }], dependsOn: [],
      },
    ],
  },
  {
    id: 'jellyfin',
    nom: 'Serveur multimédia (Jellyfin)',
    description: 'Streaming de films/séries/musique, façon Plex mais libre',
    services: [
      {
        name: 'jellyfin', image: 'jellyfin/jellyfin:latest',
        ports: [{ host: 8096, container: 8096 }],
        volumes: ['./jellyfin-config:/config', './media:/media'],
        env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'directus',
    nom: 'CMS headless (Directus)',
    description: 'Directus + PostgreSQL',
    services: [
      {
        name: 'directus', image: 'directus/directus:latest',
        ports: [{ host: 8055, container: 8055 }],
        volumes: ['./directus-uploads:/directus/uploads'],
        env: [
          { key: 'KEY', value: 'change_moi' },
          { key: 'SECRET', value: 'change_moi' },
          { key: 'ADMIN_EMAIL', value: 'admin@example.com' },
          { key: 'ADMIN_PASSWORD', value: 'change_moi' },
          { key: 'DB_CLIENT', value: 'pg' },
          { key: 'DB_HOST', value: 'db' },
          { key: 'DB_DATABASE', value: 'directus' },
          { key: 'DB_USER', value: 'directus' },
          { key: 'DB_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'directus' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'directus' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'redis-insight',
    nom: 'Cache + interface (Redis + RedisInsight)',
    description: 'Redis avec une interface web pour explorer les données',
    services: [
      {
        name: 'redis', image: 'redis:latest', ports: [{ host: 6379, container: 6379 }],
        volumes: ['./data-redis:/data'], env: [], dependsOn: [],
      },
      {
        name: 'redisinsight', image: 'redis/redisinsight:latest',
        ports: [{ host: 8001, container: 5540 }],
        volumes: ['./redisinsight-data:/data'], env: [], dependsOn: ['redis'],
      },
    ],
  },
  {
    id: 'portainer',
    nom: 'Gestion Docker (Portainer)',
    description: 'Interface web pour gérer tes conteneurs et volumes Docker',
    services: [
      {
        name: 'portainer', image: 'portainer/portainer-ce:latest',
        ports: [{ host: 9000, container: 9000 }],
        volumes: ['/var/run/docker.sock:/var/run/docker.sock', './portainer-data:/data'],
        env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'mattermost',
    nom: 'Chat d\'équipe (Mattermost)',
    description: 'Mattermost + PostgreSQL',
    services: [
      {
        name: 'mattermost', image: 'mattermost/mattermost-team-edition:latest',
        ports: [{ host: 8065, container: 8065 }],
        volumes: ['./mattermost-data:/mattermost/data'],
        env: [
          { key: 'MM_SQLSETTINGS_DRIVERNAME', value: 'postgres' },
          { key: 'MM_SQLSETTINGS_DATASOURCE', value: 'postgres://mattermost:change_moi@db:5432/mattermost?sslmode=disable' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'mattermost' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'mattermost' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'wikijs',
    nom: 'Wiki (Wiki.js)',
    description: 'Wiki.js + PostgreSQL',
    services: [
      {
        name: 'wiki', image: 'requarks/wiki:2', ports: [{ host: 3000, container: 3000 }],
        volumes: [],
        env: [
          { key: 'DB_TYPE', value: 'postgres' },
          { key: 'DB_HOST', value: 'db' },
          { key: 'DB_PORT', value: '5432' },
          { key: 'DB_USER', value: 'wikijs' },
          { key: 'DB_PASS', value: 'change_moi' },
          { key: 'DB_NAME', value: 'wiki' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'wikijs' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'wiki' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'vaultwarden',
    nom: 'Mots de passe (Vaultwarden)',
    description: 'Gestionnaire de mots de passe compatible Bitwarden',
    services: [
      {
        name: 'vaultwarden', image: 'vaultwarden/server:latest',
        ports: [{ host: 8081, container: 80 }],
        volumes: ['./vaultwarden-data:/data'],
        env: [{ key: 'ADMIN_TOKEN', value: 'change_moi' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'syncthing',
    nom: 'Synchronisation de fichiers (Syncthing)',
    description: 'Synchronise des dossiers entre plusieurs appareils, sans cloud tiers',
    services: [
      {
        name: 'syncthing', image: 'syncthing/syncthing:latest',
        ports: [
          { host: 8384, container: 8384 },
          { host: 22000, container: 22000 },
        ],
        volumes: ['./syncthing-config:/var/syncthing'],
        env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'meilisearch',
    nom: 'Moteur de recherche (Meilisearch)',
    description: 'Recherche rapide et pertinente à intégrer dans une appli',
    services: [
      {
        name: 'meilisearch', image: 'getmeili/meilisearch:latest',
        ports: [{ host: 7700, container: 7700 }],
        volumes: ['./meili-data:/meili_data'],
        env: [{ key: 'MEILI_MASTER_KEY', value: 'change_moi' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'umami',
    nom: 'Analytique respectueuse (Umami)',
    description: 'Umami + PostgreSQL — alternative légère à Google Analytics',
    services: [
      {
        name: 'umami', image: 'ghcr.io/umami-software/umami:postgresql-latest',
        ports: [{ host: 3000, container: 3000 }],
        volumes: [],
        env: [
          { key: 'DATABASE_URL', value: 'postgresql://umami:change_moi@db:5432/umami' },
          { key: 'APP_SECRET', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'umami' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'umami' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'wireguard-easy',
    nom: 'VPN (WireGuard Easy)',
    description: 'Serveur WireGuard avec interface web de gestion des clients',
    services: [
      {
        name: 'wg-easy', image: 'ghcr.io/wg-easy/wg-easy:latest',
        ports: [
          { host: 51820, container: 51820 },
          { host: 51821, container: 51821 },
        ],
        volumes: ['./wg-easy-data:/etc/wireguard'],
        env: [
          { key: 'WG_HOST', value: 'change_moi_ip_ou_domaine' },
          { key: 'PASSWORD', value: 'change_moi' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'sonarqube',
    nom: 'Qualité de code (SonarQube)',
    description: 'SonarQube + PostgreSQL — analyse statique de code',
    services: [
      {
        name: 'sonarqube', image: 'sonarqube:community', ports: [{ host: 9000, container: 9000 }],
        volumes: ['./sonarqube-data:/opt/sonarqube/data', './sonarqube-extensions:/opt/sonarqube/extensions'],
        env: [
          { key: 'SONAR_JDBC_URL', value: 'jdbc:postgresql://db:5432/sonar' },
          { key: 'SONAR_JDBC_USERNAME', value: 'sonar' },
          { key: 'SONAR_JDBC_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'sonar' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'sonar' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'pgadmin',
    nom: 'Admin PostgreSQL (pgAdmin)',
    description: 'pgAdmin + PostgreSQL — équivalent phpMyAdmin pour Postgres',
    services: [
      {
        name: 'pgadmin', image: 'dpage/pgadmin4:latest', ports: [{ host: 5050, container: 80 }],
        volumes: [],
        env: [
          { key: 'PGADMIN_DEFAULT_EMAIL', value: 'admin@example.com' },
          { key: 'PGADMIN_DEFAULT_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'postgres' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'app' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'linkding',
    nom: 'Gestionnaire de favoris (Linkding)',
    description: 'Sauvegarde et organise tes liens/favoris, façon Pocket',
    services: [
      {
        name: 'linkding', image: 'sissbruecker/linkding:latest',
        ports: [{ host: 9090, container: 9090 }],
        volumes: ['./linkding-data:/etc/linkding/data'],
        env: [
          { key: 'LD_SUPERUSER_NAME', value: 'admin' },
          { key: 'LD_SUPERUSER_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'firefly-iii',
    nom: 'Finances perso (Firefly III)',
    description: 'Firefly III + MariaDB — suivi de budget et de dépenses',
    services: [
      {
        name: 'firefly', image: 'fireflyiii/core:latest', ports: [{ host: 8082, container: 8080 }],
        volumes: ['./firefly-upload:/var/www/html/storage/upload'],
        env: [
          { key: 'APP_KEY', value: 'change_moi_cle_32_caracteres' },
          { key: 'DB_CONNECTION', value: 'mysql' },
          { key: 'DB_HOST', value: 'db' },
          { key: 'DB_DATABASE', value: 'firefly' },
          { key: 'DB_USERNAME', value: 'firefly' },
          { key: 'DB_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mariadb:latest', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mariadb:/var/lib/mysql'],
        env: [
          { key: 'MARIADB_DATABASE', value: 'firefly' },
          { key: 'MARIADB_USER', value: 'firefly' },
          { key: 'MARIADB_PASSWORD', value: 'change_moi' },
          { key: 'MARIADB_ROOT_PASSWORD', value: 'change_moi_root' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'mealie',
    nom: 'Recettes de cuisine (Mealie)',
    description: 'Organise tes recettes et génère des listes de courses',
    services: [
      {
        name: 'mealie', image: 'ghcr.io/mealie-recipes/mealie:latest',
        ports: [{ host: 9925, container: 9000 }],
        volumes: ['./mealie-data:/app/data'],
        env: [{ key: 'TZ', value: 'Europe/Paris' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'bookstack',
    nom: 'Documentation (BookStack)',
    description: 'BookStack + MariaDB — wiki structuré en livres/chapitres/pages',
    services: [
      {
        name: 'bookstack', image: 'linuxserver/bookstack:latest', ports: [{ host: 6875, container: 80 }],
        volumes: ['./bookstack-config:/config'],
        env: [
          { key: 'PUID', value: '1000' },
          { key: 'PGID', value: '1000' },
          { key: 'APP_URL', value: 'http://localhost:6875' },
          { key: 'DB_HOST', value: 'db' },
          { key: 'DB_DATABASE', value: 'bookstackapp' },
          { key: 'DB_USERNAME', value: 'bookstack' },
          { key: 'DB_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mariadb:latest', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mariadb:/var/lib/mysql'],
        env: [
          { key: 'MARIADB_DATABASE', value: 'bookstackapp' },
          { key: 'MARIADB_USER', value: 'bookstack' },
          { key: 'MARIADB_PASSWORD', value: 'change_moi' },
          { key: 'MARIADB_ROOT_PASSWORD', value: 'change_moi_root' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'redmine',
    nom: 'Suivi de projets (Redmine)',
    description: 'Redmine + PostgreSQL — gestion de tâches et de bugs',
    services: [
      {
        name: 'redmine', image: 'redmine:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./redmine-files:/usr/src/redmine/files'],
        env: [
          { key: 'REDMINE_DB_POSTGRES', value: 'db' },
          { key: 'REDMINE_DB_DATABASE', value: 'redmine' },
          { key: 'REDMINE_DB_USERNAME', value: 'redmine' },
          { key: 'REDMINE_DB_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'redmine' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'redmine' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'miniflux',
    nom: 'Lecteur RSS (Miniflux)',
    description: 'Miniflux + PostgreSQL — flux RSS/Atom, sobre et rapide',
    services: [
      {
        name: 'miniflux', image: 'miniflux/miniflux:latest', ports: [{ host: 8080, container: 8080 }],
        volumes: [],
        env: [
          { key: 'DATABASE_URL', value: 'postgres://miniflux:change_moi@db/miniflux?sslmode=disable' },
          { key: 'RUN_MIGRATIONS', value: '1' },
          { key: 'CREATE_ADMIN', value: '1' },
          { key: 'ADMIN_USERNAME', value: 'admin' },
          { key: 'ADMIN_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [{ host: 5432, container: 5432 }],
        volumes: ['./data-postgres:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_USER', value: 'miniflux' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'POSTGRES_DB', value: 'miniflux' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'shlink',
    nom: 'Raccourcisseur d\'URL (Shlink)',
    description: 'Shlink + MariaDB — tes propres liens courts, comme bit.ly',
    services: [
      {
        name: 'shlink', image: 'shlinkio/shlink:latest', ports: [{ host: 8083, container: 8080 }],
        volumes: [],
        env: [
          { key: 'DEFAULT_DOMAIN', value: 'localhost' },
          { key: 'IS_HTTPS_ENABLED', value: 'false' },
          { key: 'DB_DRIVER', value: 'maria' },
          { key: 'DB_NAME', value: 'shlink' },
          { key: 'DB_USER', value: 'shlink' },
          { key: 'DB_PASSWORD', value: 'change_moi' },
          { key: 'DB_HOST', value: 'db' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mariadb:latest', ports: [{ host: 3306, container: 3306 }],
        volumes: ['./data-mariadb:/var/lib/mysql'],
        env: [
          { key: 'MARIADB_DATABASE', value: 'shlink' },
          { key: 'MARIADB_USER', value: 'shlink' },
          { key: 'MARIADB_PASSWORD', value: 'change_moi' },
          { key: 'MARIADB_ROOT_PASSWORD', value: 'change_moi_root' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'grocy',
    nom: 'Courses & inventaire (Grocy)',
    description: 'Gère tes stocks de nourriture, listes de courses, chores',
    services: [
      {
        name: 'grocy', image: 'lscr.io/linuxserver/grocy:latest', ports: [{ host: 9283, container: 80 }],
        volumes: ['./grocy-config:/config'],
        env: [
          { key: 'PUID', value: '1000' },
          { key: 'PGID', value: '1000' },
          { key: 'TZ', value: 'Europe/Paris' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'homepage',
    nom: 'Tableau de bord (Homepage)',
    description: 'Page d\'accueil centralisant tous tes services auto-hébergés',
    services: [
      {
        name: 'homepage', image: 'ghcr.io/gethomepage/homepage:latest',
        ports: [{ host: 3000, container: 3000 }],
        volumes: ['./homepage-config:/app/config'],
        env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'changedetection',
    nom: 'Surveillance de pages web (changedetection.io)',
    description: 'Alerte quand une page web surveillée change',
    services: [
      {
        name: 'changedetection', image: 'dgtlmoon/changedetection.io:latest',
        ports: [{ host: 5000, container: 5000 }],
        volumes: ['./changedetection-data:/datastore'],
        env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'gitlab',
    nom: 'Forge Git complète (GitLab)',
    description: 'GitLab CE — dépôts, CI/CD, issues, en auto-hébergé',
    services: [
      {
        name: 'gitlab', image: 'gitlab/gitlab-ce:latest',
        ports: [{ host: 8090, container: 80 }, { host: 4443, container: 443 }],
        volumes: [
          './gitlab-config:/etc/gitlab',
          './gitlab-logs:/var/log/gitlab',
          './gitlab-data:/var/opt/gitlab',
        ],
        env: [{ key: 'GITLAB_OMNIBUS_CONFIG', value: "external_url 'http://localhost:8090'" }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'jupyter',
    nom: 'Notebooks data science (Jupyter)',
    description: 'Environnement Jupyter prêt à l\'emploi pour Python/data',
    services: [
      {
        name: 'jupyter', image: 'jupyter/base-notebook:latest',
        ports: [{ host: 8888, container: 8888 }],
        volumes: ['./notebooks:/home/jovyan/work'],
        env: [{ key: 'JUPYTER_TOKEN', value: 'change_moi' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'pocketbase',
    nom: 'Backend léger (PocketBase)',
    description: 'Base de données + auth + API + admin, en un seul binaire',
    services: [
      {
        name: 'pocketbase', image: 'spectado/pocketbase:latest',
        ports: [{ host: 8090, container: 8090 }],
        volumes: ['./pocketbase-data:/pb_data'],
        env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'plex',
    nom: 'Serveur multimédia (Plex)',
    description: 'Alternative à Jellyfin, avec compte Plex.tv requis',
    services: [
      {
        name: 'plex', image: 'plexinc/pms-docker:latest',
        ports: [{ host: 32400, container: 32400 }],
        volumes: ['./plex-config:/config', './media:/data'],
        env: [
          { key: 'PLEX_CLAIM', value: 'change_moi_recupere_sur_plex.tv/claim' },
          { key: 'TZ', value: 'Europe/Paris' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'neo4j',
    nom: 'Base de données graphe (Neo4j)',
    description: 'Neo4j — relations et graphes, avec interface Neo4j Browser',
    services: [
      {
        name: 'neo4j', image: 'neo4j:latest',
        ports: [{ host: 7474, container: 7474 }, { host: 7687, container: 7687 }],
        volumes: ['./neo4j-data:/data'],
        env: [{ key: 'NEO4J_AUTH', value: 'neo4j/change_moi' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'kafka',
    nom: 'Streaming d\'événements (Kafka)',
    description: 'Kafka + Zookeeper — messagerie distribuée haute performance',
    services: [
      {
        name: 'zookeeper', image: 'bitnami/zookeeper:latest',
        ports: [{ host: 2181, container: 2181 }],
        volumes: ['./zookeeper-data:/bitnami/zookeeper'],
        env: [{ key: 'ALLOW_ANONYMOUS_LOGIN', value: 'yes' }],
        dependsOn: [],
      },
      {
        name: 'kafka', image: 'bitnami/kafka:latest',
        ports: [{ host: 9092, container: 9092 }],
        volumes: ['./kafka-data:/bitnami/kafka'],
        env: [
          { key: 'KAFKA_CFG_ZOOKEEPER_CONNECT', value: 'zookeeper:2181' },
          { key: 'ALLOW_PLAINTEXT_LISTENER', value: 'yes' },
          { key: 'KAFKA_CFG_ADVERTISED_LISTENERS', value: 'PLAINTEXT://localhost:9092' },
        ],
        dependsOn: ['zookeeper'],
      },
    ],
  },
  {
    id: 'jenkins',
    nom: 'CI/CD (Jenkins)',
    description: 'Automatisation de build/déploiement, auto-hébergée',
    services: [
      {
        name: 'jenkins', image: 'jenkins/jenkins:lts',
        ports: [{ host: 8080, container: 8080 }, { host: 50000, container: 50000 }],
        volumes: ['./jenkins-data:/var/jenkins_home'],
        env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'rabbitmq',
    nom: 'File de messages (RabbitMQ)',
    description: 'RabbitMQ avec interface de gestion web',
    services: [
      {
        name: 'rabbitmq', image: 'rabbitmq:3-management',
        ports: [{ host: 15672, container: 15672 }, { host: 5672, container: 5672 }],
        volumes: ['./rabbitmq-data:/var/lib/rabbitmq'],
        env: [
          { key: 'RABBITMQ_DEFAULT_USER', value: 'admin' },
          { key: 'RABBITMQ_DEFAULT_PASS', value: 'change_moi' },
        ],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'ldap',
    nom: 'Annuaire LDAP (OpenLDAP)',
    description: 'OpenLDAP + phpLDAPadmin pour administrer l\'annuaire depuis un navigateur',
    services: [
      {
        name: 'openldap', image: 'osixia/openldap:latest',
        ports: [{ host: 389, container: 389 }],
        volumes: ['./ldap-data:/var/lib/ldap', './ldap-config:/etc/ldap/slapd.d'],
        env: [
          { key: 'LDAP_ORGANISATION', value: 'Mon Entreprise' },
          { key: 'LDAP_DOMAIN', value: 'example.local' },
          { key: 'LDAP_ADMIN_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: [],
      },
      {
        name: 'phpldapadmin', image: 'osixia/phpldapadmin:latest',
        ports: [{ host: 8081, container: 80 }],
        volumes: [''],
        env: [
          { key: 'PHPLDAPADMIN_LDAP_HOSTS', value: 'openldap' },
          { key: 'PHPLDAPADMIN_HTTPS', value: 'false' },
        ],
        dependsOn: ['openldap'],
      },
    ],
  },
  {
    id: 'zabbix',
    nom: 'Supervision (Zabbix)',
    description: 'Zabbix (serveur + interface web) avec PostgreSQL',
    services: [
      {
        name: 'db', image: 'postgres:15',
        ports: [],
        volumes: ['./zabbix-db:/var/lib/postgresql/data'],
        env: [
          { key: 'POSTGRES_DB', value: 'zabbix' },
          { key: 'POSTGRES_USER', value: 'zabbix' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: [],
      },
      {
        name: 'zabbix-server', image: 'zabbix/zabbix-server-pgsql:latest',
        ports: [{ host: 10051, container: 10051 }],
        volumes: [''],
        env: [
          { key: 'DB_SERVER_HOST', value: 'db' },
          { key: 'POSTGRES_DB', value: 'zabbix' },
          { key: 'POSTGRES_USER', value: 'zabbix' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
        ],
        dependsOn: ['db'],
      },
      {
        name: 'zabbix-web', image: 'zabbix/zabbix-web-nginx-pgsql:latest',
        ports: [{ host: 8080, container: 8080 }],
        volumes: [''],
        env: [
          { key: 'DB_SERVER_HOST', value: 'db' },
          { key: 'POSTGRES_DB', value: 'zabbix' },
          { key: 'POSTGRES_USER', value: 'zabbix' },
          { key: 'POSTGRES_PASSWORD', value: 'change_moi' },
          { key: 'ZBX_SERVER_HOST', value: 'zabbix-server' },
          { key: 'PHP_TZ', value: 'Europe/Paris' },
        ],
        dependsOn: ['zabbix-server'],
      },
    ],
  },
  {
    id: 'glpi',
    nom: 'GLPI (gestion de parc)',
    description: 'GLPI + MariaDB — la base de données se relie via l\'assistant d\'installation web de GLPI (hôte "db", utilisateur "root")',
    services: [
      {
        name: 'db', image: 'mariadb:latest',
        ports: [],
        volumes: ['./glpi-db:/var/lib/mysql'],
        env: [
          { key: 'MARIADB_ROOT_PASSWORD', value: 'change_moi' },
          { key: 'MARIADB_DATABASE', value: 'glpi' },
        ],
        dependsOn: [],
      },
      {
        name: 'glpi', image: 'diouxx/glpi:latest',
        ports: [{ host: 8082, container: 80 }],
        volumes: ['./glpi-data:/var/www/html/glpi/files'],
        env: [{ key: 'TIMEZONE', value: 'Europe/Paris' }],
        dependsOn: ['db'],
      },
    ],
  },
  {
    id: 'authentification',
    nom: 'Authentification centralisée',
    description: 'Authelia + Redis — SSO / 2FA devant vos services derrière un reverse proxy',
    services: [
      {
        name: 'authelia', image: 'authelia/authelia:latest', ports: [{ host: 9091, container: 9091 }],
        volumes: ['./authelia-config:/config'], env: [], dependsOn: ['redis'],
      },
      {
        name: 'redis', image: 'redis:latest', ports: [],
        volumes: ['./data-redis:/data'], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'vault',
    nom: 'Coffre-fort de secrets (Vault)',
    description: 'HashiCorp Vault en mode dev — stockage centralisé de secrets',
    services: [
      {
        name: 'vault', image: 'hashicorp/vault:latest', ports: [{ host: 8200, container: 8200 }],
        volumes: ['./vault-data:/vault/data'],
        env: [{ key: 'VAULT_DEV_ROOT_TOKEN_ID', value: 'change_moi' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'rocketchat',
    nom: 'Chat interne (Rocket.Chat)',
    description: 'Rocket.Chat + MongoDB',
    services: [
      {
        name: 'rocketchat', image: 'rocketchat/rocket.chat:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./rocketchat-data:/app/uploads'],
        env: [{ key: 'MONGO_URL', value: 'mongodb://mongo:27017/rocketchat' }],
        dependsOn: ['mongo'],
      },
      {
        name: 'mongo', image: 'mongo:latest', ports: [],
        volumes: ['./data-mongo:/data/db'], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'discourse',
    nom: 'Forum (Discourse)',
    description: 'Discourse + PostgreSQL + Redis',
    services: [
      {
        name: 'discourse', image: 'bitnami/discourse:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./discourse-data:/bitnami/discourse'],
        env: [
          { key: 'DISCOURSE_DATABASE_HOST', value: 'db' },
          { key: 'DISCOURSE_REDIS_HOST', value: 'redis' },
        ],
        dependsOn: ['db', 'redis'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [],
        volumes: ['./discourse-db:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'discourse' }],
        dependsOn: [],
      },
      {
        name: 'redis', image: 'redis:latest', ports: [],
        volumes: ['./data-redis:/data'], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'immich',
    nom: 'Photos (Immich)',
    description: 'Immich + PostgreSQL + Redis — sauvegarde et tri de vos photos/vidéos',
    services: [
      {
        name: 'immich', image: 'ghcr.io/immich-app/immich-server:release', ports: [{ host: 2283, container: 2283 }],
        volumes: ['./immich-data:/usr/src/app/upload'],
        env: [{ key: 'DB_HOSTNAME', value: 'db' }, { key: 'REDIS_HOSTNAME', value: 'redis' }],
        dependsOn: ['db', 'redis'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [],
        volumes: ['./immich-db:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'immich' }],
        dependsOn: [],
      },
      {
        name: 'redis', image: 'redis:latest', ports: [],
        volumes: [], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'paperless',
    nom: 'GED documents (Paperless-ngx)',
    description: 'Paperless-ngx + PostgreSQL + Redis — numérisation et classement de documents',
    services: [
      {
        name: 'paperless', image: 'ghcr.io/paperless-ngx/paperless-ngx:latest', ports: [{ host: 8000, container: 8000 }],
        volumes: ['./paperless-data:/usr/src/paperless/data', './paperless-media:/usr/src/paperless/media', './paperless-consume:/usr/src/paperless/consume'],
        env: [{ key: 'PAPERLESS_REDIS', value: 'redis://redis:6379' }, { key: 'PAPERLESS_DBHOST', value: 'db' }],
        dependsOn: ['db', 'redis'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [],
        volumes: ['./paperless-db:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'paperless' }],
        dependsOn: [],
      },
      {
        name: 'redis', image: 'redis:latest', ports: [],
        volumes: [], env: [], dependsOn: [],
      },
    ],
  },
  {
    id: 'gitea',
    nom: 'Git auto-hébergé (Gitea)',
    description: 'Gitea + PostgreSQL — votre propre forge Git',
    services: [
      {
        name: 'gitea', image: 'gitea/gitea:latest', ports: [{ host: 3000, container: 3000 }, { host: 2222, container: 22 }],
        volumes: ['./gitea-data:/data'],
        env: [{ key: 'GITEA__database__DB_TYPE', value: 'postgres' }, { key: 'GITEA__database__HOST', value: 'db:5432' }],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [],
        volumes: ['./gitea-db:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_DB', value: 'gitea' }, { key: 'POSTGRES_USER', value: 'gitea' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'ia-locale',
    nom: 'IA locale (Ollama + Open WebUI)',
    description: 'Modèles de langage exécutés localement, avec interface web type ChatGPT',
    services: [
      {
        name: 'ollama', image: 'ollama/ollama:latest', ports: [{ host: 11434, container: 11434 }],
        volumes: ['./ollama-data:/root/.ollama'], env: [], dependsOn: [],
      },
      {
        name: 'open-webui', image: 'ghcr.io/open-webui/open-webui:main', ports: [{ host: 8080, container: 8080 }],
        volumes: ['./open-webui-data:/app/backend/data'],
        env: [{ key: 'OLLAMA_BASE_URL', value: 'http://ollama:11434' }],
        dependsOn: ['ollama'],
      },
    ],
  },
  {
    id: 'ghost-blog',
    nom: 'Blog (Ghost)',
    description: 'Ghost + MySQL',
    services: [
      {
        name: 'ghost', image: 'ghost:5', ports: [{ host: 2368, container: 2368 }],
        volumes: ['./ghost-content:/var/lib/ghost/content'],
        env: [{ key: 'database__client', value: 'mysql' }, { key: 'database__connection__host', value: 'db' }],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mysql:8', ports: [],
        volumes: ['./ghost-db:/var/lib/mysql'],
        env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MYSQL_DATABASE', value: 'ghost' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'prestashop',
    nom: 'E-commerce (PrestaShop)',
    description: 'PrestaShop + MySQL',
    services: [
      {
        name: 'prestashop', image: 'prestashop/prestashop:latest', ports: [{ host: 8080, container: 80 }],
        volumes: ['./prestashop-data:/var/www/html'],
        env: [{ key: 'DB_SERVER', value: 'db' }],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'mysql:8', ports: [],
        volumes: ['./prestashop-db:/var/lib/mysql'],
        env: [{ key: 'MYSQL_ROOT_PASSWORD', value: 'change_moi' }, { key: 'MYSQL_DATABASE', value: 'prestashop' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'odoo',
    nom: 'ERP/CRM (Odoo)',
    description: 'Odoo + PostgreSQL',
    services: [
      {
        name: 'odoo', image: 'odoo:latest', ports: [{ host: 8069, container: 8069 }],
        volumes: ['./odoo-data:/var/lib/odoo'],
        env: [{ key: 'HOST', value: 'db' }],
        dependsOn: ['db'],
      },
      {
        name: 'db', image: 'postgres:16', ports: [],
        volumes: ['./odoo-db:/var/lib/postgresql/data'],
        env: [{ key: 'POSTGRES_PASSWORD', value: 'change_moi' }, { key: 'POSTGRES_USER', value: 'odoo' }, { key: 'POSTGRES_DB', value: 'postgres' }],
        dependsOn: [],
      },
    ],
  },
  {
    id: 'dashboard-maison',
    nom: 'Dashboard maison',
    description: 'Homepage + Uptime Kuma — vue d\'ensemble et supervision de vos services auto-hébergés',
    services: [
      {
        name: 'homepage', image: 'ghcr.io/gethomepage/homepage:latest', ports: [{ host: 3000, container: 3000 }],
        volumes: ['./homepage-config:/app/config'], env: [], dependsOn: [],
      },
      {
        name: 'uptime-kuma', image: 'louislam/uptime-kuma:latest', ports: [{ host: 3001, container: 3001 }],
        volumes: ['./uptime-kuma-data:/app/data'], env: [], dependsOn: [],
      },
    ],
  },
]

// Construit des objets service complets (avec id) à partir d'une stack,
// en décalant les ports en conflit avec les services déjà présents.
export function construireStack(stack, portsUtilisesInitial) {
  const utilises = new Set(portsUtilisesInitial)
  return stack.services.map((s) => {
    const ports = (s.ports || []).map((p) => {
      if (!p.host) return { host: '', container: String(p.container || '') }
      let port = Number(p.host)
      while (utilises.has(port)) port += 1
      utilises.add(port)
      return { host: String(port), container: String(p.container) }
    })
    return {
      id: crypto.randomUUID(),
      name: s.name,
      image: s.image,
      ports: ports.length > 0 ? ports : [{ host: '', container: '' }],
      volumes: s.volumes && s.volumes.length > 0 ? s.volumes : [''],
      env: s.env && s.env.length > 0 ? s.env : [{ key: '', value: '' }],
      restart: 'unless-stopped',
      dependsOn: s.dependsOn || [],
      networks: s.networks || [],
      profiles: s.profiles || [],
      healthcheck: { enabled: false, test: healthcheckSuggere(s.image), interval: '30s', timeout: '5s', retries: 3 },
      memLimit: '',
      cpus: '',
    }
  })
}
