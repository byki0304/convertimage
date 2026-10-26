const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 53) % 100,
  top: (i * 37) % 100,
  size: 2 + (i % 3),
  delay: (i % 6) * 0.8,
  color: i % 3 === 0 ? '#00F0FF' : i % 3 === 1 ? '#FF0055' : '#9D00FF',
}));

/** Aurora gradients, cyber grid and drifting light particles rendered behind every screen. */
export function BackgroundFx() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-obsidian via-obsidian-card to-obsidian">
      <div className="absolute -left-1/4 -top-1/4 h-[70vmax] w-[70vmax] animate-aurora rounded-full bg-neon-purple/15 blur-[120px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[60vmax] w-[60vmax] animate-aurora rounded-full bg-neon-cyan/10 blur-[120px] [animation-delay:-6s]" />
      <div className="absolute left-1/3 top-1/2 h-[40vmax] w-[40vmax] animate-aurora rounded-full bg-neon-magenta/10 blur-[120px] [animation-delay:-12s]" />
      <div className="neon-grid absolute inset-0" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute animate-pulse rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animationDelay: `${p.delay}s`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}
