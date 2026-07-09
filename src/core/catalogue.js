// catalogue.js — images Docker populaires prêtes à cliquer, groupées par catégorie
// Chaque image porte un vrai logo vectoriel (simple-icons) + une teinte de
// catégorie (embout coloré des conteneurs visuels) + des variables d'env usuelles

import {
  siNginx, siApache, siCaddy, siTraefikproxy, siNginxproxymanager,
  siMysql, siPostgresql, siMongodb, siRedis, siMariadb, siInfluxdb, siNeo4j, siSqlite, siCockroachlabs,
  siNodedotjs, siPython, siPhp, siDjango, siFlask, siLaravel, siSymfony, siRubyonrails, siGo, siRust, siDotnet, siOpenjdk, siSpring,
  siGrafana, siPrometheus, siPortainer, siKibana,
  siRabbitmq, siElasticsearch, siApachekafka,
  siWordpress, siAdminer, siPhpmyadmin, siMinio, siKeycloak, siJenkins, siNextcloud, siVaultwarden, siGitlab, siSonarqube, siJupyter,
  siPihole, siPocketbase, siStrapi, siDirectus, siN8n, siHomeassistant, siPlex, siJellyfin,
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
    ],
  },
]

// Retrouve la commande de healthcheck suggérée pour une image, si connue du
// catalogue (bases de données/outils dont le client est inclus dans l'image
// officielle — mysqladmin, pg_isready, redis-cli...). Renvoie '' si inconnue.
export function healthcheckSuggere(image) {
  const img = (image || '').toLowerCase()
  for (const groupe of CATALOGUE) {
    const trouve = groupe.images.find((i) => img.startsWith(i.image.split(':')[0]))
    if (trouve && trouve.healthcheck) return trouve.healthcheck
  }
  return ''
}

// Retrouve l'icône (logo) associée à une image Docker, si connue du catalogue
export function trouverIcone(image) {
  const img = (image || '').toLowerCase()
  for (const groupe of CATALOGUE) {
    const trouve = groupe.images.find((i) => img.startsWith(i.image.split(':')[0]))
    if (trouve) return trouve.icone
  }
  return null
}

// Devine la teinte d'un service à partir de son image (pour l'affichage "conteneur")
export function deviner_teinte(image) {
  const img = (image || '').toLowerCase()
  for (const groupe of CATALOGUE) {
    if (groupe.images.some((i) => img.startsWith(i.image.split(':')[0]))) {
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
export function trouverPortLibre(portSouhaite, portsUtilises) {
  let port = Number(portSouhaite)
  while (portsUtilises.has(port)) {
    port += 1
  }
  return port
}
