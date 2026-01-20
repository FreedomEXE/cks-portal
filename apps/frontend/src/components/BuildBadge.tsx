import { APP_VERSION, BUILD_TIME } from '../version';

export default function BuildBadge() {
  const shortTime = BUILD_TIME !== 'unknown' ? BUILD_TIME.replace('T', ' ').replace('Z', ' UTC') : BUILD_TIME;

  return (
    <div
      style={{
        position: 'fixed',
        right: 10,
        bottom: 8,
        fontSize: 11,
        color: '#64748b',
        opacity: 0.7,
        zIndex: 9999,
        pointerEvents: 'none',
        fontFamily: 'inherit',
      }}
    >
      {`v${APP_VERSION}${shortTime !== 'unknown' ? ` · ${shortTime}` : ''}`}
    </div>
  );
}
