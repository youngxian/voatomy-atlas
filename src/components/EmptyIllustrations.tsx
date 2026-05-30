'use client';

interface IllustrationProps {
  className?: string;
}

export function DashboardIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="160" height="100" rx="12" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="30" y="42" width="60" height="36" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <rect x="36" y="50" width="18" height="4" rx="2" fill="var(--primary)" opacity="0.6" />
      <rect x="36" y="58" width="30" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.3" />
      <rect x="36" y="64" width="24" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="100" y="42" width="70" height="36" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <path d="M112 68 L122 58 L132 62 L142 52 L152 56 L160 48" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="112" cy="68" r="2.5" fill="var(--primary)" />
      <circle cx="152" cy="56" r="2.5" fill="var(--primary)" />
      <rect x="30" y="86" width="40" height="36" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <rect x="38" y="94" width="8" height="18" rx="3" fill="var(--primary)" opacity="0.3" />
      <rect x="48" y="100" width="8" height="12" rx="3" fill="var(--primary)" opacity="0.5" />
      <rect x="58" y="96" width="8" height="16" rx="3" fill="var(--primary)" opacity="0.7" />
      <rect x="78" y="86" width="92" height="36" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <circle cx="95" cy="104" r="10" stroke="var(--primary)" strokeWidth="3" opacity="0.4" />
      <path d="M95 94 A10 10 0 0 1 105 104" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <rect x="116" y="97" width="20" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.3" />
      <rect x="116" y="103" width="28" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="116" y="109" width="16" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.15" />
      <circle cx="170" cy="22" r="14" fill="var(--primary)" opacity="0.08" />
      <circle cx="170" cy="22" r="8" fill="var(--primary)" opacity="0.12" />
      <path d="M167 22 L170 18 L173 22" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M170 18 V26" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function TeamIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="56" r="18" fill="var(--primary)" opacity="0.12" />
      <circle cx="100" cy="48" r="10" fill="var(--primary)" opacity="0.25" />
      <path d="M80 76 Q80 64 100 64 Q120 64 120 76" fill="var(--primary)" opacity="0.15" />
      <circle cx="56" cy="64" r="14" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="56" cy="58" r="7" fill="var(--muted-foreground)" opacity="0.2" />
      <path d="M42 80 Q42 70 56 70 Q70 70 70 80" fill="var(--muted-foreground)" opacity="0.1" />
      <circle cx="144" cy="64" r="14" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="144" cy="58" r="7" fill="var(--muted-foreground)" opacity="0.2" />
      <path d="M130 80 Q130 70 144 70 Q158 70 158 80" fill="var(--muted-foreground)" opacity="0.1" />
      <path d="M72 68 L86 62" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
      <path d="M114 62 L128 68" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
      <rect x="40" y="96" width="120" height="40" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <rect x="52" y="106" width="32" height="4" rx="2" fill="var(--primary)" opacity="0.5" />
      <rect x="52" y="114" width="44" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.25" />
      <rect x="52" y="120" width="28" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.15" />
      <rect x="120" y="106" width="28" height="20" rx="6" fill="var(--primary)" fillOpacity="0.08" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" />
      <path d="M130 116 L134 120 L140 112" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

export function BacklogIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="20" width="50" height="120" rx="10" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="75" y="20" width="50" height="120" rx="10" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="120" y="20" width="50" height="120" rx="10" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="36" y="28" width="38" height="5" rx="2.5" fill="var(--primary)" opacity="0.4" />
      <rect x="81" y="28" width="38" height="5" rx="2.5" fill="var(--warning)" opacity="0.4" />
      <rect x="126" y="28" width="38" height="5" rx="2.5" fill="var(--success)" opacity="0.4" />
      <rect x="36" y="40" width="38" height="24" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
      <rect x="40" y="46" width="20" height="3" rx="1.5" fill="var(--foreground)" opacity="0.3" />
      <rect x="40" y="52" width="28" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="40" y="57" width="14" height="2" rx="1" fill="var(--primary)" opacity="0.3" />
      <rect x="36" y="70" width="38" height="24" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
      <rect x="40" y="76" width="24" height="3" rx="1.5" fill="var(--foreground)" opacity="0.3" />
      <rect x="40" y="82" width="30" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="36" y="100" width="38" height="24" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
      <rect x="40" y="106" width="18" height="3" rx="1.5" fill="var(--foreground)" opacity="0.3" />
      <rect x="40" y="112" width="26" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="81" y="40" width="38" height="24" rx="6" fill="var(--card)" stroke="var(--primary)" strokeWidth="1" opacity="0.8" />
      <rect x="85" y="46" width="22" height="3" rx="1.5" fill="var(--foreground)" opacity="0.3" />
      <rect x="85" y="52" width="28" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="85" y="57" width="16" height="2" rx="1" fill="var(--warning)" opacity="0.3" />
      <rect x="81" y="70" width="38" height="24" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
      <rect x="85" y="76" width="26" height="3" rx="1.5" fill="var(--foreground)" opacity="0.3" />
      <rect x="126" y="40" width="38" height="24" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="0.75" />
      <rect x="130" y="46" width="20" height="3" rx="1.5" fill="var(--foreground)" opacity="0.3" />
      <rect x="130" y="52" width="30" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="130" y="57" width="12" height="2" rx="1" fill="var(--success)" opacity="0.3" />
      <path d="M74 52 L76 52" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" strokeDasharray="2 2" />
      <path d="M119 52 L121 52" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" strokeDasharray="2 2" />
    </svg>
  );
}

