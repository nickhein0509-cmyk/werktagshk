/** Decorative pipework study. No measured or simulated engineering values. */
export function WorkshopOrbit() {
  return (
    <svg className="workshop-orbit" viewBox="0 0 480 480" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="atelier-copper" x1="80" y1="80" x2="400" y2="420" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4d5b1" /><stop offset=".45" stopColor="#b6774f" /><stop offset=".7" stopColor="#f2c69c" /><stop offset="1" stopColor="#714d3c" />
        </linearGradient>
        <radialGradient id="atelier-light"><stop stopColor="#b78a5d" stopOpacity=".18" /><stop offset="1" stopColor="#b78a5d" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="240" cy="240" r="235" fill="url(#atelier-light)" />
      <g stroke="#91b4ab" strokeOpacity=".25" strokeWidth=".75">
        <circle cx="240" cy="240" r="202" /><circle cx="240" cy="240" r="176" strokeDasharray="1 9" />
        <path d="M18 240h444M240 18v444M82 82l316 316M82 398 398 82" />
        <path d="M66 70h38M70 66v38M376 70h38M410 66v38M66 410h38M70 376v38M376 410h38M410 376v38" />
      </g>
      <g transform="rotate(-30 240 240)" stroke="url(#atelier-copper)" strokeLinecap="round">
        <rect x="133" y="122" width="214" height="236" rx="76" strokeWidth="17" />
        <path d="M184 407V214a56 56 0 0 1 112 0v52a56 56 0 0 1-112 0" strokeWidth="17" />
        <path d="M184 407V214a56 56 0 0 1 112 0v52a56 56 0 0 1-112 0" stroke="#ffe5c4" strokeOpacity=".35" strokeWidth="1.5" />
        <path d="M125 224h16m-16 10h16m198 12h16m-16 10h16M176 373h16m-16 10h16" strokeWidth="3" />
      </g>
      <g fill="#e8b78d"><circle cx="240" cy="38" r="3" /><circle cx="442" cy="240" r="3" /><circle cx="38" cy="240" r="3" /></g>
    </svg>
  );
}
