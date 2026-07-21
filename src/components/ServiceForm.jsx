import { useState, useEffect } from 'react'
import ImageCatalog from './ImageCatalog.jsx'
import Aide from './Aide.jsx'
import { POLITIQUES_RESTART, estSecret, genererMotDePasse } from '../core/generateur.js'
import { portsHoteUtilises, trouverPortLibre } from '../core/catalogue.js'

// Détecte une clé applicative type APP_KEY (Laravel/Firefly III...) qui a des
// contraintes de format particulières (longueur/encodage précis selon l'appli)
function estCleApplicative(cle) {
  const c = (cle || '').toLowerCase()
  return /^app_key$|_key$|^key$/.test(c) && !/api_key|apikey/.test(c)
}

const serviceVide = () => ({
  id: crypto.randomUUID(),
  name: '',
  image: '',
  ports: [{ host: '', container: '' }],
  volumes: [''],
  env: [{ key: '', value: '' }],
  restart: 'unless-stopped',
  dependsOn: [],
  networks: [],
  profiles: [],
  healthcheck: { enabled: false, test: '', interval: '30s', timeout: '5s', retries: 3 },
  memLimit: '',
  cpus: '',
  logMaxSize: '',
  logMaxFile: '',
  traefik: { active: false, domaine: '', port: '' },
})

