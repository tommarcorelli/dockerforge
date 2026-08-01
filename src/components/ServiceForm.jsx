import { useState, useEffect } from 'react'
import ImageCatalog from './ImageCatalog.jsx'
import Aide from './Aide.jsx'
import { POLITIQUES_RESTART, estSecret, genererMotDePasse } from '../core/generateur.js'
import { portsHoteUtilises, trouverPortLibre } from '../core/catalogue.js'
import { useLangue } from '../core/i18n.js'

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
  command: '',
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
  security: { readOnly: false, noNewPrivileges: false, dropAllCaps: false, capAdd: '', user: '', init: false },
  stopGracePeriod: '',
  extraHosts: [''],
  tmpfs: [''],
})

// Formulaire d'ajout/édition d'un service Docker — 3 niveaux de complexité :
// essentiel (toujours visible), configuration (volumes/env, repliable),
// avancé (redémarrage/dépendances/réseaux/profils/santé/ressources, repliable)
function ServiceForm({ onAdd, servicesExistants, servicesActuels, networksDisponibles, serviceAEditer, onUpdate, onAnnulerEdition, secretsInclus, secretsExclus }) {
  const { t } = useLangue()
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
      const securityBrut = serviceAEditer.security || {}
      setService({
        ...serviceVide(),
        ...serviceAEditer,
        security: {
          readOnly: !!securityBrut.readOnly,
          noNewPrivileges: !!securityBrut.noNewPrivileges,
          dropAllCaps: !!securityBrut.dropAllCaps,
          capAdd: Array.isArray(securityBrut.capAdd) ? securityBrut.capAdd.join(', ') : (securityBrut.capAdd || ''),
          user: securityBrut.user || '',
          init: !!securityBrut.init,
        },
        extraHosts: (serviceAEditer.extraHosts && serviceAEditer.extraHosts.length > 0) ? serviceAEditer.extraHosts : [''],
        tmpfs: (serviceAEditer.tmpfs && serviceAEditer.tmpfs.length > 0) ? serviceAEditer.tmpfs : [''],
      })
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

  function majSecurity(champ, valeur) {
    setService((s) => ({
      ...s,
      security: { readOnly: false, noNewPrivileges: false, dropAllCaps: false, capAdd: '', user: '', init: false, ...s.security, [champ]: valeur },
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
      command:
        item.commandeDefaut && !s.command
          ? item.commandeDefaut
          : s.command,
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

  function majExtraHost(index, valeur) {
    const extraHosts = [...(service.extraHosts || [''])]
    extraHosts[index] = valeur
    setService((s) => ({ ...s, extraHosts }))
  }

  function ajouterExtraHost() {
    setService((s) => ({ ...s, extraHosts: [...(s.extraHosts || ['']), ''] }))
  }

  function supprimerExtraHost(index) {
    setService((s) => ({ ...s, extraHosts: (s.extraHosts || ['']).filter((_, i) => i !== index) }))
  }

  function majTmpfs(index, valeur) {
    const tmpfs = [...(service.tmpfs || [''])]
    tmpfs[index] = valeur
    setService((s) => ({ ...s, tmpfs }))
  }

  function ajouterTmpfs() {
    setService((s) => ({ ...s, tmpfs: [...(s.tmpfs || ['']), ''] }))
  }

  function supprimerTmpfs(index) {
    setService((s) => ({ ...s, tmpfs: (s.tmpfs || ['']).filter((_, i) => i !== index) }))
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
    const aEnvoyer = {
      ...service,
      security: {
        ...service.security,
        capAdd: String(service.security?.capAdd || '')
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      },
      extraHosts: (service.extraHosts || []).filter((h) => h && h.trim() !== ''),
      tmpfs: (service.tmpfs || []).filter((t) => t && t.trim() !== ''),
    }
    if (enEdition) {
      onUpdate(aEnvoyer)
    } else {
      onAdd(aEnvoyer)
      setService(serviceVide())
      setPortsAuto(true)
    }
  }

  const volumesRemplis = service.volumes.filter((v) => v.trim() !== '').length
  const envRemplis = service.env.filter((e) => e.key.trim() !== '').length

  return (
    <form className="service-form" onSubmit={soumettre}>
      <div className="form-tete">
        <span className="form-tag">{enEdition ? t('sf.modification') : t('sf.nouveauConteneur')}</span>
        <h2>{enEdition ? `${t('sf.modifierTitre')} « ${serviceAEditer.name} »` : t('section.ajouterService')}</h2>
      </div>

      <ImageCatalog onChoisir={choisirImage} />

      <label>
        <span className="label-avec-aide">
          {t('sf.nomService')}
          <Aide texte={t('sf.nomServiceAide')} />
        </span>
        <input
          type="text"
          placeholder={t('sf.nomServicePlaceholder')}
          value={service.name}
          onChange={(e) => majChamp('name', e.target.value)}
          required
        />
      </label>

      <label>
        <span className="label-avec-aide">
          {t('sf.imageDocker')}
          <Aide texte={t('sf.imageDockerAide')} />
        </span>
        <input
          type="text"
          placeholder={t('sf.imageDockerPlaceholder')}
          value={service.image}
          onChange={(e) => majChamp('image', e.target.value)}
          required
        />
      </label>

      <fieldset>
        <legend>
          <span className="label-avec-aide">
            {t('sf.ports')}
            <Aide texte={t('sf.portsAide')} />
          </span>
        </legend>
        {service.ports.map((p, i) => (
          <div className="ligne-champ" key={i}>
            <input
              type="number"
              placeholder={t('sf.portHotePlaceholder')}
              value={p.host}
              onChange={(e) => majPort(i, 'host', e.target.value)}
              onBlur={() => corrigerPortSiConflit(i)}
            />
            {portAjuste === i && <span className="port-ajuste">{t('sf.decale')}</span>}
            <span className="fleche">→</span>
            <input
              type="number"
              placeholder={t('sf.portConteneurPlaceholder')}
              value={p.container}
              onChange={(e) => majPort(i, 'container', e.target.value)}
            />
            {service.ports.length > 1 && (
              <button type="button" className="btn-icone" onClick={() => supprimerPort(i)}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn-discret" onClick={ajouterPort}>{t('sf.ajouterPort')}</button>
      </fieldset>

      <button
        type="button"
        className="btn-discret btn-avance"
        onClick={() => setOuvertConfig((o) => !o)}
      >
        {ouvertConfig ? '▾' : '▸'} {t('sf.volumesEtEnv')}
        {!ouvertConfig && (volumesRemplis > 0 || envRemplis > 0) && (
          <span className="badge-compteur">{volumesRemplis + envRemplis}</span>
        )}
      </button>

      {ouvertConfig && (
        <>
          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.volumes')}
                <Aide texte={t('sf.volumesAide')} />
              </span>
            </legend>
            {service.volumes.map((v, i) => (
              <div className="ligne-champ" key={i}>
                <input
                  type="text"
                  placeholder={t('sf.volumePlaceholder')}
                  value={v}
                  onChange={(e) => majVolume(i, e.target.value)}
                />
                {service.volumes.length > 1 && (
                  <button type="button" className="btn-icone" onClick={() => supprimerVolume(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-discret" onClick={ajouterVolume}>{t('sf.ajouterVolume')}</button>
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.variablesEnv')}
                <Aide texte={t('sf.variablesEnvAide')} />
              </span>
            </legend>
            {service.env.map((e2, i) => (
              <div className="ligne-champ" key={i}>
                <input
                  type="text"
                  placeholder={t('sf.clePlaceholder')}
                  value={e2.key}
                  onChange={(e) => majEnv(i, 'key', e.target.value)}
                />
                <span className="fleche">=</span>
                <input
                  type="text"
                  placeholder={t('sf.valeurPlaceholder')}
                  value={e2.value}
                  onChange={(e) => majEnv(i, 'value', e.target.value)}
                />
                {estCleApplicative(e2.key) && (
                  <Aide texte={t('sf.cleAppAide')} />
                )}
                {estSecret(e2.key, { inclusions: secretsInclus, exclusions: secretsExclus }) && (
                  <button
                    type="button"
                    className="btn-icone"
                    title={t('sf.genererSecretTitle')}
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
            <button type="button" className="btn-discret" onClick={ajouterEnv}>{t('sf.ajouterVariable')}</button>
          </fieldset>
        </>
      )}

      <button type="button" className="btn-discret btn-avance" onClick={() => setOuvertAvance((o) => !o)}>
        {ouvertAvance ? '▾' : '▸'} {t('sf.optionsAvancees')}
      </button>

      {ouvertAvance && (
        <>
          <label className="label-avec-aide" style={{ display: 'block' }}>
            {t('sf.commandePerso')}
            <Aide texte={t('sf.commandePersoAide')} />
          </label>
          <input
            type="text"
            placeholder={t('sf.commandePersoPlaceholder')}
            value={service.command || ''}
            onChange={(e) => majChamp('command', e.target.value)}
            style={{ marginBottom: '0.8rem' }}
          />

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.redemarrage')}
                <Aide texte={t('sf.redemarrageAide')} />
              </span>
            </legend>
            <select value={service.restart} onChange={(e) => majChamp('restart', e.target.value)}>
              {POLITIQUES_RESTART.map((p) => (
                <option key={p.valeur} value={p.valeur}>{p.label}</option>
              ))}
            </select>

            <label className="label-avec-aide" style={{ marginTop: '0.6rem', display: 'block' }}>
              {t('sf.delaiArret')}
              <Aide texte={t('sf.delaiArretAide')} />
            </label>
            <input
              type="text"
              placeholder={t('sf.delaiArretPlaceholder')}
              value={service.stopGracePeriod || ''}
              onChange={(e) => majChamp('stopGracePeriod', e.target.value)}
            />

            {servicesExistants.length > 0 && (
              <>
                <legend style={{ marginTop: '0.8rem' }}>
                  <span className="label-avec-aide">
                    {t('sf.dependDe')}
                    <Aide texte={t('sf.dependDeAide')} />
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
                  {t('sf.reseaux')}
                  <Aide texte={t('sf.reseauxAide')} />
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
                {t('sf.profils')}
                <Aide texte={t('sf.profilsAide')} />
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
                {t('sf.profilNeDemarreQue')} <code>docker compose --profile {service.profiles[0]} up</code>
                {service.profiles.length > 1 ? t('sf.profilAutresChoisis') : ''}.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.veriSante')}
                <Aide texte={t('sf.veriSanteAide')} />
              </span>
            </legend>
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={service.healthcheck.enabled}
                onChange={(e) => majHealthcheck('enabled', e.target.checked)}
              />
              {t('sf.activerSante')}
            </label>
            {service.healthcheck.enabled && (
              <>
                <input
                  type="text"
                  placeholder={t('sf.testSantePlaceholder')}
                  value={service.healthcheck.test}
                  onChange={(e) => majHealthcheck('test', e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                />
                <div className="ligne-champ" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder={t('sf.intervallePlaceholder')}
                    value={service.healthcheck.interval}
                    onChange={(e) => majHealthcheck('interval', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder={t('sf.timeoutPlaceholder')}
                    value={service.healthcheck.timeout}
                    onChange={(e) => majHealthcheck('timeout', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder={t('sf.essaisPlaceholder')}
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
                {t('sf.limitesRessources')}
                <Aide texte={t('sf.limitesRessourcesAide')} />
              </span>
            </legend>
            <div className="ligne-champ">
              <input
                type="text"
                placeholder={t('sf.ramPlaceholder')}
                value={service.memLimit}
                onChange={(e) => majChamp('memLimit', e.target.value)}
              />
              <input
                type="text"
                placeholder={t('sf.cpuPlaceholder')}
                value={service.cpus}
                onChange={(e) => majChamp('cpus', e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.rotationLogs')}
                <Aide texte={t('sf.rotationLogsAide')} />
              </span>
            </legend>
            <div className="ligne-champ">
              <input
                type="text"
                placeholder={t('sf.tailleMaxPlaceholder')}
                value={service.logMaxSize}
                onChange={(e) => majChamp('logMaxSize', e.target.value)}
              />
              <input
                type="text"
                placeholder={t('sf.nbFichiersPlaceholder')}
                value={service.logMaxFile}
                onChange={(e) => majChamp('logMaxFile', e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.reverseProxy')}
                <Aide texte={t('sf.reverseProxyAide')} />
              </span>
            </legend>
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={!!service.traefik?.active}
                onChange={(e) => majTraefik('active', e.target.checked)}
              />
              {t('sf.exposerTraefik')}
            </label>
            {service.traefik?.active && (
              <div className="ligne-champ" style={{ marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder={t('sf.domainePlaceholder')}
                  value={service.traefik?.domaine || ''}
                  onChange={(e) => majTraefik('domaine', e.target.value)}
                />
                <input
                  type="text"
                  placeholder={t('sf.portInternePlaceholder')}
                  value={service.traefik?.port || ''}
                  onChange={(e) => majTraefik('port', e.target.value)}
                />
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.durcissement')}
                <Aide texte={t('sf.durcissementAide')} />
              </span>
            </legend>
            <label className="label-avec-aide" style={{ display: 'block' }}>
              {t('sf.utilisateur')}
              <Aide texte={t('sf.utilisateurAide')} />
            </label>
            <input
              type="text"
              placeholder={t('sf.utilisateurPlaceholder')}
              value={service.security?.user || ''}
              onChange={(e) => majSecurity('user', e.target.value)}
              style={{ marginBottom: '0.6rem' }}
            />
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={!!service.security?.init}
                onChange={(e) => majSecurity('init', e.target.checked)}
              />
              {t('sf.initProcess')}
            </label>
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={!!service.security?.readOnly}
                onChange={(e) => majSecurity('readOnly', e.target.checked)}
              />
              {t('sf.lectureSeule')}
            </label>
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={!!service.security?.noNewPrivileges}
                onChange={(e) => majSecurity('noNewPrivileges', e.target.checked)}
              />
              {t('sf.noNewPriv')}
            </label>
            <label className="option-secrets">
              <input
                type="checkbox"
                checked={!!service.security?.dropAllCaps}
                onChange={(e) => majSecurity('dropAllCaps', e.target.checked)}
              />
              {t('sf.dropCaps')}
            </label>
            {service.security?.dropAllCaps && (
              <input
                type="text"
                placeholder={t('sf.capacitesPlaceholder')}
                value={service.security?.capAdd || ''}
                onChange={(e) => majSecurity('capAdd', e.target.value)}
                style={{ marginTop: '0.5rem' }}
              />
            )}
            {service.security?.readOnly && (
              <div style={{ marginTop: '0.6rem' }}>
                <p className="reseaux-aide" style={{ marginBottom: '0.4rem' }}>
                  {t('sf.lectureSeuleExplication')}
                </p>
                {(service.tmpfs || ['']).map((t2, i) => (
                  <div className="ligne-champ" key={i}>
                    <input
                      type="text"
                      placeholder={t('sf.tmpfsPlaceholder')}
                      value={t2}
                      onChange={(e) => majTmpfs(i, e.target.value)}
                    />
                    {(service.tmpfs || ['']).length > 1 && (
                      <button type="button" className="btn-icone" onClick={() => supprimerTmpfs(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-discret" onClick={ajouterTmpfs}>{t('sf.ajouterDossierMemoire')}</button>
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>
              <span className="label-avec-aide">
                {t('sf.hotesSupp')}
                <Aide texte={t('sf.hotesSuppAide')} />
              </span>
            </legend>
            {(service.extraHosts || ['']).map((h, i) => (
              <div className="ligne-champ" key={i}>
                <input
                  type="text"
                  placeholder={t('sf.hotePlaceholder')}
                  value={h}
                  onChange={(e) => majExtraHost(i, e.target.value)}
                />
                {(service.extraHosts || ['']).length > 1 && (
                  <button type="button" className="btn-icone" onClick={() => supprimerExtraHost(i)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-discret" onClick={ajouterExtraHost}>{t('sf.ajouterHote')}</button>
          </fieldset>
        </>
      )}

      <div className="actions-formulaire">
        <button type="submit" className="btn-principal">
          {enEdition ? t('sf.enregistrerModifs') : t('sf.ajouterConteneur')}
        </button>
        {enEdition && (
          <button type="button" className="btn-discret" onClick={onAnnulerEdition}>{t('sf.annuler')}</button>
        )}
      </div>
    </form>
  )
}

export default ServiceForm
