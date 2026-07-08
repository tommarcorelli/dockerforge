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
│   │   ├── NetworkManager.jsx       création/suppression de réseaux Docker
│   │   ├── ProjectManager.jsx       gestion de plusieurs projets (onglets de projets)
│   │   ├── SchemaNavire.jsx         schéma visuel du "navire" (vue d'ensemble des conteneurs/réseaux)
│   │   ├── GuideUtilisationModal.jsx  modale d'aide à l'utilisation de l'outil
│   │   ├── GuideInstallationModal.jsx modale d'aide à l'installation de Docker
│   │   ├── Aide.jsx                 bulle d'aide ⓘ réutilisable (tooltip)
│   │   └── Icon.jsx                 rendu d'icônes simple-icons (logo Docker...)
│   ├── core/
│   │   ├── generateur.js            construction + validation du YAML, extraction des secrets
│   │   ├── catalogue.js             images populaires, résolution de ports, healthchecks suggérés
│   │   ├── stacks.js                combos de services (LAMP, WordPress...)
│   │   ├── importateur.js           lecture d'un docker-compose.yml existant pour l'éditer
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

**Réseaux**
- Créer des réseaux Docker personnalisés et assigner chaque service à un ou
  plusieurs réseaux. L'onglet Réseaux affiche aussi un récapitulatif de la
  répartition des services par réseau.

**Stacks & import**
- Stacks prêtes à l'emploi : LAMP, WordPress+MySQL, Monitoring, Node+Mongo.
- Import d'un `docker-compose.yml` existant pour l'éditer visuellement.

**Sécurité**
- Extraction des mots de passe/secrets vers des fichiers `.env` séparés, avec
  `.gitignore` généré automatiquement dans l'export.

**Export**
- Copier le YAML, télécharger le `docker-compose.yml` seul, ou un `.zip`
  complet (compose + `.env.*` + `.gitignore` + `LANCEMENT.md`).

**Aide intégrée**
- Guide d'utilisation de l'outil et guide d'installation de Docker,
  accessibles depuis des boutons dans l'en-tête.
- Schéma visuel du "navire" (vue d'ensemble des conteneurs et réseaux),
  repliable.

**Confort**
- Duplication et réordonnancement des conteneurs.
- Validation en direct (erreurs bloquantes + avertissements).
- Sauvegarde automatique dans le navigateur (localStorage), par projet.
- **Thème clair (par défaut) / sombre** basculable en un clic (bouton dans
  l'en-tête), préférence mémorisée.
- Identité visuelle claire, façon dashboard moderne (cartes blanches
  arrondies, ombres douces, police Inter) — inspirée d'interfaces comme CasaOS.

## Idées de suites possibles

- [ ] Détection de secrets plus fine (liste blanche/noire personnalisable).
- [ ] Déploiement sur GitHub Pages avec URL publique.

## Notes techniques

- Tout est calculé côté client (aucun backend) : le site est 100% statique.
- `crypto.randomUUID()` est utilisé pour les identifiants — nécessite un
  navigateur récent et un contexte sécurisé (`localhost` ou HTTPS).
- Dépendances à installer via `npm install` : `jszip` (export .zip), `js-yaml`
  (import), `simple-icons` (logo Docker dans l'en-tête).