export function SprintIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="40" width="160" height="90" rx="12" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="40" y1="100" x2="160" y2="100" stroke="var(--border)" strokeWidth="1" />
      <line x1="40" y1="80" x2="160" y2="80" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
      <line x1="40" y1="60" x2="160" y2="60" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
      <path d="M40 100 L60 96 L80 88 L100 76 L120 68 L140 56 L160 48" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />
      <path d="M40 100 L60 94 L80 85 L100 80 L120 72 L140 70 L160 68" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="100" r="3" fill="var(--primary)" />
      <circle cx="80" cy="85" r="3" fill="var(--primary)" />
      <circle cx="120" cy="72" r="3" fill="var(--primary)" />
      <circle cx="160" cy="68" r="3" fill="var(--primary)" />
      <path d="M100 80 L100 68" stroke="var(--warning)" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <circle cx="100" cy="68" r="4" fill="var(--warning)" opacity="0.2" stroke="var(--warning)" strokeWidth="1" />
      <text x="100" y="32" textAnchor="middle" fill="var(--muted-foreground)" fontSize="8" fontFamily="system-ui" opacity="0.5">Sprint Progress</text>
      <rect x="40" y="108" width="24" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="136" y="108" width="24" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.2" />
    </svg>
  );
}

export function RetroIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="30" width="52" height="100" rx="10" fill="var(--success)" fillOpacity="0.06" stroke="var(--success)" strokeWidth="1" strokeOpacity="0.2" />
      <rect x="74" y="30" width="52" height="100" rx="10" fill="var(--warning)" fillOpacity="0.06" stroke="var(--warning)" strokeWidth="1" strokeOpacity="0.2" />
      <rect x="132" y="30" width="52" height="100" rx="10" fill="var(--primary)" fillOpacity="0.06" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" />
      <text x="42" y="24" textAnchor="middle" fill="var(--success)" fontSize="7" fontFamily="system-ui" opacity="0.6">Went Well</text>
      <text x="100" y="24" textAnchor="middle" fill="var(--warning)" fontSize="7" fontFamily="system-ui" opacity="0.6">Improve</text>
      <text x="158" y="24" textAnchor="middle" fill="var(--primary)" fontSize="7" fontFamily="system-ui" opacity="0.6">Actions</text>
      <rect x="22" y="38" width="40" height="18" rx="5" fill="var(--card)" stroke="var(--success)" strokeWidth="0.75" opacity="0.6" />
      <rect x="26" y="43" width="24" height="3" rx="1.5" fill="var(--success)" opacity="0.3" />
      <rect x="26" y="49" width="18" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.15" />
      <rect x="22" y="60" width="40" height="18" rx="5" fill="var(--card)" stroke="var(--success)" strokeWidth="0.75" opacity="0.6" />
      <rect x="26" y="65" width="20" height="3" rx="1.5" fill="var(--success)" opacity="0.3" />
      <rect x="26" y="71" width="30" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.15" />
      <rect x="22" y="82" width="40" height="18" rx="5" fill="var(--card)" stroke="var(--success)" strokeWidth="0.75" opacity="0.6" />
      <rect x="26" y="87" width="28" height="3" rx="1.5" fill="var(--success)" opacity="0.3" />
      <rect x="80" y="38" width="40" height="18" rx="5" fill="var(--card)" stroke="var(--warning)" strokeWidth="0.75" opacity="0.6" />
      <rect x="84" y="43" width="22" height="3" rx="1.5" fill="var(--warning)" opacity="0.3" />
      <rect x="84" y="49" width="30" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.15" />
      <rect x="80" y="60" width="40" height="18" rx="5" fill="var(--card)" stroke="var(--warning)" strokeWidth="0.75" opacity="0.6" />
      <rect x="84" y="65" width="26" height="3" rx="1.5" fill="var(--warning)" opacity="0.3" />
      <rect x="138" y="38" width="40" height="18" rx="5" fill="var(--card)" stroke="var(--primary)" strokeWidth="0.75" opacity="0.6" />
      <rect x="142" y="43" width="18" height="3" rx="1.5" fill="var(--primary)" opacity="0.3" />
      <rect x="142" y="49" width="26" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.15" />
      <rect x="138" y="60" width="40" height="18" rx="5" fill="var(--card)" stroke="var(--primary)" strokeWidth="0.75" opacity="0.6" />
      <rect x="142" y="65" width="24" height="3" rx="1.5" fill="var(--primary)" opacity="0.3" />
      <circle cx="42" cy="120" r="6" fill="var(--success)" opacity="0.15" />
      <path d="M39 120 L41 122 L45 118" stroke="var(--success)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx="100" cy="120" r="6" fill="var(--warning)" opacity="0.15" />
      <path d="M100 117 V121 M100 123 V123.5" stroke="var(--warning)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <circle cx="158" cy="120" r="6" fill="var(--primary)" opacity="0.15" />
      <path d="M155 120 L161 120 M158 117 L158 123" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function ReposIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="50" fill="var(--primary)" opacity="0.04" />
      <circle cx="100" cy="80" r="35" fill="var(--primary)" opacity="0.04" />
      <circle cx="100" cy="50" r="6" fill="var(--primary)" opacity="0.25" stroke="var(--primary)" strokeWidth="1.5" />
      <circle cx="60" cy="80" r="5" fill="var(--success)" opacity="0.25" stroke="var(--success)" strokeWidth="1.5" />
      <circle cx="140" cy="80" r="5" fill="var(--warning)" opacity="0.25" stroke="var(--warning)" strokeWidth="1.5" />
      <circle cx="80" cy="110" r="5" fill="var(--primary)" opacity="0.2" stroke="var(--primary)" strokeWidth="1" />
      <circle cx="120" cy="110" r="5" fill="var(--primary)" opacity="0.2" stroke="var(--primary)" strokeWidth="1" />
      <path d="M100 56 L100 70" stroke="var(--primary)" strokeWidth="1.5" opacity="0.3" />
      <path d="M100 70 L65 78" stroke="var(--success)" strokeWidth="1.5" opacity="0.3" />
      <path d="M100 70 L135 78" stroke="var(--warning)" strokeWidth="1.5" opacity="0.3" />
      <circle cx="100" cy="70" r="3" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" opacity="0.4" />
      <path d="M64 85 L80 107" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />
      <path d="M136 85 L120 107" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />
      <rect x="30" y="128" width="140" height="20" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <rect x="38" y="134" width="8" height="8" rx="2" fill="var(--primary)" opacity="0.15" />
      <rect x="50" y="135" width="40" height="3" rx="1.5" fill="var(--foreground)" opacity="0.2" />
      <rect x="50" y="141" width="60" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="130" y="134" width="32" height="8" rx="4" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.2" />
    </svg>
  );
}

