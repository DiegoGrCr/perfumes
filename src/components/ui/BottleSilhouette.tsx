/** Elegant fallback bottle for perfumes without photos. */
export default function BottleSilhouette({
  className = 'w-24 h-40',
  tone = 'light',
}: {
  className?: string
  tone?: 'light' | 'dark'
}) {
  const stroke = tone === 'dark' ? '#E4B8AC' : '#B97F6E'
  const glass = tone === 'dark' ? 'rgba(228,184,172,0.10)' : 'rgba(185,127,110,0.08)'
  return (
    <svg viewBox="0 0 100 170" className={className} fill="none" aria-hidden>
      <rect x="38" y="6" width="24" height="22" rx="2" fill={stroke} opacity="0.85" />
      <rect x="42" y="28" width="16" height="10" fill={stroke} opacity="0.45" />
      <rect x="16" y="38" width="68" height="124" rx="10" fill={glass} stroke={stroke} strokeWidth="1" />
      <rect x="22" y="46" width="6" height="100" rx="3" fill="#fff" opacity="0.35" />
      <rect x="30" y="86" width="40" height="36" stroke={stroke} strokeWidth="0.6" opacity="0.6" />
      <text x="50" y="102" textAnchor="middle" fontFamily="serif" fontSize="9" letterSpacing="2.5" fill={stroke}>VELVET</text>
      <line x1="38" y1="109" x2="62" y2="109" stroke={stroke} strokeWidth="0.5" opacity="0.6" />
    </svg>
  )
}
