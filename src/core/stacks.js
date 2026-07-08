// stacks.js — combos de services prêts à charger en un clic
// Chaque stack décrit plusieurs services liés (dépendances, réseau logique)

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
      healthcheck: { enabled: false, test: '', interval: '30s', timeout: '5s', retries: 3 },
      memLimit: '',
      cpus: '',
    }
  })
}