export function IntegrationsIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="24" fill="var(--primary)" fillOpacity="0.06" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.2" />
      <circle cx="100" cy="80" r="8" fill="var(--primary)" opacity="0.2" />
      <path d="M100 72 V68" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M100 88 V92" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M92 80 H88" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M108 80 H112" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <rect x="28" y="28" width="44" height="28" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="44" cy="38" r="4" fill="var(--primary)" opacity="0.2" />
      <rect x="52" y="36" width="14" height="3" rx="1.5" fill="var(--foreground)" opacity="0.2" />
      <rect x="52" y="42" width="10" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="128" y="28" width="44" height="28" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="144" cy="38" r="4" fill="var(--success)" opacity="0.2" />
      <rect x="152" y="36" width="14" height="3" rx="1.5" fill="var(--foreground)" opacity="0.2" />
      <rect x="152" y="42" width="10" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="28" y="104" width="44" height="28" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="44" cy="114" r="4" fill="var(--warning)" opacity="0.2" />
      <rect x="52" y="112" width="14" height="3" rx="1.5" fill="var(--foreground)" opacity="0.2" />
      <rect x="52" y="118" width="10" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="128" y="104" width="44" height="28" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="144" cy="114" r="4" fill="var(--destructive)" opacity="0.2" />
      <rect x="152" y="112" width="14" height="3" rx="1.5" fill="var(--foreground)" opacity="0.2" />
      <rect x="152" y="118" width="10" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.12" />
      <path d="M72 42 Q86 42 92 68" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
      <path d="M128 42 Q114 42 108 68" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
      <path d="M72 118 Q86 118 92 92" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
      <path d="M128 118 Q114 118 108 92" stroke="var(--primary)" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

export function ProjectsIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="20" width="120" height="30" rx="8" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M40 28 Q40 20 48 20 H72 L78 26 H152 Q160 26 160 34" fill="none" stroke="var(--primary)" strokeWidth="1.5" opacity="0.3" />
      <rect x="48" y="30" width="20" height="4" rx="2" fill="var(--primary)" opacity="0.4" />
      <rect x="48" y="38" width="40" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.2" />
      <circle cx="140" cy="35" r="8" fill="var(--primary)" fillOpacity="0.08" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" />
      <path d="M137 35 L139 37 L143 33" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <rect x="28" y="62" width="68" height="40" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="36" y="70" width="18" height="4" rx="2" fill="var(--primary)" opacity="0.35" />
      <rect x="36" y="78" width="50" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="36" y="85" width="36" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="36" y="92" width="20" height="3" rx="1.5" fill="var(--success)" opacity="0.25" />
      <rect x="104" y="62" width="68" height="40" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="112" y="70" width="24" height="4" rx="2" fill="var(--warning)" opacity="0.35" />
      <rect x="112" y="78" width="46" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.2" />
      <rect x="112" y="85" width="30" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="112" y="92" width="18" height="3" rx="1.5" fill="var(--warning)" opacity="0.25" />
      <rect x="50" y="114" width="100" height="32" rx="10" fill="var(--card)" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
      <path d="M96 126 L104 126 M100 122 L100 130" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <text x="100" y="140" textAnchor="middle" fill="var(--primary)" fontSize="7" fontFamily="system-ui" opacity="0.4">New Project</text>
    </svg>
  );
}

