export default function PortalLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
    >
      {/* Outer square frame (transparent bg, white stroke) */}
      <rect x="10" y="10" width="180" height="180" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="2"/>

      {/* Inner circular motif (dot inside C curve, white) */}
      <path d="M 40 50 Q 40 30 60 30 Q 80 30 80 50 Q 80 70 60 70 Q 40 70 40 50 M 55 45 Q 55 43 56 43 Q 57 43 57 45 Q 57 47 56 47 Q 55 47 55 45" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>

      {/* CKS Text (bold, white, positioned) */}
      <text x="100" y="85" fontFamily="sans-serif" fontSize="48" fontWeight="bold" fill="currentColor" textAnchor="middle" dominantBaseline="middle">CKS</text>

      {/* PORTAL Subtitle (lighter, white, centered below) */}
      <text x="100" y="140" fontFamily="sans-serif" fontSize="20" fontWeight="normal" fill="currentColor" textAnchor="middle" dominantBaseline="middle">PORTAL</text>
    </svg>
  );
}