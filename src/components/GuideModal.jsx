import { useState } from 'react'

// Modale d'aide intégrée : installation Docker + mode d'emploi de DockerForge
function GuideModal({ ouvert, onFermer }) {
  const [onglet, setOnglet] = useState('utilisation')

  if (!ouvert) return null

  return (
    <div className="guide-fond" onClick={onFermer}>
      <div className="guide-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="guide-entete">
          <div className="guide-onglets">
            <button
              className={`guide-onglet ${onglet === 'utilisation' ? 'guide-onglet-actif' : ''}`}
              onClick={() => setOnglet('utilisation')}
            >
              Utiliser DockerForge
            </button>
            <button
              className={`guide-onglet ${onglet === 'installation' ? 'guide-onglet-actif' : ''}`}
              onClick={() => setOnglet('installation')}
            >
              Installer Docker
            </button>
          </div>
          <button className="btn-icone guide-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="guide-contenu">
          {onglet === 'utilisation' && <GuideUtilisation />}
          {onglet === 'installation' && <GuideInstallation />}
        </div>
      </div>
    </div>
  )
}

function GuideUtilisation() {
  return (
    <>
      <GuideEtape n="1" titre="Ajouter un premier conteneur">
        Clique sur une image du catalogue (Nginx, MySQL, Redis...) en haut du
        formulaire — ça pré-remplit automatiquement le nom, l'image, un port
        par défaut, et même les variables d'environnement usuelles. Renseigne
        au moins "Nom" et "Image", puis clique sur <strong>+ Ajouter ce conteneur</strong>.
      </GuideEtape>

      <GuideEtape n="2" titre="Charger une stack complète">
        Les <strong>stacks prêtes à l'emploi</strong> en haut de page (LAMP,
        WordPress, Monitoring...) ajoutent plusieurs services liés en un seul
        clic, dépendances déjà configurées.
      </GuideEtape>

      <GuideEtape n="3" titre="Ports sans conflit">
        Si deux services utilisent le même port par défaut, DockerForge décale
        automatiquement le second — un "décalé ✓" s'affiche pour te prévenir.
        Fonctionne aussi en saisie manuelle et à la duplication.
      </GuideEtape>

      <GuideEtape n="4" titre="Options avancées">
        Ouvre "▸ Options avancées" dans le formulaire pour régler le
        redémarrage, les dépendances entre services, les réseaux, la
        vérification de santé (healthcheck) et les limites de ressources
        (mémoire, CPU).
      </GuideEtape>

      <GuideEtape n="5" titre="Séparer les mots de passe">
        Dans l'aperçu à droite, active <strong>"Extraire les mots de passe
        dans des fichiers .env séparés"</strong> : les variables sensibles
        sortent du YAML vers des fichiers à part — la bonne pratique pour ne
        jamais pousser un mot de passe en clair sur GitHub.
      </GuideEtape>

      <GuideEtape n="6" titre="Réseaux personnalisés">
        Le module "Réseaux Docker" permet d'isoler certains services (par
        exemple ta base de données) sur un réseau séparé plutôt que tout le
        monde sur le réseau par défaut.
      </GuideEtape>

      <GuideEtape n="7" titre="Récupérer le résultat">
        En bas de l'aperçu : copier le YAML, télécharger le
        <code>docker-compose.yml</code> seul, ou télécharger un
        <strong> .zip complet</strong> du projet (compose + .env + .gitignore
        + notes de lancement).
      </GuideEtape>

      <GuideEtape n="8" titre="Importer un projet existant" dernier>
        Le bouton "📤 Importer un docker-compose.yml existant" recharge un
        fichier que tu as déjà pour continuer à l'éditer visuellement.
      </GuideEtape>
    </>
  )
}

function GuideInstallation() {
  return (
    <>
      <GuideEtape n="🪟" titre="Windows">
        Télécharge <strong>Docker Desktop</strong> sur docker.com, lance
        l'installeur (il peut demander d'activer WSL 2 — accepte), redémarre
        si demandé, puis lance Docker Desktop. Vérifie ensuite dans PowerShell :
        <pre className="guide-code">docker --version{'\n'}docker compose version</pre>
      </GuideEtape>

      <GuideEtape n="🍎" titre="macOS">
        Télécharge <strong>Docker Desktop</strong> (version Apple Silicon ou
        Intel selon ton Mac), installe-le depuis le .dmg, lance-le depuis
        Applications, puis vérifie dans le Terminal :
        <pre className="guide-code">docker --version{'\n'}docker compose version</pre>
      </GuideEtape>

      <GuideEtape n="🐧" titre="Linux (Ubuntu/Debian)">
        Le moteur seul (sans interface) est plus léger :
        <pre className="guide-code">curl -fsSL https://get.docker.com -o get-docker.sh{'\n'}sudo sh get-docker.sh{'\n'}sudo usermod -aG docker $USER</pre>
        Déconnecte-toi/reconnecte-toi pour que l'ajout au groupe prenne effet.
      </GuideEtape>

      <GuideEtape n="▶" titre="Lancer le docker-compose.yml généré">
        Place-toi dans le dossier contenant le fichier, puis :
        <pre className="guide-code">docker compose up -d      # démarrer{'\n'}docker compose logs -f     # voir les logs{'\n'}docker compose ps          # état des conteneurs{'\n'}docker compose down        # arrêter</pre>
      </GuideEtape>

      <GuideEtape n="⚠" titre="Problèmes fréquents" dernier>
        <strong>"docker: command not found"</strong> après installation →
        ferme et rouvre ton terminal.<br />
        <strong>"port is already allocated"</strong> → un programme sur ta
        machine utilise déjà ce port ; change le port hôte dans DockerForge.<br />
        <strong>Docker Desktop ne démarre pas (erreur WSL) sur Windows</strong> →
        lance <code>wsl --update</code> en PowerShell administrateur.
      </GuideEtape>
    </>
  )
}

function GuideEtape({ n, titre, children, dernier }) {
  return (
    <div className={`guide-etape ${dernier ? 'guide-etape-derniere' : ''}`}>
      <span className="guide-numero">{n}</span>
      <div>
        <h3>{titre}</h3>
        <p>{children}</p>
      </div>
    </div>
  )
}

export default GuideModal