export function NotificationsIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 220 176" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="notif-bell-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="notif-bell-side" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="notif-badge-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--destructive)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--destructive)" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="notif-card-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--card)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
        <linearGradient id="notif-platform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--border)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--border)" stopOpacity="0.1" />
        </linearGradient>
        <filter id="notif-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--primary)" floodOpacity="0.12" />
        </filter>
        <filter id="notif-card-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="var(--foreground)" floodOpacity="0.06" />
        </filter>
        <filter id="notif-badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--destructive)" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="110" cy="88" rx="70" ry="60" fill="var(--primary)" opacity="0.03" />
      <ellipse cx="110" cy="88" rx="48" ry="42" fill="var(--primary)" opacity="0.04" />

      {/* 3D Platform / base ellipse */}
      <ellipse cx="110" cy="142" rx="60" ry="10" fill="url(#notif-platform)" />

      {/* Bell — back shadow face (3D depth) */}
      <path d="M88 96 Q88 66 110 54 Q132 66 132 96 V108 H88 Z"
        fill="var(--primary)" opacity="0.06" transform="translate(4, 4)" />

      {/* Bell — main body with gradient */}
      <path d="M88 96 Q88 66 110 54 Q132 66 132 96 V108 H88 Z"
        fill="url(#notif-bell-face)" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.25" filter="url(#notif-shadow)" />

      {/* Bell — left highlight (3D curvature) */}
      <path d="M92 96 Q92 70 106 58 Q94 68 94 96 V106 H92 Z"
        fill="white" opacity="0.08" />

      {/* Bell — bottom bar */}
      <rect x="82" y="108" width="56" height="6" rx="3" fill="var(--primary)" opacity="0.15" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" />

      {/* Bell — clapper */}
      <ellipse cx="110" cy="118" rx="6" ry="4" fill="var(--primary)" opacity="0.18" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" />

      {/* Bell — top ring */}
      <path d="M105 48 Q110 42 115 48" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
      <circle cx="110" cy="42" r="3" fill="var(--primary)" opacity="0.2" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.25" />

      {/* 3D notification badge (top-right) */}
      <g filter="url(#notif-badge-shadow)">
        <circle cx="134" cy="56" r="12" fill="url(#notif-badge-grad)" />
        <circle cx="134" cy="56" r="12" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
        <text x="134" y="60.5" textAnchor="middle" fill="white" fontSize="11" fontFamily="system-ui" fontWeight="700">3</text>
        {/* Badge highlight */}
        <ellipse cx="131" cy="51" rx="4" ry="2.5" fill="white" opacity="0.2" />
      </g>

      {/* Floating card 1 (left) — 3D tilted */}
      <g transform="translate(18, 68) rotate(-6, 40, 20)" filter="url(#notif-card-shadow)">
        <rect width="58" height="32" rx="8" fill="url(#notif-card-grad)" stroke="var(--border)" strokeWidth="1" />
        <circle cx="14" cy="16" r="5" fill="var(--primary)" opacity="0.12" />
        <rect x="24" y="11" width="24" height="3.5" rx="1.75" fill="var(--foreground)" opacity="0.15" />
        <rect x="24" y="18" width="18" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.1" />
        <rect x="24" y="24" width="28" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.07" />
        {/* Unread dot */}
        <circle cx="52" cy="8" r="2.5" fill="var(--primary)" opacity="0.5" />
      </g>

      {/* Floating card 2 (right) — 3D tilted other direction */}
      <g transform="translate(144, 76) rotate(5, 30, 18)" filter="url(#notif-card-shadow)">
        <rect width="54" height="30" rx="8" fill="url(#notif-card-grad)" stroke="var(--border)" strokeWidth="1" />
        <circle cx="14" cy="15" r="5" fill="var(--success)" opacity="0.15" />
        <path d="M12 15 L13.5 16.5 L16.5 13" stroke="var(--success)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <rect x="24" y="10" width="22" height="3.5" rx="1.75" fill="var(--foreground)" opacity="0.15" />
        <rect x="24" y="17" width="16" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.1" />
        <rect x="24" y="23" width="24" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.07" />
      </g>

      {/* Floating card 3 (bottom-left, smaller, receding) */}
      <g transform="translate(32, 112) rotate(-3, 24, 12)" opacity="0.7" filter="url(#notif-card-shadow)">
        <rect width="46" height="24" rx="6" fill="url(#notif-card-grad)" stroke="var(--border)" strokeWidth="0.75" />
        <circle cx="12" cy="12" r="4" fill="var(--warning)" opacity="0.15" />
        <rect x="20" y="8" width="18" height="3" rx="1.5" fill="var(--foreground)" opacity="0.12" />
        <rect x="20" y="14" width="14" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.08" />
      </g>

      {/* Sparkle particles */}
      <circle cx="60" cy="42" r="2" fill="var(--primary)" opacity="0.12">
        <animate attributeName="opacity" values="0.12;0.25;0.12" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="160" cy="38" r="1.5" fill="var(--primary)" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.22;0.1" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="46" cy="96" r="1.5" fill="var(--primary)" opacity="0.08">
        <animate attributeName="opacity" values="0.08;0.18;0.08" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="174" cy="100" r="2" fill="var(--success)" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3.5s" repeatCount="indefinite" />
      </circle>

      {/* Small star sparkles */}
      <g opacity="0.15">
        <path d="M52 58 L53 55 L54 58 L57 59 L54 60 L53 63 L52 60 L49 59 Z" fill="var(--primary)">
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur="2.8s" repeatCount="indefinite" />
        </path>
        <path d="M168 70 L169 68 L170 70 L172 71 L170 72 L169 74 L168 72 L166 71 Z" fill="var(--primary)">
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3.2s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}