// Formulaire d'ajout/édition d'un service Docker — 3 niveaux de complexité :
// essentiel (toujours visible), configuration (volumes/env, repliable),
// avancé (redémarrage/dépendances/réseaux/profils/santé/ressources, repliable)
function ServiceForm({ onAdd, servicesExistants, servicesActuels, networksDisponibles, serviceAEditer, onUpdate, onAnnulerEdition, secretsInclus, secretsExclus }) {
  const [service, setService] = useState(serviceVide())
  const [ouvertConfig, setOuvertConfig] = useState(false)
  const [ouvertAvance, setOuvertAvance] = useState(false)
  const [portAjuste, setPortAjuste] = useState(null)
  // true tant que le port affiché vient du catalogue (ou est vide) : dans ce cas,
  // cliquer une autre image du catalogue peut encore le mettre à jour. Passe à
  // false dès que la personne modifie le port à la main, pour ne plus l'écraser.
  const [portsAuto, setPortsAuto] = useState(true)

  const enEdition = !!serviceAEditer

  // Quand on demande à modifier un service (clic sur "Modifier" dans la
  // liste), on charge ses valeurs dans le formulaire. Quand on quitte le
  // mode édition (annulation ou validation), le formulaire redevient vide.
  useEffect(() => {
    if (serviceAEditer) {
      setService({ ...serviceVide(), ...serviceAEditer })
      setPortsAuto(false)
      if ((serviceAEditer.volumes || []).some((v) => v && v.trim() !== '') ||
          (serviceAEditer.env || []).some((e) => e.key && e.key.trim() !== '')) {
        setOuvertConfig(true)
      }
    } else {
      setService(serviceVide())
      setPortsAuto(true)
    }
  }, [serviceAEditer])

  function majChamp(champ, valeur) {
    setService((s) => ({ ...s, [champ]: valeur }))
  }

  function majHealthcheck(champ, valeur) {
    setService((s) => ({ ...s, healthcheck: { ...s.healthcheck, [champ]: valeur } }))
  }

  function majTraefik(champ, valeur) {
    setService((s) => ({
      ...s,
      traefik: { active: false, domaine: '', port: '', ...s.traefik, [champ]: valeur },
    }))
  }

  function choisirImage(item) {
    const utilises = portsHoteUtilises(servicesActuels || [])
    const portLibre = item.portDefaut ? trouverPortLibre(item.portDefaut, utilises) : ''
    setService((s) => ({
      ...s,
      image: item.image,
      name: s.name.trim() === '' ? item.suggestionNom : s.name,
      ports:
        item.portDefaut && portsAuto
          ? [{ host: String(portLibre), container: String(item.portDefaut) }]
          : s.ports,
      env:
        item.envDefaut && item.envDefaut.length > 0 &&
        s.env.length === 1 && !s.env[0].key && !s.env[0].value
          ? item.envDefaut.map((e) => ({ ...e }))
          : s.env,
      healthcheck:
        item.healthcheck && !s.healthcheck.test
          ? { ...s.healthcheck, test: item.healthcheck }
          : s.healthcheck,
    }))
    // Si l'image apporte des variables d'env, on ouvre la section pour que
    // le débutant les voie tout de suite plutôt que de les cacher.
    if (item.envDefaut && item.envDefaut.length > 0) setOuvertConfig(true)
  }

  function majPort(index, cle, valeur) {
    if (cle === 'host') setPortsAuto(false)
    const ports = [...service.ports]
    ports[index] = { ...ports[index], [cle]: valeur }
    setService((s) => ({ ...s, ports }))
  }

  function corrigerPortSiConflit(index) {
    const port = service.ports[index]
    if (!port.host) return
    // Un port non numérique (saisie corrompue, copier-coller...) n'a rien à
    // "corriger" ici : la validation du formulaire s'en charge déjà plus
    // bas. Sans ce garde-fou, Number("abc") vaut NaN, et NaN !== NaN étant
    // toujours vrai en JS, la ligne ci-dessous écrirait littéralement la
    // chaîne "NaN" dans le champ au lieu de laisser la saisie telle quelle.
    if (!Number.isFinite(Number(port.host))) return
    const utilises = portsHoteUtilises(servicesActuels || [])
    const portLibre = trouverPortLibre(port.host, utilises)
    if (portLibre !== Number(port.host)) {
      const ports = [...service.ports]
      ports[index] = { ...ports[index], host: String(portLibre) }
      setService((s) => ({ ...s, ports }))
      setPortAjuste(index)
      setTimeout(() => setPortAjuste(null), 2000)
    }
  }

  function ajouterPort() {
    setService((s) => ({ ...s, ports: [...s.ports, { host: '', container: '' }] }))
  }

  function supprimerPort(index) {
    setService((s) => ({ ...s, ports: s.ports.filter((_, i) => i !== index) }))
  }

  function majVolume(index, valeur) {
    const volumes = [...service.volumes]
    volumes[index] = valeur
    setService((s) => ({ ...s, volumes }))
  }

  function ajouterVolume() {
    setService((s) => ({ ...s, volumes: [...s.volumes, ''] }))
  }

  function supprimerVolume(index) {
    setService((s) => ({ ...s, volumes: s.volumes.filter((_, i) => i !== index) }))
  }

  function majEnv(index, cle, valeur) {
    const env = [...service.env]
    env[index] = { ...env[index], [cle]: valeur }
    setService((s) => ({ ...s, env }))
  }

  function ajouterEnv() {
    setService((s) => ({ ...s, env: [...s.env, { key: '', value: '' }] }))
  }

  function supprimerEnv(index) {
    setService((s) => ({ ...s, env: s.env.filter((_, i) => i !== index) }))
  }

  function toggleDependance(nom) {
    setService((s) => {
      const deja = s.dependsOn.includes(nom)
      return { ...s, dependsOn: deja ? s.dependsOn.filter((d) => d !== nom) : [...s.dependsOn, nom] }
    })
  }

  function toggleReseau(nom) {
    setService((s) => {
      const deja = s.networks.includes(nom)
      return { ...s, networks: deja ? s.networks.filter((n) => n !== nom) : [...s.networks, nom] }
    })
  }

  function toggleProfil(nom) {
    setService((s) => {
      const deja = s.profiles.includes(nom)
      return { ...s, profiles: deja ? s.profiles.filter((p) => p !== nom) : [...s.profiles, nom] }
    })
  }

  function soumettre(e) {
    e.preventDefault()
    if (!service.name.trim() || !service.image.trim()) return
    if (enEdition) {
      onUpdate(service)
    } else {
      onAdd(service)
      setService(serviceVide())
      setPortsAuto(true)
    }
  }

  const volumesRemplis = service.volumes.filter((v) => v.trim() !== '').length
  const envRemplis = service.env.filter((e) => e.key.trim() !== '').length

  return (
    <form className="service-form" onSubmit={soumettre}>
      <div className="form-tete">
        <span className="form-tag">{enEdition ? 'MODIFICATION' : 'NOUVEAU CONTENEUR'}</span>
        <h2>{enEdition ? `Modifier « ${serviceAEditer.name} »` : 'Ajouter un service'}</h2>
      </div>

      <ImageCatalog onChoisir={choisirImage} />

      <label>
        <span className="label-avec-aide">
          Nom du service
          <Aide texte="Identifiant du conteneur dans ton projet (ex: web, db). Utilisé aussi comme nom d'hôte : un autre conteneur peut y accéder via ce nom." />
        </span>
        <input
          type="text"
          placeholder="ex: web, db, redis..."
          value={service.name}
          onChange={(e) => majChamp('name', e.target.value)}
          required
        />
      </label>

      <label>
        <span className="label-avec-aide">
          Image Docker
          <Aide texte="Le modèle du conteneur, publié sur Docker Hub. Format : nom:version (ex: nginx:latest = toujours la dernière version stable)." />
        </span>
        <input
          type="text"
          placeholder="ex: nginx:latest, postgres:16"
          value={service.image}
          onChange={(e) => majChamp('image', e.target.value)}
          required
        />
      </label>

      <fieldset>
        <legend>
          <span className="label-avec-aide">
            Ports (hôte → conteneur)
            <Aide texte="Le port hôte est celui que tu utilises depuis ton navigateur (ex: localhost:8080). Le port conteneur est celui que l'appli écoute à l'intérieur — souvent fixé par l'image, ne le change pas au hasard." />
          </span>
        </legend>
        {service.ports.map((p, i) => (
          <div className="ligne-champ" key={i}>
            <input
              type="number"
              placeholder="Port hôte, ex: 8080"
              value={p.host}
              onChange={(e) => majPort(i, 'host', e.target.value)}
              onBlur={() => corrigerPortSiConflit(i)}
            />
            {portAjuste === i && <span className="port-ajuste">décalé ✓</span>}
            <span className="fleche">→</span>
            <input
              type="number"
              placeholder="Port conteneur, ex: 80"
              value={p.container}
              onChange={(e) => majPort(i, 'container', e.target.value)}
            />
            {service.ports.length > 1 && (
              <button type="button" className="btn-icone" onClick={() => supprimerPort(i)}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn-discret" onClick={ajouterPort}>+ Ajouter un port</button>
      </fieldset>

      <button
        type="button"
        className="btn-discret btn-avance"
        onClick={() => setOuvertConfig((o) => !o)}
      >
        {ouvertConfig ? '▾' : '▸'} Volumes et variables d'environnement
        {!ouvertConfig && (volumesRemplis > 0 || envRemplis > 0) && (
          <span className="badge-compteur">{volumesRemplis + envRemplis}</span>
        )}
      </button>

      {ouvertConfig && (
        <>
          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Volumes
                <Aide texte="Un volume relie un dossier de ton PC à un dossier du conteneur, pour que les données survivent même si le conteneur est supprimé. Format : ./dossier-local:/dossier-dans-le-conteneur" />
              </span>
            </legend>
            {service.volumes.map((v, i) => (
              <div className="ligne-champ" key={i}>
                <input
                  type="text"
                  placeholder="ex: ./data:/var/lib/mysql"
                  value={v}
                  onChange={(e) => majVolume(i, e.target.value)}
                />
                {service.volumes.length > 1 && (
                  <button type="button" className="btn-icone" onClick={() => supprimerVolume(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-discret" onClick={ajouterVolume}>+ Ajouter un volume</button>
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Variables d'environnement
                <Aide texte="Des réglages passés au conteneur au démarrage (mots de passe, options...). Chaque image documente les siennes sur Docker Hub." />
              </span>
            </legend>
            {service.env.map((e2, i) => (
              <div className="ligne-champ" key={i}>
                <input
                  type="text"
                  placeholder="CLE"
                  value={e2.key}
                  onChange={(e) => majEnv(i, 'key', e.target.value)}
                />
                <span className="fleche">=</span>
                <input
                  type="text"
                  placeholder="valeur"
                  value={e2.value}
                  onChange={(e) => majEnv(i, 'value', e.target.value)}
                />
                {estCleApplicative(e2.key) && (
                  <Aide texte="Cette clé n'est pas un simple mot de passe : c'est une clé de chiffrement propre à l'application (souvent 32 caractères encodés en base64). Le bouton 🎲 génère une valeur aléatoire de bonne longueur pour démarrer, mais vérifie la doc Docker Hub de l'image : certaines applis exigent un format précis (ex: préfixe 'base64:', ou une commande dédiée comme 'php artisan key:generate') et refuseront de démarrer sinon." />
                )}
                {estSecret(e2.key, { inclusions: secretsInclus, exclusions: secretsExclus }) && (
                  <button
                    type="button"
                    className="btn-icone"
                    title="Générer une valeur aléatoire sécurisée"
                    onClick={() => majEnv(i, 'value', genererMotDePasse())}
                  >
                    🎲
                  </button>
                )}
                {service.env.length > 1 && (
                  <button type="button" className="btn-icone" onClick={() => supprimerEnv(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-discret" onClick={ajouterEnv}>+ Ajouter une variable</button>
          </fieldset>
        </>
      )}

      <button type="button" className="btn-discret btn-avance" onClick={() => setOuvertAvance((o) => !o)}>
        {ouvertAvance ? '▾' : '▸'} Options avancées (redémarrage, dépendances, réseaux, profils, santé, ressources)
      </button>

      {ouvertAvance && (
        <>
          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Redémarrage
                <Aide texte="Que faire si le conteneur plante ou si la machine redémarre. « Sauf arrêt manuel » est le bon choix par défaut : il repart tout seul sauf si tu l'as arrêté volontairement." />
              </span>
            </legend>
            <select value={service.restart} onChange={(e) => majChamp('restart', e.target.value)}>
              {POLITIQUES_RESTART.map((p) => (
                <option key={p.valeur} value={p.valeur}>{p.label}</option>
              ))}
            </select>

            {servicesExistants.length > 0 && (
              <>
                <legend style={{ marginTop: '0.8rem' }}>
                  <span className="label-avec-aide">
                    Dépend de
                    <Aide texte="Ce service démarrera après ceux que tu sélectionnes ici (utile si ton appli a besoin que sa base de données soit déjà lancée)." />
                  </span>
                </legend>
                <div className="chips-dependances">
                  {servicesExistants.map((nom) => (
                    <button
                      type="button"
                      key={nom}
                      className={`chip ${service.dependsOn.includes(nom) ? 'chip-actif' : ''}`}
                      onClick={() => toggleDependance(nom)}
                    >
                      {nom}
                    </button>
                  ))}
                </div>
              </>
            )}
          </fieldset>

          {networksDisponibles && networksDisponibles.length > 0 && (
            <fieldset>
              <legend>
                <span className="label-avec-aide">
                  Réseaux
                  <Aide texte="Place ce service sur un ou plusieurs réseaux personnalisés pour l'isoler des autres conteneurs (ex: mettre la base de données seule avec l'appli, sans exposer au reste)." />
                </span>
              </legend>
              <div className="chips-dependances">
                {networksDisponibles.map((n) => (
                  <button
                    type="button"
                    key={n.nom}
                    className={`chip ${service.networks.includes(n.nom) ? 'chip-actif' : ''}`}
                    onClick={() => toggleReseau(n.nom)}
                  >
                    {n.nom}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Profils
                <Aide texte="Un service avec un profil ne démarre pas avec un simple « docker compose up » — il faut préciser --profile nom. Pratique pour des outils optionnels (debug, seed de données...)." />
              </span>
            </legend>
            <div className="chips-dependances">
              {['dev', 'prod', 'debug', 'test'].map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`chip ${service.profiles.includes(p) ? 'chip-actif' : ''}`}
                  onClick={() => toggleProfil(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            {service.profiles.length > 0 && (
              <p className="reseaux-aide" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                Ce service ne démarrera qu'avec <code>docker compose --profile {service.profiles[0]} up</code>
                {service.profiles.length > 1 ? ' (ou un des autres profils choisis)' : ''}.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Vérification de santé
                <Aide texte="Docker vérifie régulièrement que le conteneur répond bien, pas juste qu'il est démarré. Utile avec « depends_on » pour attendre qu'une base de données soit vraiment prête." />
              </span>
            </legend>
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={service.healthcheck.enabled}
                onChange={(e) => majHealthcheck('enabled', e.target.checked)}
              />
              Activer la vérification de santé du conteneur
            </label>
            {service.healthcheck.enabled && (
              <>
                <input
                  type="text"
                  placeholder="ex: curl -f http://localhost/ || exit 1"
                  value={service.healthcheck.test}
                  onChange={(e) => majHealthcheck('test', e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                />
                <div className="ligne-champ" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Intervalle (30s)"
                    value={service.healthcheck.interval}
                    onChange={(e) => majHealthcheck('interval', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Timeout (5s)"
                    value={service.healthcheck.timeout}
                    onChange={(e) => majHealthcheck('timeout', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Essais (3)"
                    value={service.healthcheck.retries}
                    onChange={(e) => majHealthcheck('retries', e.target.value)}
                  />
                </div>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Limites de ressources
                <Aide texte="Empêche ce conteneur de consommer toute la RAM/CPU de ta machine. Optionnel, utile si tu fais tourner beaucoup de conteneurs en même temps." />
              </span>
            </legend>
            <div className="ligne-champ">
              <input
                type="text"
                placeholder="RAM max, ex: 512m"
                value={service.memLimit}
                onChange={(e) => majChamp('memLimit', e.target.value)}
              />
              <input
                type="text"
                placeholder="CPU max, ex: 0.5"
                value={service.cpus}
                onChange={(e) => majChamp('cpus', e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Rotation des logs
                <Aide texte="Sans limite, les logs d'un conteneur peuvent grossir indéfiniment et remplir le disque avec le temps (driver json-file par défaut). Optionnel, recommandé pour un service qui tourne longtemps en production." />
              </span>
            </legend>
            <div className="ligne-champ">
              <input
                type="text"
                placeholder="Taille max par fichier, ex: 10m"
                value={service.logMaxSize}
                onChange={(e) => majChamp('logMaxSize', e.target.value)}
              />
              <input
                type="text"
                placeholder="Nb de fichiers conservés, ex: 3"
                value={service.logMaxFile}
                onChange={(e) => majChamp('logMaxFile', e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                Reverse proxy (Traefik)
                <Aide texte="Génère automatiquement les labels Docker lus par Traefik pour router le trafic vers ce service par nom de domaine, avec HTTPS automatique (Let's Encrypt). Suppose qu'un conteneur Traefik tourne déjà sur le même réseau Docker (voir la stack « Traefik » prête à charger)." />
              </span>
            </legend>
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={!!service.traefik?.active}
                onChange={(e) => majTraefik('active', e.target.checked)}
              />
              Exposer ce service via Traefik
            </label>
            {service.traefik?.active && (
              <div className="ligne-champ" style={{ marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Nom de domaine, ex: app.mondomaine.fr"
                  value={service.traefik?.domaine || ''}
                  onChange={(e) => majTraefik('domaine', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Port interne (auto si vide)"
                  value={service.traefik?.port || ''}
                  onChange={(e) => majTraefik('port', e.target.value)}
                />
              </div>
            )}
          </fieldset>
        </>
      )}

      <div className="actions-formulaire">
        <button type="submit" className="btn-principal">
          {enEdition ? '✓ Enregistrer les modifications' : '+ Ajouter ce conteneur'}
        </button>
        {enEdition && (
          <button type="button" className="btn-discret" onClick={onAnnulerEdition}>Annuler</button>
        )}
      </div>
    </form>
  )
}

export default ServiceForm
