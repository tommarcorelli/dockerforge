import { useState, useMemo, useEffect, useRef } from 'react'
import ServiceForm from './components/ServiceForm.jsx'
import ServiceList from './components/ServiceList.jsx'
import Preview from './components/Preview.jsx'
import StackPresets from './components/StackPresets.jsx'
import NetworkManager from './components/NetworkManager.jsx'
import GuideUtilisationModal from './components/GuideUtilisationModal.jsx'
import GuideInstallationModal from './components/GuideInstallationModal.jsx'
import ProjectManager from './components/ProjectManager.jsx'
import { buildDockerCompose, validerServices, buildEnvFiles, buildDockerRunScript, buildKubernetesManifests, suggererDependancesManquantes, auditSecurite, estSecret, genererMotDePasse, estValeurFaible } from './core/generateur.js'
import { portsHoteUtilises, trouverPortLibre } from './core/catalogue.js'
import { construireStack } from './core/stacks.js'
import { importerDockerCompose } from './core/importateur.js'
import { chargerProjets, sauvegarderProjets, projetVide, exporterProjet, importerProjet } from './core/projets.js'
import { chargerModeles, ajouterModele, supprimerModele, instancierModele } from './core/modeles.js'
import MesModeles from './components/MesModeles.jsx'
import { siDocker } from 'simple-icons'
import Icon from './components/Icon.jsx'
import SchemaNavire from './components/SchemaNavire.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import ShortcutsModal from './components/ShortcutsModal.jsx'

