import { STACKS } from '../core/stacks.js'

// Boutons pour charger une stack complète (plusieurs services liés) en un clic
function StackPresets({ onCharger }) {
  return (
    <div className="stacks">
      <div className="section-titre">
        <span className="section-tag">STACKS PRÊTES</span>
        <h2>Stacks prêtes à l'emploi</h2>
      </div>
      <div className="stacks-liste">
        {STACKS.map((stack) => (
          <button key={stack.id} className="stack-carte" onClick={() => onCharger(stack)}>
            <span className="stack-nom">{stack.nom}</span>
            <span className="stack-description">{stack.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default StackPresets
