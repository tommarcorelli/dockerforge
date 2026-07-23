import { useState, useEffect, useRef } from 'react'
import { siApple, siLinux, siUbuntu, siDebian, siFedora, siArchlinux, siOpensuse, siAlpinelinux, siRaspberrypi, siDocker } from 'simple-icons'
import Icon from './Icon.jsx'

// Modale : installation complète de Docker (Windows / macOS / Linux)
function GuideInstallationModal({ ouvert, onFermer }) {
  const [os, setOs] = useState('windows')
  const fermerRef = useRef(null)

  useEffect(() => {
    if (ouvert) {
      const id = setTimeout(() => fermerRef.current?.focus(), 10)
      return () => clearTimeout(id)
    }
  }, [ouvert])

  if (!ouvert) return null

  return (
    <div className="guide-fond" onClick={onFermer} role="presentation">
      <div
        className="guide-panneau"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Installer Docker"
      >
        <div className="guide-entete">
          <div className="guide-onglets">
            <button className={`guide-onglet ${os === 'windows' ? 'guide-onglet-actif' : ''}`} onClick={() => setOs('windows')}>🪟 Windows</button>
            <button className={`guide-onglet ${os === 'mac' ? 'guide-onglet-actif' : ''}`} onClick={() => setOs('mac')}><Icon icon={siApple} couleur="currentColor" /> macOS</button>
            <button className={`guide-onglet ${os === 'linux' ? 'guide-onglet-actif' : ''}`} onClick={() => setOs('linux')}><Icon icon={siLinux} couleur="currentColor" /> Linux</button>
          </div>
          <button ref={fermerRef} className="btn-icone guide-fermer" onClick={onFermer} aria-label="Fermer">✕</button>
        </div>

        <div className="guide-contenu">
          {os === 'windows' && <InstallWindows />}
          {os === 'mac' && <InstallMac />}
          {os === 'linux' && <InstallLinux />}

          <GuideEtape n="▶" titre="Lancer le docker-compose.yml généré" dernier>
            Place-toi dans le dossier contenant le fichier, puis :
            <pre className="guide-code">{`docker compose up -d      # démarrer en arrière-plan
docker compose logs -f     # voir les logs en direct
docker compose ps          # état des conteneurs
docker compose down        # arrêter (garde les données)
docker compose down -v     # arrêter + supprimer les volumes`}</pre>
          </GuideEtape>
        </div>
      </div>
    </div>
  )
}