// App.jsx — composant racine de DockerForge
function App() {
  const [etat, setEtat] = useState(chargerProjets)
  const [erreursImport, setErreursImport] = useState([])
  const [schemaOuvert, setSchemaOuvert] = useState(true)
  const [guideUtilisationOuvert, setGuideUtilisationOuvert] = useState(false)
  const [guideInstallationOuvert, setGuideInstallationOuvert] = useState(false)
  const [ongletActif, setOngletActif] = useState('services')
  const [serviceEnEditionId, setServiceEnEditionId] = useState(null)
  const [undo, setUndo] = useState(null)
  const undoTimeoutRef = useRef(null)
  const [paletteOuverte, setPaletteOuverte] = useState(false)
  const [raccourcisOuverts, setRaccourcisOuverts] = useState(false)

  // Déclenche un toast "annuler" après une suppression : garde l'action de
  // restauration en mémoire pendant quelques secondes avant de l'oublier.
  function declencherUndo(message, restaurer) {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    setUndo({ message, restaurer })
    undoTimeoutRef.current = setTimeout(() => setUndo(null), 7000)
  }

  function annulerDerniereAction() {
    if (!undo) return
    undo.restaurer()
    setUndo(null)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
  }

  useEffect(() => () => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
  }, [])
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('dockerforge_theme') || 'clair'
    } catch {
      return 'clair'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('dockerforge_theme', theme)
    } catch (err) {
      console.error('DockerForge — impossible de mémoriser le thème :', err)
    }
  }, [theme])

  function basculerTheme() {
    setTheme((t) => (t === 'sombre' ? 'clair' : 'sombre'))
  }

  const projetActif = etat.projets.find((p) => p.id === etat.actifId) || etat.projets[0]
  const { services, networks, nomProjet, extraireSecrets } = projetActif
  // Valeurs par défaut pour les projets sauvegardés avant l'ajout de cette
  // fonctionnalité (absentes du localStorage existant).
  const secretsInclus = projetActif.secretsInclus || []
  const secretsExclus = projetActif.secretsExclus || []

  useEffect(() => {
    sauvegarderProjets(etat)
  }, [etat])

  // Quitte le mode édition si on change de projet (un service d'un autre
  // projet n'a pas de sens à modifier dans le formulaire actuel).
  useEffect(() => {
    setServiceEnEditionId(null)
  }, [projetActif.id])

  // Comme patcherProjetActif, mais cible un projet précis par id — utile pour
  // restaurer une suppression via "Annuler" même si l'utilisateur a changé
  // de projet entre-temps.
  function patcherProjet(id, patch) {
    setEtat((e) => ({
      ...e,
      projets: e.projets.map((p) =>
        p.id === id
          ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch), majLe: Date.now() }
          : p
      ),
    }))
  }

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

  // Télécharge le projet actif dans un fichier .json — pratique pour le
  // sauvegarder ailleurs que dans le localStorage du navigateur, ou le
  // transférer sur une autre machine (contrairement au docker-compose.yml,
  // ce format garde aussi les couleurs/notes/état d'avancement internes).
  function exporterProjetActuel() {
    const donnees = exporterProjet(projetActif)
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = (projetActif.nom || 'projet').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'projet'
    a.href = url
    a.download = `${slug}.dockerforge.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importerProjetFichier(e) {
    const fichier = e.target.files[0]
    if (!fichier) return
    const lecteur = new FileReader()
    // Même protection que pour l'import de docker-compose.yml : sans
    // onerror, un échec de lecture du fichier ne déclenche jamais onload et
    // laisse l'import échouer en silence.
    lecteur.onerror = () => {
      setErreursImport(["Impossible de lire ce fichier (déplacé, supprimé, ou accès refusé depuis la sélection)."])
    }
    lecteur.onload = () => {
      try {
        const donnees = JSON.parse(lecteur.result)
        const projet = importerProjet(donnees)
        setEtat((prev) => ({ ...prev, projets: [...prev.projets, projet], actifId: projet.id }))
        setErreursImport([])
      } catch (err) {
        setErreursImport([err.message || "Impossible de lire ce fichier JSON."])
      }
    }
    lecteur.readAsText(fichier)
    e.target.value = ''
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

  function basculerReseauInterne(nom) {
    patcherProjetActif((p) => ({
      networks: p.networks.map((n) => (n.nom === nom ? { ...n, interne: !n.interne } : n)),
    }))
  }

  // --- Import ---

  function importerFichier(e) {
    const fichier = e.target.files[0]
    if (!fichier) return
    const lecteur = new FileReader()
    // Sans ce gestionnaire, un échec de lecture (fichier déplacé/supprimé
    // entre la sélection et la lecture, accès refusé...) ne déclenchait
    // jamais onload : l'import échouait en silence, sans le moindre
    // message pour la personne qui vient de cliquer sur "Importer".
    lecteur.onerror = () => {
      setErreursImport(["Impossible de lire ce fichier (déplacé, supprimé, ou accès refusé depuis la sélection)."])
    }
    lecteur.onload = () => {
      const { services: importes, networks: networksImportes, erreurs } = importerDockerCompose(lecteur.result)
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
          // Les réseaux importés qui n'existent pas déjà dans ce projet sont
          // ajoutés ; ceux qui portent un nom déjà utilisé gardent la
          // définition existante du projet (on ne l'écrase pas).
          const nomsExistants = new Set(p.networks.map((n) => n.nom))
          const nouveauxReseaux = (networksImportes || []).filter((n) => !nomsExistants.has(n.nom))
          return { services: [...p.services, ...ajustes], networks: [...p.networks, ...nouveauxReseaux] }
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
    const projetCourantId = etat.actifId
    const index = services.findIndex((s) => s.id === id)
    const service = services[index]
    if (!service) return
    patcherProjetActif((p) => ({ services: p.services.filter((s) => s.id !== id) }))
    if (id === serviceEnEditionId) setServiceEnEditionId(null)
    declencherUndo(`Service « ${service.name || 'sans nom'} » supprimé`, () => {
      patcherProjet(projetCourantId, (p) => {
        const liste = [...p.services]
        liste.splice(Math.min(index, liste.length), 0, service)
        return { services: liste }
      })
    })
  }

  function demarrerEdition(id) {
    setServiceEnEditionId(id)
  }

  function annulerEdition() {
    setServiceEnEditionId(null)
  }

  function modifierService(serviceModifie) {
    patcherProjetActif((p) => {
      const ancien = p.services.find((s) => s.id === serviceEnEditionId)
      const nomChange = ancien && ancien.name !== serviceModifie.name
      return {
        services: p.services.map((s) => {
          if (s.id === serviceEnEditionId) return { ...serviceModifie, id: s.id }
          // Si le nom a changé, les autres services qui dépendaient de
          // l'ancien nom doivent suivre — sinon leur "depends_on" pointerait
          // vers un service qui n'existe plus dans le docker-compose.yml.
          if (nomChange && (s.dependsOn || []).includes(ancien.name)) {
            return { ...s, dependsOn: s.dependsOn.map((d) => (d === ancien.name ? serviceModifie.name : d)) }
          }
          return s
        }),
      }
    })
    setServiceEnEditionId(null)
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

  const [modeles, setModeles] = useState(() => chargerModeles())

  function enregistrerModele(service, nom) {
    setModeles(ajouterModele(service, nom))
  }

  function supprimerModeleParId(id) {
    setModeles(supprimerModele(id))
  }

  function chargerModeleDansProjet(modele) {
    patcherProjetActif((p) => {
      const utilises = portsHoteUtilises(p.services)
      const nouveau = instancierModele(modele, utilises)
      return { services: [...p.services, nouveau] }
    })
  }

  function reinitialiser() {
    if (services.length === 0) return
    const projetCourantId = etat.actifId
    const servicesSauvegardes = services
    patcherProjetActif({ services: [] })
    declencherUndo(
      `Liste vidée (${servicesSauvegardes.length} conteneur${servicesSauvegardes.length > 1 ? 's' : ''})`,
      // On préfixe par la liste sauvegardée plutôt que de l'imposer telle
      // quelle : si un service a été rajouté entre le "Tout effacer" et le
      // clic sur "Annuler", il ne doit pas disparaître.
      () => patcherProjet(projetCourantId, (p) => ({ services: [...servicesSauvegardes, ...p.services] }))
    )
  }

  // Parcourt tous les services du projet actif et régénère un mot de passe
  // aléatoire robuste pour chaque variable sensible dont la valeur est
  // vide ou un mot de passe d'exemple connu (change_moi, admin...) — sans
  // toucher aux valeurs déjà personnalisées par la personne.
  function securiserTousLesSecrets() {
    const projetCourantId = etat.actifId
    const servicesAvant = services
    let nbChanges = 0
    const servicesApres = services.map((s) => {
      const env = (s.env || []).map((e) => {
        if (estSecret(e.key, { inclusions: secretsInclus, exclusions: secretsExclus }) && estValeurFaible(e.value)) {
          nbChanges += 1
          return { ...e, value: genererMotDePasse() }
        }
        return e
      })
      return { ...s, env }
    })
    if (nbChanges === 0) {
      declencherUndo('Aucun mot de passe faible trouvé — tout est déjà personnalisé.', () => {})
      return
    }
    patcherProjetActif({ services: servicesApres })
    declencherUndo(
      `${nbChanges} mot${nbChanges > 1 ? 's de passe' : ' de passe'} sécurisé${nbChanges > 1 ? 's' : ''} — pense à les reporter dans ta configuration si besoin.`,
      () => patcherProjet(projetCourantId, () => ({ services: servicesAvant }))
    )
  }

  function setNomProjet(valeur) {
    patcherProjetActif({ nomProjet: valeur })
  }

  function toggleExtraireSecrets() {
    patcherProjetActif((p) => ({ extraireSecrets: !p.extraireSecrets }))
  }

  // Une clé ne peut appartenir qu'à une seule des deux listes à la fois —
  // l'ajouter à l'une la retire automatiquement de l'autre.
  function ajouterInclusionSecret(cle) {
    patcherProjetActif((p) => ({
      secretsInclus: (p.secretsInclus || []).includes(cle) ? p.secretsInclus : [...(p.secretsInclus || []), cle],
      secretsExclus: (p.secretsExclus || []).filter((c) => c !== cle),
    }))
  }

  function supprimerInclusionSecret(cle) {
    patcherProjetActif((p) => ({ secretsInclus: (p.secretsInclus || []).filter((c) => c !== cle) }))
  }

  function ajouterExclusionSecret(cle) {
    patcherProjetActif((p) => ({
      secretsExclus: (p.secretsExclus || []).includes(cle) ? p.secretsExclus : [...(p.secretsExclus || []), cle],
      secretsInclus: (p.secretsInclus || []).filter((c) => c !== cle),
    }))
  }

  function supprimerExclusionSecret(cle) {
    patcherProjetActif((p) => ({ secretsExclus: (p.secretsExclus || []).filter((c) => c !== cle) }))
  }

  // --- Dérivés ---

  const { erreurs, avertissements } = useMemo(
    () => validerServices(services, { extraireSecrets, secretsInclus, secretsExclus }),
    [services, extraireSecrets, secretsInclus, secretsExclus]
  )
  const suggestions = useMemo(() => suggererDependancesManquantes(services), [services])
  const audit = useMemo(
    () => auditSecurite(services, { extraireSecrets, secretsInclus, secretsExclus }),
    [services, extraireSecrets, secretsInclus, secretsExclus]
  )
  const yaml = useMemo(
    () => buildDockerCompose(services, { extraireSecrets, networks, nomProjet, secretsInclus, secretsExclus }),
    [services, extraireSecrets, networks, nomProjet, secretsInclus, secretsExclus]
  )
  const envFiles = useMemo(
    () => (extraireSecrets ? buildEnvFiles(services, { secretsInclus, secretsExclus }) : []),
    [services, extraireSecrets, secretsInclus, secretsExclus]
  )
  const dockerRunScript = useMemo(
    () => buildDockerRunScript(services, { extraireSecrets, networks, secretsInclus, secretsExclus }),
    [services, extraireSecrets, networks, secretsInclus, secretsExclus]
  )
  const k8sManifests = useMemo(
    () => buildKubernetesManifests(services, { extraireSecrets, secretsInclus, secretsExclus }),
    [services, extraireSecrets, secretsInclus, secretsExclus]
  )

  const nbPorts = services.reduce(
    (acc, s) => acc + (s.ports || []).filter((p) => p.host && p.container).length,
    0
  )
  const nbVolumes = services.reduce(
    (acc, s) => acc + (s.volumes || []).filter((v) => v && v.trim() !== '').length,
    0
  )

  function telechargerComposeRapide() {
    if (services.length === 0) return
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'docker-compose.yml'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Raccourcis clavier : Ctrl/Cmd+S télécharge le docker-compose.yml direct
  // (sans avoir à aller cliquer dans l'onglet Aperçu), Échap annule l'édition
  // en cours ou ferme un guide ouvert — dans cet ordre de priorité.
  useEffect(() => {
    function onKeyDown(e) {
      const ctrlOuCmd = e.ctrlKey || e.metaKey
      const cibleEstUnChamp = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable
      if (ctrlOuCmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOuverte((o) => !o)
      } else if (ctrlOuCmd && e.key.toLowerCase() === 's') {
        e.preventDefault()
        telechargerComposeRapide()
      } else if (e.key === '?' && !cibleEstUnChamp) {
        e.preventDefault()
        setRaccourcisOuverts((o) => !o)
      } else if (e.key === 'Escape') {
        if (paletteOuverte) setPaletteOuverte(false)
        else if (raccourcisOuverts) setRaccourcisOuverts(false)
        else if (serviceEnEditionId) annulerEdition()
        else if (guideUtilisationOuvert) setGuideUtilisationOuvert(false)
        else if (guideInstallationOuvert) setGuideInstallationOuvert(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [yaml, services.length, serviceEnEditionId, guideUtilisationOuvert, guideInstallationOuvert, paletteOuverte, raccourcisOuverts])

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
            <button className="btn-discret btn-guide" onClick={() => setPaletteOuverte(true)}>
              ⌘K Palette de commandes
            </button>
            <button className="btn-discret btn-guide" onClick={() => setRaccourcisOuverts(true)}>
              ⌨️ Raccourcis
            </button>
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
          onExporter={exporterProjetActuel}
          onImporterFichier={importerProjetFichier}
        />
      </div>

      <div className="stacks-bandeau">
        <StackPresets onCharger={chargerStack} />
        <MesModeles modeles={modeles} onCharger={chargerModeleDansProjet} onSupprimer={supprimerModeleParId} />
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
                servicesExistants={services
                  .filter((s) => s.id !== serviceEnEditionId)
                  .map((s) => s.name)
                  .filter(Boolean)}
                servicesActuels={services.filter((s) => s.id !== serviceEnEditionId)}
                networksDisponibles={networks}
                serviceAEditer={services.find((s) => s.id === serviceEnEditionId) || null}
                onUpdate={modifierService}
                onAnnulerEdition={annulerEdition}
                secretsInclus={secretsInclus}
                secretsExclus={secretsExclus}
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
                onEdit={demarrerEdition}
                idEnEdition={serviceEnEditionId}
                onEnregistrerModele={enregistrerModele}
              />
            </div>
          </>
        )}

        {ongletActif === 'reseaux' && (
          <div className="colonne colonne-pleine">
            <NetworkManager networks={networks} onAjouter={ajouterReseau} onSupprimer={supprimerReseau} onBasculerInterne={basculerReseauInterne} />
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
              dockerRunScript={dockerRunScript}
              k8sManifests={k8sManifests}
              envFiles={envFiles}
              erreurs={erreurs}
              avertissements={avertissements}
              suggestions={suggestions}
              audit={audit}
              nbServices={services.length}
              extraireSecrets={extraireSecrets}
              onToggleSecrets={toggleExtraireSecrets}
              secretsInclus={secretsInclus}
              secretsExclus={secretsExclus}
              onAjouterInclusion={ajouterInclusionSecret}
              onSupprimerInclusion={supprimerInclusionSecret}
              onAjouterExclusion={ajouterExclusionSecret}
              onSupprimerExclusion={supprimerExclusionSecret}
              onSecuriserSecrets={securiserTousLesSecrets}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span>DockerForge — forgé localement, aucune donnée envoyée nulle part. Sauvegarde automatique dans ce navigateur.</span>
      </footer>

      <GuideUtilisationModal ouvert={guideUtilisationOuvert} onFermer={() => setGuideUtilisationOuvert(false)} />
      <GuideInstallationModal ouvert={guideInstallationOuvert} onFermer={() => setGuideInstallationOuvert(false)} />

      <ShortcutsModal ouvert={raccourcisOuverts} onFermer={() => setRaccourcisOuverts(false)} />

      <CommandPalette
        ouvert={paletteOuverte}
        onFermer={() => setPaletteOuverte(false)}
        onChargerStack={chargerStack}
        onNaviguerOnglet={setOngletActif}
        onNouveauProjet={nouveauProjet}
        onBasculerTheme={basculerTheme}
        onTelechargerCompose={telechargerComposeRapide}
        onToutEffacer={reinitialiser}
        onOuvrirRaccourcis={() => setRaccourcisOuverts(true)}
        onSecuriserSecrets={securiserTousLesSecrets}
      />

      {undo && (
        <div className="toast-undo" role="status">
          <span>{undo.message}</span>
          <button className="btn-discret" onClick={annulerDerniereAction}>↺ Annuler</button>
        </div>
      )}
    </div>
  )
}

export default App