export function HistoryIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="44" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
      <circle cx="100" cy="80" r="36" fill="var(--primary)" opacity="0.04" />
      <path d="M100 52 V80 L120 92" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      <circle cx="100" cy="80" r="4" fill="var(--primary)" opacity="0.25" />
      <circle cx="100" cy="48" r="2.5" fill="var(--primary)" opacity="0.2" />
      <circle cx="100" cy="112" r="2.5" fill="var(--primary)" opacity="0.2" />
      <circle cx="68" cy="80" r="2.5" fill="var(--primary)" opacity="0.2" />
      <circle cx="132" cy="80" r="2.5" fill="var(--primary)" opacity="0.2" />
      <path d="M64 56 L60 48 L68 50" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      <rect x="30" y="130" width="140" height="16" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <rect x="38" y="135" width="20" height="3" rx="1.5" fill="var(--primary)" opacity="0.2" />
      <rect x="62" y="135" width="20" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.1" />
      <rect x="86" y="135" width="20" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.08" />
      <rect x="110" y="135" width="20" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.06" />
      <rect x="38" y="140" width="14" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.1" />
    </svg>
  );
}

export function TicketsIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="35" y="22" width="130" height="36" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
      <circle cx="55" cy="40" r="8" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" />
      <path d="M52 40 L54 42 L58 38" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <rect x="70" y="34" width="40" height="4" rx="2" fill="var(--foreground)" opacity="0.2" />
      <rect x="70" y="42" width="60" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="140" y="34" width="16" height="8" rx="4" fill="var(--success)" fillOpacity="0.1" stroke="var(--success)" strokeWidth="0.75" strokeOpacity="0.3" />
      <rect x="35" y="64" width="130" height="36" rx="10" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="55" cy="82" r="8" fill="var(--warning)" fillOpacity="0.1" stroke="var(--warning)" strokeWidth="1" strokeOpacity="0.2" />
      <rect x="51" y="80" width="8" height="4" rx="1" fill="var(--warning)" opacity="0.3" />
      <rect x="70" y="76" width="48" height="4" rx="2" fill="var(--foreground)" opacity="0.2" />
      <rect x="70" y="84" width="70" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.12" />
      <rect x="140" y="76" width="16" height="8" rx="4" fill="var(--warning)" fillOpacity="0.1" stroke="var(--warning)" strokeWidth="0.75" strokeOpacity="0.3" />
      <rect x="35" y="106" width="130" height="36" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" opacity="0.4" />
      <circle cx="55" cy="124" r="8" fill="var(--muted-foreground)" opacity="0.06" stroke="var(--border)" strokeWidth="1" />
      <rect x="70" y="118" width="36" height="4" rx="2" fill="var(--foreground)" opacity="0.12" />
      <rect x="70" y="126" width="54" height="3" rx="1.5" fill="var(--muted-foreground)" opacity="0.08" />
    </svg>
  );
}

export function WorkflowIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="14" fill="var(--primary)" fillOpacity="0.08" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.25" />
      <rect x="34" y="36" width="12" height="8" rx="2" fill="var(--primary)" opacity="0.2" />
      <circle cx="100" cy="40" r="14" fill="var(--success)" fillOpacity="0.08" stroke="var(--success)" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M95 40 L99 44 L105 36" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <circle cx="160" cy="40" r="14" fill="var(--warning)" fillOpacity="0.08" stroke="var(--warning)" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M156 36 L164 44 M164 36 L156 44" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M54 40 L86 40" stroke="var(--primary)" strokeWidth="1.5" opacity="0.2" markerEnd="url(#arrow)" />
      <path d="M114 40 L146 40" stroke="var(--primary)" strokeWidth="1.5" opacity="0.2" />
      <path d="M82 40 L86 40 M84 38 L86 40 L84 42" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      <path d="M142 40 L146 40 M144 38 L146 40 L144 42" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      <circle cx="70" cy="110" r="14" fill="var(--primary)" opacity="0.06" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="64" y="106" width="12" height="8" rx="2" fill="var(--muted-foreground)" opacity="0.15" />
      <circle cx="130" cy="110" r="14" fill="var(--primary)" opacity="0.06" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="124" y="106" width="12" height="8" rx="2" fill="var(--muted-foreground)" opacity="0.15" />
      <path d="M40 54 L70 96" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
      <path d="M100 54 L70 96" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
      <path d="M100 54 L130 96" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
      <path d="M160 54 L130 96" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
      <rect x="56" y="134" width="88" height="14" rx="7" fill="var(--card)" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
      <text x="100" y="144" textAnchor="middle" fill="var(--primary)" fontSize="7" fontFamily="system-ui" opacity="0.4">+ Add Node</text>
    </svg>
  );
}

