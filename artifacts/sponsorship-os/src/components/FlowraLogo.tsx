export function FlowraLogo({ className = "w-8 h-8", darkMode = false }: { className?: string; darkMode?: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Abstract flowing waves representing workflow and momentum */}
      <defs>
        <linearGradient id="flowra-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Main flowing mark */}
      <path
        d="M 20 60 Q 40 40, 60 50 Q 80 60, 100 40"
        stroke="url(#flowra-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 20 80 Q 40 100, 60 90 Q 80 80, 100 100"
        stroke="url(#flowra-gradient)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Center accent dot */}
      <circle cx="60" cy="70" r="5" fill="url(#flowra-gradient)" />
    </svg>
  );
}

export function FlowraWordmark({ className = "text-lg font-bold" }: { className?: string }) {
  return <span className={className}>Flowra</span>;
}

export function FlowraFull({ className = "flex items-center gap-2" }: { className?: string }) {
  return (
    <div className={className}>
      <FlowraLogo className="w-6 h-6" />
      <FlowraWordmark className="text-lg font-semibold tracking-tight" />
    </div>
  );
}
