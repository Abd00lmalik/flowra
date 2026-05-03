export function FlowraLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flowra-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#D4FF00" />
        </linearGradient>
      </defs>
      {/* Flowing wave marks — workflow + momentum */}
      <path
        d="M 20 55 Q 40 35, 60 48 Q 80 61, 100 38"
        stroke="url(#flowra-gradient)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 20 78 Q 40 98, 60 85 Q 80 72, 100 95"
        stroke="url(#flowra-gradient)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Center accent dot */}
      <circle cx="60" cy="67" r="4" fill="#FFB800" />
    </svg>
  );
}

export function FlowraWordmark({ className = "text-lg font-bold" }: { className?: string }) {
  return <span className={className}>Flowra</span>;
}

export function FlowraFull({ className = "flex items-center gap-2" }: { className?: string }) {
  return (
    <div className={className}>
      <FlowraLogo className="w-7 h-7" />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Flow<span className="text-primary">ra</span>
      </span>
    </div>
  );
}