export function NexusIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="48" fill="var(--primary)" opacity="0.03" />
      <circle cx="100" cy="80" r="32" fill="var(--primary)" opacity="0.04" />
      <circle cx="100" cy="80" r="16" fill="var(--primary)" opacity="0.06" />
      <circle cx="100" cy="52" r="4" fill="var(--primary)" opacity="0.3" />
      <circle cx="130" cy="66" r="3" fill="var(--success)" opacity="0.3" />
      <circle cx="132" cy="96" r="3" fill="var(--warning)" opacity="0.3" />
      <circle cx="100" cy="110" r="3" fill="var(--destructive)" opacity="0.25" />
      <circle cx="68" cy="96" r="3" fill="var(--primary)" opacity="0.2" />
      <circle cx="70" cy="66" r="3" fill="var(--success)" opacity="0.2" />
      <path d="M100 56 L127 66" stroke="var(--primary)" strokeWidth="0.75" opacity="0.2" />
      <path d="M130 69 L130 93" stroke="var(--primary)" strokeWidth="0.75" opacity="0.15" />
      <path d="M129 96 L103 108" stroke="var(--primary)" strokeWidth="0.75" opacity="0.15" />
      <path d="M97 108 L71 96" stroke="var(--primary)" strokeWidth="0.75" opacity="0.15" />
      <path d="M70 93 L70 69" stroke="var(--primary)" strokeWidth="0.75" opacity="0.15" />
      <path d="M73 66 L97 56" stroke="var(--primary)" strokeWidth="0.75" opacity="0.2" />
      <circle cx="100" cy="80" r="5" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.3" />
      <path d="M98 78 L100 82 L103 77" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <rect x="30" y="130" width="60" height="16" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <rect x="38" y="135" width="20" height="3" rx="1.5" fill="var(--primary)" opacity="0.2" />
      <rect x="38" y="140" width="36" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.1" />
      <rect x="110" y="130" width="60" height="16" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="1" />
      <rect x="118" y="135" width="24" height="3" rx="1.5" fill="var(--success)" opacity="0.2" />
      <rect x="118" y="140" width="40" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.1" />
    </svg>
  );
}

export function SprintPlanIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 220 176" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sp-cal-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--card)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
        <linearGradient id="sp-cal-header" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="sp-sparkle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="sp-platform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--border)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--border)" stopOpacity="0.08" />
        </linearGradient>
        <filter id="sp-shadow" x="-15%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="var(--primary)" floodOpacity="0.1" />
        </filter>
        <filter id="sp-card-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="var(--foreground)" floodOpacity="0.06" />
        </filter>
        <filter id="sp-ai-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="var(--primary)" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="110" cy="88" rx="72" ry="58" fill="var(--primary)" opacity="0.03" />

      {/* 3D Platform */}
      <ellipse cx="110" cy="148" rx="64" ry="10" fill="url(#sp-platform)" />

      {/* Calendar — back shadow (depth) */}
      <rect x="56" y="32" width="108" height="112" rx="14" fill="var(--primary)" opacity="0.05" transform="translate(4, 4)" />

      {/* Calendar — main body */}
      <rect x="56" y="32" width="108" height="112" rx="14" fill="url(#sp-cal-face)" stroke="var(--border)" strokeWidth="1.2" filter="url(#sp-shadow)" />

      {/* Calendar — header band */}
      <rect x="56" y="32" width="108" height="28" rx="14" fill="url(#sp-cal-header)" />
      <rect x="56" y="46" width="108" height="14" fill="url(#sp-cal-header)" />

      {/* Calendar — binding rings */}
      <rect x="80" y="26" width="6" height="16" rx="3" fill="var(--primary)" opacity="0.25" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.3" />
      <rect x="134" y="26" width="6" height="16" rx="3" fill="var(--primary)" opacity="0.25" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.3" />

      {/* Calendar — day labels */}
      {['M', 'T', 'W', 'T', 'F'].map((d, i) => (
        <text key={d + i} x={72 + i * 18} y="54" textAnchor="middle" fill="var(--primary-foreground)" fontSize="7" fontFamily="system-ui" fontWeight="600" opacity="0.7">{d}</text>
      ))}

      {/* Calendar — grid of day cells */}
      {[0, 1, 2].map(row =>
        [0, 1, 2, 3, 4].map(col => {
          const dayNum = row * 5 + col + 1;
          const isHighlight = dayNum >= 3 && dayNum <= 7;
          const isToday = dayNum === 5;
          return (
            <g key={`${row}-${col}`}>
              <rect
                x={63 + col * 18} y={62 + row * 24} width={14} height={14} rx={4}
                fill={isToday ? 'var(--primary)' : isHighlight ? 'var(--primary)' : 'var(--muted-foreground)'}
                opacity={isToday ? 0.25 : isHighlight ? 0.08 : 0.04}
                stroke={isToday ? 'var(--primary)' : 'none'} strokeWidth={isToday ? 1 : 0} strokeOpacity={0.4}
              />
              <text
                x={70 + col * 18} y={73 + row * 24} textAnchor="middle"
                fill={isToday ? 'var(--primary)' : 'var(--muted-foreground)'}
                fontSize="7" fontFamily="system-ui" fontWeight={isToday ? '700' : '500'}
                opacity={isToday ? 0.8 : 0.35}
              >{dayNum}</text>
            </g>
          );
        })
      )}

      {/* Sprint bar across week highlight */}
      <rect x="63" y="82" width="88" height="3" rx="1.5" fill="var(--primary)" opacity="0.2" />

      {/* Left highlight on calendar (3D edge) */}
      <rect x="56" y="60" width="3" height="80" rx="1.5" fill="white" opacity="0.06" />

      {/* Floating AI wand (top-right) */}
      <g filter="url(#sp-ai-glow)" transform="translate(152, 20)">
        <circle r="16" fill="var(--primary)" opacity="0.12" />
        <circle r="11" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.3" />
        <path d="M-3 -4 L0 -7 L3 -4 L0 -1 Z" fill="url(#sp-sparkle)" />
        <path d="M0 -7 L0 -11" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        <path d="M3 -4 L6 -4" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M-3 -4 L-6 -4" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M0 -1 L0 2" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
        <text y="9" textAnchor="middle" fill="var(--primary)" fontSize="6" fontFamily="system-ui" fontWeight="700" opacity="0.6">AI</text>
      </g>

      {/* Floating ticket card (left, tilted) */}
      <g transform="translate(10, 72) rotate(-8, 28, 18)" filter="url(#sp-card-shadow)">
        <rect width="42" height="32" rx="7" fill="url(#sp-cal-face)" stroke="var(--border)" strokeWidth="0.75" />
        <rect x="8" y="8" width="16" height="3" rx="1.5" fill="var(--foreground)" opacity="0.15" />
        <rect x="8" y="14" width="26" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.1" />
        <rect x="8" y="20" width="20" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.07" />
        <rect x="8" y="25" width="10" height="3" rx="1.5" fill="var(--success)" opacity="0.2" />
      </g>

      {/* Floating points badge (right) */}
      <g transform="translate(174, 96) rotate(6, 20, 14)" filter="url(#sp-card-shadow)">
        <rect width="38" height="26" rx="7" fill="url(#sp-cal-face)" stroke="var(--border)" strokeWidth="0.75" />
        <text x="19" y="13" textAnchor="middle" fill="var(--primary)" fontSize="8" fontFamily="system-ui" fontWeight="800" opacity="0.5">54</text>
        <text x="19" y="21" textAnchor="middle" fill="var(--muted-foreground)" fontSize="5.5" fontFamily="system-ui" opacity="0.35">pts</text>
      </g>

      {/* Sparkle particles */}
      <circle cx="42" cy="44" r="2" fill="var(--primary)" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="190" cy="60" r="1.5" fill="var(--success)" opacity="0.12">
        <animate attributeName="opacity" values="0.12;0.24;0.12" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="30" cy="130" r="1.5" fill="var(--primary)" opacity="0.08">
        <animate attributeName="opacity" values="0.08;0.18;0.08" dur="3.8s" repeatCount="indefinite" />
      </circle>
      <g opacity="0.15">
        <path d="M194 42 L195 39 L196 42 L199 43 L196 44 L195 47 L194 44 L191 43 Z" fill="var(--primary)">
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur="2.8s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}

