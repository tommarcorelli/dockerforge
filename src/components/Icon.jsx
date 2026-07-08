// Icon.jsx — affiche un logo vectoriel officiel (librairie simple-icons)
// Utilisation : <Icon icon={siDocker} size={18} />
function Icon({ icon, size = 18, couleur }) {
  if (!icon) return null
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={couleur || `#${icon.hex}`}
      style={{ flexShrink: 0 }}
    >
      <path d={icon.path} />
    </svg>
  )
}

export default Icon
