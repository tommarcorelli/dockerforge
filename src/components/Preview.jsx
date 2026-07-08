import { useState } from 'react'
import JSZip from 'jszip'

// Aperçu du docker-compose.yml généré, avec statut de validation
function Preview({ yaml, envFiles, erreurs, avertissements, nbServices, extraireSecrets, onToggleSecrets }) {
  const [copie, setCopie] = useState(false)
  const pretAExpedier = nbServices > 0 && erreurs.length === 0

  function copier() {
    navigator.clipboard.writeText(yaml)
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

  const lignes = yaml.split('\n')

  return (
    <div className="apercu-panneau">
      <div className="apercu-entete">
        <div>
          <span className="apercu-tag">APERÇU</span>
          <h2>docker-compose.yml</h2>
        </div>
        <div className={`statut-pastille ${pretAExpedier ? 'statut-ok' : 'statut-attente'}`}>
          {pretAExpedier ? 'PRÊT' : nbServices === 0 ? 'VIDE' : 'À CORRIGER'}
        </div>
      </div>

      <label className="option-secrets">
        <input type="checkbox" checked={extraireSecrets} onChange={onToggleSecrets} />
        Extraire les mots de passe dans des fichiers .env séparés
      </label>

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

      <div className="code-preview">
        <div className="code-gouttiere">
          {lignes.map((_, i) => <span key={i}>{i + 1}</span>)}
        </div>
        <pre>{yaml}</pre>
      </div>

      <div className="actions-preview">
        <button className="btn-discret" onClick={copier}>{copie ? 'Copié ✓' : 'Copier'}</button>
        <button className="btn-discret" onClick={() => telechargerFichier('docker-compose.yml', yaml)}>
          docker-compose.yml seul
        </button>
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
