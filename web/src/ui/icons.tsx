type P = { size?: number };
const s = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Pause = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 6.5v11M15 6.5v11" /></svg>;
export const Back = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>;
export const Next = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>;
export const Restart = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 4.5v3.5h3.5" /></svg>;
export const Undo = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9a5 5 0 0 1 0 10h-2" /></svg>;
export const Lamp = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>;
export const Gear = ({ size }: P) => (
  <svg {...s(size)} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></svg>
);
/** A spade. */
export const Spade = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M12 2.5v10" /><path d="M9.5 2.5h5" /><path d="M8 12.5h8v3.5a4 4 0 0 1-8 0z" /></svg>;
/** A hazel stake with a ribbon. */
export const Stake = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M10 21.5 8.5 3" /><path d="M8.7 4.5c3-.6 6 .2 8.5 1.8-2.5.9-5.5 1.6-8.2 1.4" fill="#e03a3a" stroke="#e03a3a" /></svg>;
/** A pine tree. */
export const Tree = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M12 2.5 7.5 9h3L6 15h4.5L5 21h14l-5.5-6H18l-4.5-6h3z" /><path d="M12 21v1.5" /></svg>;
/** A truffle. */
export const Truffle = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M12 4.5c4 0 7 3 7 7.2 0 3.8-3.1 6.8-7 6.8s-7-3-7-6.8c0-4.2 3-7.2 7-7.2z" /><path d="M9 10.5h.01M13 9h.01M15 13h.01M10.5 14.5h.01" strokeWidth="2.6" /></svg>;
/** Stars are acorns, golden when earned. */
export const Star = ({ size = 22, on = true }: P & { on?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M6.5 10.5c0 6 3 10 5.5 11 2.5-1 5.5-5 5.5-11z" fill={on ? '#e8a040' : 'none'} stroke={on ? '#a86420' : 'rgba(255,255,255,.55)'} strokeWidth="1.2" />
    <path d="M5 10.5c.5-3.5 3.5-5.5 7-5.5s6.5 2 7 5.5z" fill={on ? '#8a5a2a' : 'none'} stroke={on ? '#5a3a14' : 'rgba(255,255,255,.55)'} strokeWidth="1.2" />
    <path d="M12 5V2.5" stroke={on ? '#5a3a14' : 'rgba(255,255,255,.55)'} strokeWidth="1.4" strokeLinecap="round" />
    {on && <path d="M9 13c.3 2.5 1.3 4.5 2.5 5.5" stroke="#ffd890" strokeWidth="1" strokeLinecap="round" fill="none" />}
  </svg>
);