function InstallWindows() {
  return (
    <>
      <GuideEtape n="1" titre="Vérifier la config (Windows 10/11)">
        Docker Desktop a besoin de <strong>WSL 2</strong> (Windows Subsystem
        for Linux). Ouvre PowerShell <strong>en administrateur</strong> et lance :
        <pre className="guide-code">wsl --install</pre>
        Si WSL est déjà installé, mets-le à jour :
        <pre className="guide-code">wsl --update</pre>
        Redémarre le PC si demandé.
      </GuideEtape>

      <GuideEtape n="2" titre="Installer Docker Desktop">
        Option la plus rapide, en PowerShell (pas besoin d'ouvrir un
        navigateur) :
        <pre className="guide-code">winget install Docker.DockerDesktop</pre>
        Ou manuellement : télécharge l'installeur sur
        <code> docker.com/products/docker-desktop</code> et double-clique dessus.
      </GuideEtape>

      <GuideEtape n="3" titre="Démarrer Docker Desktop">
        Ferme et rouvre PowerShell (pour recharger le PATH), puis lance Docker
        Desktop depuis le menu Démarrer. Attends que l'icône de la baleine
        dans la barre des tâches arrête de s'animer.
      </GuideEtape>

      <GuideEtape n="4" titre="Vérifier l'installation">
        <pre className="guide-code">{`docker --version
docker compose version
docker run hello-world`}</pre>
        La dernière commande télécharge une image de test et affiche un
        message de bienvenue si tout fonctionne.
      </GuideEtape>

      <GuideEtape n="5" titre="Problèmes fréquents">
        <strong>"docker: command not found"</strong> → ferme et rouvre ton
        terminal (le PATH doit être rechargé après l'installation).<br />
        <strong>Docker Desktop refuse de démarrer (erreur WSL)</strong> →
        PowerShell en administrateur : <code>wsl --update</code> puis relance
        Docker Desktop.<br />
        <strong>"port is already allocated"</strong> → un autre programme
        utilise déjà ce port ; change le port hôte dans DockerForge.
      </GuideEtape>
    </>
  )
}

function InstallMac() {
  return (
    <>
      <GuideEtape n="1" titre="Installer avec Homebrew (rapide)">
        Si tu as Homebrew installé, dans le Terminal :
        <pre className="guide-code">brew install --cask docker</pre>
        Sinon, installe Homebrew d'abord :
        <pre className="guide-code">{`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`}</pre>
      </GuideEtape>

      <GuideEtape n="2" titre="Ou installer manuellement">
        Télécharge <strong>Docker Desktop</strong> sur
        <code> docker.com/products/docker-desktop</code> (choisis Apple
        Silicon ou Intel selon ton Mac), ouvre le <code>.dmg</code> et glisse
        Docker dans Applications.
      </GuideEtape>

      <GuideEtape n="3" titre="Démarrer et autoriser">
        Lance Docker Desktop depuis Applications. macOS va demander des
        autorisations système (réseau, extensions) — accepte-les.
      </GuideEtape>

      <GuideEtape n="4" titre="Vérifier l'installation">
        <pre className="guide-code">{`docker --version
docker compose version
docker run hello-world`}</pre>
      </GuideEtape>
    </>
  )
}

function InstallLinux() {
  const [distro, setDistro] = useState('ubuntu')

  return (
    <>
      <div className="distro-selecteur">
        <button className={`distro-btn ${distro === 'ubuntu' ? 'distro-btn-actif' : ''}`} onClick={() => setDistro('ubuntu')}><Icon icon={siUbuntu} /> Ubuntu</button>
        <button className={`distro-btn ${distro === 'debian' ? 'distro-btn-actif' : ''}`} onClick={() => setDistro('debian')}><Icon icon={siDebian} /> Debian</button>
        <button className={`distro-btn ${distro === 'fedora' ? 'distro-btn-actif' : ''}`} onClick={() => setDistro('fedora')}><Icon icon={siFedora} /> Fedora</button>
        <button className={`distro-btn ${distro === 'arch' ? 'distro-btn-actif' : ''}`} onClick={() => setDistro('arch')}><Icon icon={siArchlinux} /> Arch</button>
        <button className={`distro-btn ${distro === 'opensuse' ? 'distro-btn-actif' : ''}`} onClick={() => setDistro('opensuse')}><Icon icon={siOpensuse} /> openSUSE</button>
        <button className={`distro-btn ${distro === 'alpine' ? 'distro-btn-actif' : ''}`} onClick={() => setDistro('alpine')}><Icon icon={siAlpinelinux} /> Alpine</button>
        <button className={`distro-btn ${distro === 'raspberry' ? 'distro-btn-actif' : ''}`} onClick={() => setDistro('raspberry')}><Icon icon={siRaspberrypi} /> Raspberry Pi</button>
      </div>

      {distro === 'ubuntu' && (
        <>
          <GuideEtape n="1" titre="Retirer d'anciennes versions (si présentes)">
            <pre className="guide-code">{`for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt-get remove $pkg
done`}</pre>
          </GuideEtape>

          <GuideEtape n="2" titre="Ajouter le dépôt officiel Docker">
            <pre className="guide-code">{`sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc`}</pre>
            <pre className="guide-code">{`echo \\
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \\
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update`}</pre>
          </GuideEtape>

          <GuideEtape n="3" titre="Installer Docker Engine + Compose">
            <pre className="guide-code">sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin</pre>
          </GuideEtape>
        </>
      )}

      {distro === 'debian' && (
        <>
          <GuideEtape n="1" titre="Retirer d'anciennes versions (si présentes)">
            <pre className="guide-code">{`for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt-get remove $pkg
done`}</pre>
          </GuideEtape>

          <GuideEtape n="2" titre="Ajouter le dépôt officiel Docker">
            <pre className="guide-code">{`sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc`}</pre>
            <pre className="guide-code">{`echo \\
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \\
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update`}</pre>
          </GuideEtape>

          <GuideEtape n="3" titre="Installer Docker Engine + Compose">
            <pre className="guide-code">sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin</pre>
          </GuideEtape>
        </>
      )}

      {distro === 'fedora' && (
        <>
          <GuideEtape n="1" titre="Retirer d'anciennes versions (si présentes)">
            <pre className="guide-code">sudo dnf remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine</pre>
          </GuideEtape>

          <GuideEtape n="2" titre="Ajouter le dépôt officiel Docker">
            <pre className="guide-code">{`sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo`}</pre>
          </GuideEtape>

          <GuideEtape n="3" titre="Installer Docker Engine + Compose">
            <pre className="guide-code">{`sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker`}</pre>
          </GuideEtape>
        </>
      )}

      {distro === 'arch' && (
        <>
          <GuideEtape n="1" titre="Installer Docker">
            <pre className="guide-code">sudo pacman -S docker docker-compose</pre>
          </GuideEtape>

          <GuideEtape n="2" titre="Activer et démarrer le service">
            <pre className="guide-code">sudo systemctl enable --now docker</pre>
          </GuideEtape>
        </>
      )}

      {distro === 'opensuse' && (
        <>
          <GuideEtape n="1" titre="Installer Docker">
            <pre className="guide-code">sudo zypper install docker docker-compose</pre>
          </GuideEtape>

          <GuideEtape n="2" titre="Activer et démarrer le service">
            <pre className="guide-code">sudo systemctl enable --now docker</pre>
          </GuideEtape>
        </>
      )}

      {distro === 'alpine' && (
        <>
          <GuideEtape n="1" titre="Installer Docker">
            Alpine utilise <code>apk</code> comme gestionnaire de paquets et
            <code> OpenRC</code> au lieu de systemd :
            <pre className="guide-code">sudo apk add docker docker-cli-compose</pre>
          </GuideEtape>

          <GuideEtape n="2" titre="Activer et démarrer le service">
            <pre className="guide-code">{`sudo rc-update add docker default
sudo service docker start`}</pre>
          </GuideEtape>
        </>
      )}

      {distro === 'raspberry' && (
        <>
          <GuideEtape n="1" titre="Raspberry Pi OS = Debian sur ARM">
            Raspberry Pi OS est basé sur Debian, mais l'installeur officiel
            "en une commande" gère automatiquement l'architecture ARM
            (32 ou 64 bits) — c'est la méthode recommandée ici plutôt que le
            dépôt apt manuel :
            <pre className="guide-code">curl -fsSL https://get.docker.com -o get-docker.sh</pre>
            <pre className="guide-code">sudo sh get-docker.sh</pre>
          </GuideEtape>

          <GuideEtape n="2" titre="Utiliser Docker sans sudo">
            <pre className="guide-code">{`sudo usermod -aG docker $USER
newgrp docker`}</pre>
          </GuideEtape>

          <GuideEtape n="3" titre="Bon à savoir">
            Un Raspberry Pi a peu de RAM — limite la mémoire de tes conteneurs
            dans DockerForge (option "Ressources" par service) pour éviter
            qu'un seul conteneur ne sature la carte.
          </GuideEtape>
        </>
      )}

      <GuideEtape n="✓" titre="Utiliser Docker sans sudo (recommandé, toutes distros)">
        <pre className="guide-code">{`sudo usermod -aG docker $USER
newgrp docker`}</pre>
        Ou déconnecte-toi/reconnecte-toi pour que ça prenne effet.
      </GuideEtape>

      <GuideEtape n="✔" titre="Vérifier l'installation" dernier>
        <pre className="guide-code">{`docker --version
docker compose version
docker run hello-world`}</pre>
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

export default GuideInstallationModal
