// Petite bulle d'aide ⓘ — tooltip CSS pur, pas de JS nécessaire
function Aide({ texte }) {
  return (
    <span className="aide-bulle" tabIndex={0}>
      <span className="aide-icone" aria-hidden="true">ⓘ</span>
      <span className="aide-texte" role="tooltip">{texte}</span>
    </span>
  )
}

export default Aide
