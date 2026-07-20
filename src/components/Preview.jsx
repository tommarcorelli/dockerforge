import { useState, Fragment } from 'react'
import JSZip from 'jszip'
import { tokeniserLigneYaml } from '../core/surlignageYaml.js'
import Aide from './Aide.jsx'

// Aperçu du docker-compose.yml généré, avec statut de validation
function Preview({
  yaml, dockerRunScript, k8sManifests, envFiles, erreurs, avertissements, suggestions, audit, nbServices, extraireSecrets, onToggleSecrets,
  secretsInclus, secretsExclus, onAjouterInclusion, onSupprimerInclusion, onAjouterExclusion, onSupprimerExclusion,
  onSecuriserSecrets,
}) {
  const [copie, setCopie] = useState(false)
  const [vue, setVue] = useState('compose') // 'compose' | 'run' | 'k8s'
  const [reglagesSecretsOuverts, setReglagesSecretsOuverts] = useState(false)
  const [auditOuvert, setAuditOuvert] = useState(false)
  const [champInclusion, setChampInclusion] = useState('')
  const [champExclusion, setChampExclusion] = useState('')
  const pretAExpedier = nbServices > 0 && erreurs.length === 0
  const contenuAffiche = vue === 'compose' ? yaml : vue === 'run' ? dockerRunScript : k8sManifests

  function ajouterCle(e, valeur, setValeur, onAjouter) {
    e.preventDefault()
    const cle = valeur.trim().toUpperCase().replace(/\s+/g, '_')
    if (cle) onAjouter(cle)
    setValeur('')
  }

  function copier() {
    navigator.clipboard.writeText(contenuAffiche)
    setCopie(true)
    setTimeout(() => setCopie(false), 1500)
  }

  function telechargerFichier(nom, contenu) {
    const blob = new Blob([contenu], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nom
    a.click()
    URL.revokeObjectURL(url)
  }

  async function telechargerTout() {
    const zip = new JSZip()
    zip.file('docker-compose.yml', yaml)
    zip.file('dockerforge-run.sh', dockerRunScript)
    zip.file('k8s.yaml', k8sManifests)

    for (const f of envFiles || []) {
      zip.file(f.nom, f.contenu)
    }

    if (envFiles && envFiles.length > 0) {
      zip.file('.gitignore', envFiles.map((f) => f.nom).join('\n') + '\n')
    }

    zip.file(
      'LANCEMENT.md',
      [
        '# Lancer ce projet',
        '',
        '1. Installe Docker et Docker Compose si ce n\'est pas déjà fait.',
        '2. Place-toi dans ce dossier avec un terminal.',
        '3. Lance :',
        '',
        '```bash',
        'docker compose up -d',
        '```',
        '',
        '4. Pour arrêter :',
        '',
        '```bash',
        'docker compose down',
        '```',
        '',
        "Une alternative sans docker-compose est incluse dans `dockerforge-run.sh`",
        '(commandes `docker run` équivalentes, une par service).',
        '',
        "`k8s.yaml` contient un point de départ de manifestes Kubernetes",
        "(Deployment + Service par conteneur) si tu déploies sur un cluster —",
        'à adapter avant un usage en production (stockage persistant, Ingress...).',
        '',
        'Généré avec DockerForge.',
        '',
      ].join('\n')
    )

    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dockerforge-projet.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const lignes = contenuAffiche.split('\n')

  return (
    <div className="apercu-panneau">
      <div className="apercu-entete">
        <div>
          <span className="apercu-tag">APERÇU</span>
          <h2>{{ compose: 'docker-compose.yml', run: 'dockerforge-run.sh', k8s: 'k8s.yaml' }[vue]}</h2>
        </div>
        <div className={`statut-pastille ${pretAExpedier ? 'statut-ok' : 'statut-attente'}`}>
          {pretAExpedier ? 'PRÊT' : nbServices === 0 ? 'VIDE' : 'À CORRIGER'}
        </div>
      </div>

      {audit && nbServices > 0 && (
        <div className={`audit-securite audit-${audit.niveau}`}>
          <button type="button" className="audit-entete" onClick={() => setAuditOuvert((o) => !o)}>
            <span>🛡 Mini-audit sécurité</span>
            <span className={`audit-niveau audit-niveau-${audit.niveau}`}>
              {{ bon: 'Bon', moyen: 'À surveiller', a_ameliorer: 'À améliorer' }[audit.niveau]}
            </span>
            <span className="audit-chevron">{auditOuvert ? '▾' : '▸'}</span>
          </button>
          {auditOuvert && (
            <ul className="audit-liste">
              <li>
                {audit.portsExposes} port{audit.portsExposes !== 1 ? 's' : ''} exposé{audit.portsExposes !== 1 ? 's' : ''} sur l'hôte
              </li>
              <li className={audit.servicesAvecHealthcheck === audit.totalServices ? 'audit-ok' : ''}>
                {audit.servicesAvecHealthcheck}/{audit.totalServices} service{audit.totalServices !== 1 ? 's' : ''} avec un healthcheck activé
              </li>
              <li className={audit.secretsEnClair === 0 ? 'audit-ok' : 'audit-alerte'}>
                {audit.secretsEnClair} secret{audit.secretsEnClair !== 1 ? 's' : ''} en clair dans le YAML
              </li>
              <li className={audit.motsDePasseParDefaut === 0 ? 'audit-ok' : 'audit-alerte'}>
                {audit.motsDePasseParDefaut} mot{audit.motsDePasseParDefaut !== 1 ? 's' : ''} de passe encore à "change_moi"
                {audit.motsDePasseParDefaut > 0 && onSecuriserSecrets && (
                  <button type="button" className="btn-discret audit-action" onClick={onSecuriserSecrets}>
                    🎲 Sécuriser maintenant
                  </button>
                )}
              </li>
              <li className={audit.tagsNonFiges === 0 ? 'audit-ok' : ''}>
                {audit.tagsNonFiges} image{audit.tagsNonFiges !== 1 ? 's' : ''} sans version figée (tag "latest")
              </li>
            </ul>
          )}
        </div>
      )}

      <div className="apercu-onglets">
        <button
          type="button"
          className={`apercu-onglet ${vue === 'compose' ? 'apercu-onglet-actif' : ''}`}
          onClick={() => setVue('compose')}
        >
          📄 docker-compose.yml
        </button>
        <button
          type="button"
          className={`apercu-onglet ${vue === 'run' ? 'apercu-onglet-actif' : ''}`}
          onClick={() => setVue('run')}
        >
          ⌨ Commandes docker run
        </button>
        <button
          type="button"
          className={`apercu-onglet ${vue === 'k8s' ? 'apercu-onglet-actif' : ''}`}
          onClick={() => setVue('k8s')}
        >
          ☸ Kubernetes
        </button>
      </div>

      <label className="option-secrets">
        <input type="checkbox" checked={extraireSecrets} onChange={onToggleSecrets} />
        Extraire les mots de passe dans des fichiers .env séparés
      </label>

      <button
        type="button"
        className="btn-discret btn-avance"
        onClick={() => setReglagesSecretsOuverts((o) => !o)}
      >
        {reglagesSecretsOuverts ? '▾' : '▸'} Personnaliser la détection des secrets
      </button>

      {reglagesSecretsOuverts && (
        <div className="secrets-reglages">
          <div className="secrets-colonne">
            <span className="label-avec-aide">
              Toujours traiter comme secret
              <Aide texte="Des clés qui ne suivent pas les motifs habituels (PASSWORD, TOKEN, KEY...) mais que tu veux quand même protéger, ex: une clé propre à ton appli." />
            </span>
            <form className="ligne-champ" onSubmit={(e) => ajouterCle(e, champInclusion, setChampInclusion, onAjouterInclusion)}>
              <input
                type="text"
                placeholder="ex: MON_TOKEN_INTERNE"
                value={champInclusion}
                onChange={(e) => setChampInclusion(e.target.value)}
              />
              <button type="submit" className="btn-discret">Ajouter</button>
            </form>
            {secretsInclus && secretsInclus.length > 0 && (
              <div className="chips-dependances">
                {secretsInclus.map((c) => (
                  <button key={c} type="button" className="chip chip-actif" title="Retirer" onClick={() => onSupprimerInclusion(c)}>
                    {c} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="secrets-colonne">
            <span className="label-avec-aide">
              Ne jamais traiter comme secret
              <Aide texte="Des clés que la détection automatique confond à tort avec un mot de passe (ex: un faux positif sur une clé se terminant par KEY). Elles resteront visibles en clair dans le YAML." />
            </span>
            <form className="ligne-champ" onSubmit={(e) => ajouterCle(e, champExclusion, setChampExclusion, onAjouterExclusion)}>
              <input
                type="text"
                placeholder="ex: PUBLIC_KEY"
                value={champExclusion}
                onChange={(e) => setChampExclusion(e.target.value)}
              />
              <button type="submit" className="btn-discret">Ajouter</button>
            </form>
            {secretsExclus && secretsExclus.length > 0 && (
              <div className="chips-dependances">
                {secretsExclus.map((c) => (
                  <button key={c} type="button" className="chip" title="Retirer" onClick={() => onSupprimerExclusion(c)}>
                    {c} ✕
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {erreurs.length > 0 && (
        <div className="bloc-erreurs">
          <strong>⚠ Erreurs bloquantes</strong>
          <ul>
            {erreurs.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {avertissements.length > 0 && (
        <div className="bloc-avertissements">
          <strong>Avertissements</strong>
          <ul>
            {avertissements.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="bloc-suggestions">
          <strong>💡 Suggestions</strong>
          <ul>
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      <div className="code-preview">
        <div className="code-gouttiere">
          {lignes.map((_, i) => <span key={i}>{i + 1}</span>)}
        </div>
        <pre>
          {lignes.map((ligne, i) => (
            <Fragment key={i}>
              {tokeniserLigneYaml(ligne).map((seg, j) =>
                seg.classe ? <span key={j} className={seg.classe}>{seg.texte}</span> : seg.texte
              )}
              {i < lignes.length - 1 ? '\n' : ''}
            </Fragment>
          ))}
        </pre>
      </div>

      <div className="actions-preview">
        <button className="btn-discret" onClick={copier}>{copie ? 'Copié ✓' : 'Copier'}</button>
        {vue === 'compose' ? (
          <button className="btn-discret" onClick={() => telechargerFichier('docker-compose.yml', yaml)}>
            docker-compose.yml seul
          </button>
        ) : vue === 'run' ? (
          <button className="btn-discret" onClick={() => telechargerFichier('dockerforge-run.sh', dockerRunScript)}>
            dockerforge-run.sh seul
          </button>
        ) : (
          <button className="btn-discret" onClick={() => telechargerFichier('k8s.yaml', k8sManifests)}>
            k8s.yaml seul
          </button>
        )}
        <button className="btn-principal btn-expedier" onClick={telechargerTout} disabled={nbServices === 0}>
          📦 Télécharger tout (.zip)
        </button>
      </div>

      {envFiles && envFiles.length > 0 && (
        <div className="env-files">
          <h3>Fichiers de secrets inclus dans le .zip</h3>
          {envFiles.map((f) => (
            <div className="env-file-bloc" key={f.nom}>
              <div className="env-file-entete">
                <code>{f.nom}</code>
                <button className="btn-discret" onClick={() => telechargerFichier(f.nom, f.contenu)}>
                  Télécharger seul
                </button>
              </div>
              <pre className="env-file-contenu">{f.contenu}</pre>
            </div>
          ))}
          <p className="env-file-note">
            ⚠ Ces fichiers contiennent des mots de passe en clair : le .zip inclut
            un <code>.gitignore</code> pour ne jamais les pousser sur GitHub par erreur.
          </p>
        </div>
      )}
    </div>
  )
}

export default Preview
