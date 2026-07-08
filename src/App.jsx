import { useState, useMemo, useEffect } from 'react'
import ServiceForm from './components/ServiceForm.jsx'
import ServiceList from './components/ServiceList.jsx'
import Preview from './components/Preview.jsx'
import StackPresets from './components/StackPresets.jsx'
import NetworkManager from './components/NetworkManager.jsx'
import GuideUtilisationModal from './components/GuideUtilisationModal.jsx'
import GuideInstallationModal from './components/GuideInstallationModal.jsx'
import ProjectManager from './components/ProjectManager.jsx'
import { buildDockerCompose, validerServices, buildEnvFiles } from './core/generateur.js'
import { portsHoteUtilises, trouverPortLibre } from './core/catalogue.js'
import { construireStack } from './core/stacks.js'
import { importerDockerCompose } from './core/importateur.js'
import { chargerProjets, sauvegarderProjets, projetVide } from './core/projets.js'
import { siDocker } from 'simple-icons'
import Icon from './components/Icon.jsx'
import SchemaNavire from './components/SchemaNavire.jsx'

// App.jsx — composant racine de DockerForge
function App() {
  const [etat, setEtat] = useState(chargerProjets)
  const [erreursImport, setErreursImport] = useState([])
  const [schemaOuvert, setSchemaOuvert] = useState(true)
  const [guideUtilisationOuvert, setGuideUtilisationOuvert] = useState(false)
  const [guideInstallationOuvert, setGuideInstallationOuvert] = useState(false)
  const [ongletActif, setOngletActif] = useState('services')
  const [theme, setTheme] = useState(() => localStorage.getItem('dockerforge_theme') || 'clair')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('dockerforge_theme', theme)
  }, [theme])

  function basculerTheme() {
    setTheme((t) => (t === 'sombre' ? 'clair' : 'sombre'))
  }

  const projetActif = etat.projets.find((p) => p.id === etat.actifId) || etat.projets[0]
  const { services, networks, nomProjet, extraireSecrets } = projetActif

  useEffect(() => {
    sauvegarderProjets(etat)
  }, [etat])

  // Applique un patch (objet ou fonction) au projet actuellement actif
  function patcherProjetActif(patch) {
    setEtat((e) => ({
      ...e,
      projets: e.projets.map((p) =>
        p.id === e.actifId
          ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch), majLe: Date.now() }
          : p
      ),
    }))
  }

  // --- Gestion des projets ---

  function changerProjet(id) {
    setEtat((e) => ({ ...e, actifId: id }))
  }

  function nouveauProjet() {
    const p = projetVide(`Projet ${etat.projets.length + 1}`)
    setEtat((e) => ({ ...e, projets: [...e.projets, p], actifId: p.id }))
  }

  function renommerProjet(id, nom) {
    setEtat((e) => ({ ...e, projets: e.projets.map((p) => (p.id === id ? { ...p, nom } : p)) }))
  }

  function dupliquerProjet(id) {
    setEtat((e) => {
      const original = e.projets.find((p) => p.id === id)
      if (!original) return e
      const copie = {
        ...original,
        id: crypto.randomUUID(),
        nom: `${original.nom} (copie)`,
        services: original.services.map((s) => ({ ...s, id: crypto.randomUUID() })),
        creeLe: Date.now(),
        majLe: Date.now(),
      }
      return { ...e, projets: [...e.projets, copie], actifId: copie.id }
    })
  }

  function supprimerProjet(id) {
    if (!confirm('Supprimer ce projet entier ? Cette action est irréversible.')) return
    setEtat((e) => {
      const restants = e.projets.filter((p) => p.id !== id)
      const projets = restants.length > 0 ? restants : [projetVide('Mon premier projet')]
      const actifId = e.actifId === id ? projets[0].id : e.actifId
      return { projets, actifId }
    })
  }

  // --- Réseaux ---

  function ajouterReseau(reseau) {
    patcherProjetActif((p) => ({ networks: [...p.networks, reseau] }))
  }

  function supprimerReseau(nom) {
    patcherProjetActif((p) => ({
      networks: p.networks.filter((n) => n.nom !== nom),
      services: p.services.map((s) => ({ ...s, networks: (s.networks || []).filter((n) => n !== nom) })),
    }))
  }

  // --- Import ---

  function importerFichier(e) {
    const fichier = e.target.files[0]
    if (!fichier) return
    const lecteur = new FileReader()
    lecteur.onload = () => {
      const { services: importes, erreurs } = importerDockerCompose(lecteur.result)
      setErreursImport(erreurs)
      if (importes.length > 0) {
        patcherProjetActif((p) => {
          const utilises = portsHoteUtilises(p.services)
          const ajustes = importes.map((s) => ({
            ...s,
            ports: (s.ports || []).map((port) =>
              port.host ? { ...port, host: String(trouverPortLibre(port.host, utilises)) } : port
            ),
          }))
          for (const s of ajustes) {
            for (const port of s.ports) if (port.host) utilises.add(Number(port.host))
          }
          return { services: [...p.services, ...ajustes] }
        })
      }
    }
    lecteur.readAsText(fichier)
    e.target.value = ''
  }

  // --- Services ---

  function ajouterService(service) {
    patcherProjetActif((p) => ({ services: [...p.services, service] }))
  }

  function supprimerService(id) {
    patcherProjetActif((p) => ({ services: p.services.filter((s) => s.id !== id) }))
  }

  function dupliquerService(id) {
    patcherProjetActif((p) => {
      const original = p.services.find((s) => s.id === id)
      if (!original) return {}
      const utilises = portsHoteUtilises(p.services)
      const copie = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name}_copie`,
        ports: (original.ports || []).map((port) =>
          port.host ? { ...port, host: String(trouverPortLibre(port.host, utilises)) } : port
        ),
      }
      return { services: [...p.services, copie] }
    })
  }

  function reordonnerServices(indexDepart, indexArrivee) {
    patcherProjetActif((p) => {
      const liste = [...p.services]
      const [deplace] = liste.splice(indexDepart, 1)
      liste.splice(indexArrivee, 0, deplace)
      return { services: liste }
    })
  }

  function chargerStack(stack) {
    patcherProjetActif((p) => {
      const utilises = portsHoteUtilises(p.services)
      const nouveaux = construireStack(stack, utilises)
      return { services: [...p.services, ...nouveaux] }
    })
  }

  function reinitialiser() {
    if (services.length > 0 && !confirm('Vider la liste ? Tous les services configurés seront supprimés.')) return
    patcherProjetActif({ services: [] })
  }

  function setNomProjet(valeur) {
    patcherProjetActif({ nomProjet: valeur })
  }

  function toggleExtraireSecrets() {
    patcherProjetActif((p) => ({ extraireSecrets: !p.extraireSecrets }))
  }

  // --- Dérivés ---

  const { erreurs, avertissements } = useMemo(
    () => validerServices(services, { extraireSecrets }),
    [services, extraireSecrets]
  )
  const yaml = useMemo(
    () => buildDockerCompose(services, { extraireSecrets, networks, nomProjet }),
    [services, extraireSecrets, networks, nomProjet]
  )
  const envFiles = useMemo(
    () => (extraireSecrets ? buildEnvFiles(services) : []),
    [services, extraireSecrets]
  )

  const nbPorts = services.reduce(
    (acc, s) => acc + (s.ports || []).filter((p) => p.host && p.container).length,
    0
  )
  const nbVolumes = services.reduce(
    (acc, s) => acc + (s.volumes || []).filter((v) => v && v.trim() !== '').length,
    0
  )

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-fond" aria-hidden="true" />
        <div className="hero-contenu">
          <span className="hero-eyebrow">GÉNÉRATEUR DE DOCKER-COMPOSE</span>
          <h1 className="hero-titre">
            <Icon icon={siDocker} size={52} couleur="#2496ED" />
            DOCKER<span>FORGE</span>
          </h1>
          <p className="hero-sous-titre">
            Ajoute tes services, ajuste la configuration, exporte un
            <code> docker-compose.yml</code> propre et validé.
          </p>
          <div className="hero-nom-projet">
            <label htmlFor="nom-projet">Nom du projet (compose)</label>
            <input
              id="nom-projet"
              type="text"
              placeholder="mon-projet"
              value={nomProjet}
              onChange={(e) => setNomProjet(e.target.value)}
            />
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-valeur">{services.length}</span>
              <span className="stat-label">conteneur{services.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="stat">
              <span className="stat-valeur">{nbPorts}</span>
              <span className="stat-label">port{nbPorts !== 1 ? 's' : ''} exposé{nbPorts !== 1 ? 's' : ''}</span>
            </div>
            <div className="stat">
              <span className="stat-valeur">{nbVolumes}</span>
              <span className="stat-label">volume{nbVolumes !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="guide-boutons">
            <button className="btn-discret btn-guide" onClick={() => setGuideUtilisationOuvert(true)}>
              📖 Guide d'utilisation
            </button>
            <button className="btn-discret btn-guide" onClick={() => setGuideInstallationOuvert(true)}>
              🐳 Installer Docker
            </button>
            <button className="btn-discret btn-guide" onClick={basculerTheme}>
              {theme === 'sombre' ? '☀️ Thème clair' : '🌙 Thème sombre'}
            </button>
          </div>
        </div>
      </header>

      <div className="projets-bandeau">
        <ProjectManager
          projets={etat.projets}
          actifId={projetActif.id}
          onChanger={changerProjet}
          onNouveau={nouveauProjet}
          onRenommer={renommerProjet}
          onDupliquer={dupliquerProjet}
          onSupprimer={supprimerProjet}
        />
      </div>

      <div className="stacks-bandeau">
        <StackPresets onCharger={chargerStack} />
        <div className="import-zone">
          <label className="btn-discret btn-import">
            📤 Importer un docker-compose.yml existant
            <input type="file" accept=".yml,.yaml" onChange={importerFichier} hidden />
          </label>
          {erreursImport.length > 0 && (
            <div className="bloc-avertissements import-erreurs">
              {erreursImport.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>
      </div>

      <div className="schema-bandeau">
        <div className="section-titre section-titre-avec-action">
          <div>
            <span className="section-tag">VUE D'ENSEMBLE</span>
            <h2>Vue d'ensemble</h2>
          </div>
          <button className="btn-discret" onClick={() => setSchemaOuvert((o) => !o)}>
            {schemaOuvert ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        {schemaOuvert && <SchemaNavire services={services} networks={networks} />}
      </div>

      <nav className="onglets">
        <button
          className={`onglet ${ongletActif === 'services' ? 'onglet-actif' : ''}`}
          onClick={() => setOngletActif('services')}
        >
          🐳 Services {services.length > 0 && <span className="badge-compteur">{services.length}</span>}
        </button>
        <button
          className={`onglet ${ongletActif === 'reseaux' ? 'onglet-actif' : ''}`}
          onClick={() => setOngletActif('reseaux')}
        >
          🔗 Réseaux {networks.length > 0 && <span className="badge-compteur">{networks.length}</span>}
        </button>
        <button
          className={`onglet ${ongletActif === 'apercu' ? 'onglet-actif' : ''}`}
          onClick={() => setOngletActif('apercu')}
        >
          📄 Aperçu
          {erreurs.length > 0 && <span className="badge-compteur badge-erreur">{erreurs.length}</span>}
        </button>
      </nav>

      <main className="app-main">
        {ongletActif === 'services' && (
          <>
            <div className="colonne">
              <ServiceForm
                key={projetActif.id}
                onAdd={ajouterService}
                servicesExistants={services.map((s) => s.name).filter(Boolean)}
                servicesActuels={services}
                networksDisponibles={networks}
              />
            </div>

            <div className="colonne">
              <div className="section-titre section-titre-avec-action">
                <div>
                  <span className="section-tag">SERVICES</span>
                  <h2>Conteneurs ({services.length})</h2>
                </div>
                {services.length > 0 && (
                  <button className="btn-discret" onClick={reinitialiser}>Tout effacer</button>
                )}
              </div>
              <ServiceList
                services={services}
                onRemove={supprimerService}
                onDuplicate={dupliquerService}
                onReorder={reordonnerServices}
              />
            </div>
          </>
        )}

        {ongletActif === 'reseaux' && (
          <div className="colonne colonne-pleine">
            <NetworkManager networks={networks} onAjouter={ajouterReseau} onSupprimer={supprimerReseau} />
            {networks.length > 0 && services.length > 0 && (
              <div className="reseaux-recap">
                <span className="section-tag">RÉPARTITION</span>
                <ul>
                  {networks.map((n) => (
                    <li key={n.nom}>
                      <strong>{n.nom}</strong> :{' '}
                      {services.filter((s) => (s.networks || []).includes(n.nom)).map((s) => s.name).join(', ') || (
                        <em>aucun service</em>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'apercu' && (
          <div className="colonne colonne-pleine">
            <Preview
              yaml={yaml}
              envFiles={envFiles}
              erreurs={erreurs}
              avertissements={avertissements}
              nbServices={services.length}
              extraireSecrets={extraireSecrets}
              onToggleSecrets={toggleExtraireSecrets}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>DockerForge — forgé localement, aucune donnée envoyée nulle part. Sauvegarde automatique dans ce navigateur.</span>
      </footer>

      <GuideUtilisationModal ouvert={guideUtilisationOuvert} onFermer={() => setGuideUtilisationOuvert(false)} />
      <GuideInstallationModal ouvert={guideInstallationOuvert} onFermer={() => setGuideInstallationOuvert(false)} />
    </div>
  )
}

export default App