export function TicketIntelligenceIllustration({ className }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 220 176" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ti-brain-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="ti-card-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--card)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
        <linearGradient id="ti-orb-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="ti-platform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--border)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--border)" stopOpacity="0.08" />
        </linearGradient>
        <filter id="ti-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="var(--primary)" floodOpacity="0.12" />
        </filter>
        <filter id="ti-card-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="var(--foreground)" floodOpacity="0.06" />
        </filter>
        <filter id="ti-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="var(--primary)" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Ambient rings */}
      <ellipse cx="110" cy="82" rx="74" ry="60" fill="var(--primary)" opacity="0.02" />
      <ellipse cx="110" cy="82" rx="50" ry="42" fill="var(--primary)" opacity="0.03" />

      {/* 3D Platform */}
      <ellipse cx="110" cy="150" rx="62" ry="10" fill="url(#ti-platform)" />

      {/* Central brain orb — shadow layer */}
      <circle cx="114" cy="82" r="34" fill="var(--primary)" opacity="0.04" />

      {/* Central brain orb — main */}
      <circle cx="110" cy="78" r="34" fill="url(#ti-orb-grad)" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.15" filter="url(#ti-glow)" />

      {/* Brain icon in center */}
      <g transform="translate(110, 78)" filter="url(#ti-shadow)">
        {/* Stylized brain paths */}
        <path d="M-10 -4 C-10 -12 -4 -16 0 -16 C4 -16 10 -12 10 -4" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M0 -16 V-4" stroke="var(--primary)" strokeWidth="1.5" strokeOpacity="0.25" />
        <path d="M-10 -4 C-10 4 -6 8 0 8 C6 8 10 4 10 -4" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" />
        <path d="M-6 -8 C-2 -6 2 -6 6 -8" fill="none" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.2" />
        <path d="M-7 0 C-3 2 3 2 7 0" fill="none" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.2" />
        {/* Pulse ring */}
        <circle r="18" fill="none" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.1" strokeDasharray="4 4">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Neural connection lines to cards */}
      <path d="M82 66 L52 50" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.12" strokeDasharray="3 3" />
      <path d="M138 66 L168 50" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.12" strokeDasharray="3 3" />
      <path d="M82 94 L38 114" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.1" strokeDasharray="3 3" />
      <path d="M138 94 L178 114" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.1" strokeDasharray="3 3" />

      {/* Connection dots */}
      <circle cx="82" cy="66" r="2" fill="var(--primary)" opacity="0.2" />
      <circle cx="138" cy="66" r="2" fill="var(--primary)" opacity="0.2" />
      <circle cx="82" cy="94" r="2" fill="var(--primary)" opacity="0.15" />
      <circle cx="138" cy="94" r="2" fill="var(--primary)" opacity="0.15" />

      {/* Floating ticket card 1 (top-left) */}
      <g transform="translate(14, 28) rotate(-5, 32, 20)" filter="url(#ti-card-shadow)">
        <rect width="56" height="36" rx="8" fill="url(#ti-card-grad)" stroke="var(--border)" strokeWidth="0.75" />
        <rect x="8" y="8" width="12" height="3" rx="1.5" fill="var(--primary)" opacity="0.35" />
        <rect x="24" y="8" width="22" height="3" rx="1.5" fill="var(--foreground)" opacity="0.12" />
        <rect x="8" y="15" width="38" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.1" />
        <rect x="8" y="21" width="28" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.07" />
        {/* Risk badge */}
        <rect x="8" y="27" width="16" height="4" rx="2" fill="var(--success)" opacity="0.15" />
        <rect x="28" y="27" width="8" height="4" rx="2" fill="var(--primary)" opacity="0.12" />
      </g>

      {/* Floating ticket card 2 (top-right) */}
      <g transform="translate(152, 26) rotate(6, 30, 20)" filter="url(#ti-card-shadow)">
        <rect width="54" height="36" rx="8" fill="url(#ti-card-grad)" stroke="var(--border)" strokeWidth="0.75" />
        <rect x="8" y="8" width="12" height="3" rx="1.5" fill="var(--warning)" opacity="0.35" />
        <rect x="24" y="8" width="20" height="3" rx="1.5" fill="var(--foreground)" opacity="0.12" />
        <rect x="8" y="15" width="34" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.1" />
        <rect x="8" y="21" width="26" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.07" />
        {/* Risk badge */}
        <rect x="8" y="27" width="16" height="4" rx="2" fill="var(--warning)" opacity="0.15" />
        <rect x="28" y="27" width="8" height="4" rx="2" fill="var(--primary)" opacity="0.12" />
      </g>

      {/* Floating insight card (bottom-left) */}
      <g transform="translate(6, 102) rotate(-4, 28, 16)" opacity="0.85" filter="url(#ti-card-shadow)">
        <rect width="50" height="30" rx="7" fill="url(#ti-card-grad)" stroke="var(--border)" strokeWidth="0.75" />
        <circle cx="14" cy="15" r="5" fill="var(--primary)" opacity="0.1" />
        <path d="M12 15 L13.5 16.5 L16.5 13" stroke="var(--primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        <rect x="24" y="10" width="18" height="3" rx="1.5" fill="var(--foreground)" opacity="0.12" />
        <rect x="24" y="16" width="14" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.08" />
        <rect x="24" y="22" width="20" height="2.5" rx="1.25" fill="var(--success)" opacity="0.12" />
      </g>

      {/* Floating insight card (bottom-right) */}
      <g transform="translate(164, 104) rotate(5, 26, 16)" opacity="0.85" filter="url(#ti-card-shadow)">
        <rect width="48" height="28" rx="7" fill="url(#ti-card-grad)" stroke="var(--border)" strokeWidth="0.75" />
        <rect x="8" y="7" width="20" height="5" rx="2.5" fill="var(--destructive)" opacity="0.12" stroke="var(--destructive)" strokeWidth="0.5" strokeOpacity="0.2" />
        <text x="18" y="11.5" textAnchor="middle" fill="var(--destructive)" fontSize="4.5" fontFamily="system-ui" fontWeight="700" opacity="0.5">HIGH</text>
        <rect x="8" y="16" width="30" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.1" />
        <rect x="8" y="22" width="22" height="2.5" rx="1.25" fill="var(--muted-foreground)" opacity="0.07" />
      </g>

      {/* AI label badge (bottom center) */}
      <g transform="translate(88, 120)">
        <rect width="44" height="16" rx="8" fill="var(--primary)" opacity="0.08" stroke="var(--primary)" strokeWidth="0.75" strokeOpacity="0.2" />
        <path d="M12 8 L13.5 5 L15 8 L18 9 L15 10 L13.5 13 L12 10 L9 9 Z" fill="var(--primary)" opacity="0.4" />
        <text x="28" y="11.5" textAnchor="middle" fill="var(--primary)" fontSize="6" fontFamily="system-ui" fontWeight="700" opacity="0.5">AI</text>
      </g>

      {/* Sparkle particles */}
      <circle cx="46" cy="76" r="1.5" fill="var(--primary)" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.22;0.1" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="176" cy="82" r="2" fill="var(--primary)" opacity="0.08">
        <animate attributeName="opacity" values="0.08;0.2;0.08" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="96" cy="30" r="1.5" fill="var(--success)" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="140" cy="140" r="1.5" fill="var(--primary)" opacity="0.08">
        <animate attributeName="opacity" values="0.08;0.16;0.08" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Star sparkles */}
      <g opacity="0.15">
        <path d="M36 50 L37 47 L38 50 L41 51 L38 52 L37 55 L36 52 L33 51 Z" fill="var(--primary)">
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur="2.8s" repeatCount="indefinite" />
        </path>
        <path d="M186 90 L187 88 L188 90 L190 91 L188 92 L187 94 L186 92 L184 91 Z" fill="var(--primary)">
          <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3.2s" repeatCount="indefinite" />
        </path>
      </g>
    </svg>
  );
}
