import { ImageResponse } from 'next/og';

export const alt = 'codR — Gamified Coding Battle Arena';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Social preview card, generated at build time. Kept to system fonts and flat
 * shapes so it never depends on a network fetch.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(220,38,38,0.25), transparent 45%), radial-gradient(circle at 80% 75%, rgba(249,115,22,0.2), transparent 45%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 160,
            fontWeight: 800,
            letterSpacing: '-0.04em',
          }}
        >
          <span style={{ color: '#ffffff' }}>cod</span>
          <span style={{ color: '#ef4444' }}>R</span>
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 30,
            color: '#f87171',
            letterSpacing: '0.35em',
            fontWeight: 700,
          }}
        >
          DEATHMATCH EDITION
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            color: '#9ca3af',
            display: 'flex',
            gap: 16,
          }}
        >
          <span style={{ color: '#ef4444' }}>ELIMINATE</span>
          <span>·</span>
          <span style={{ color: '#fb923c' }}>CODE</span>
          <span>·</span>
          <span style={{ color: '#facc15' }}>SURVIVE</span>
        </div>

        <div
          style={{
            marginTop: 48,
            fontSize: 24,
            color: '#6b7280',
            display: 'flex',
          }}
        >
          1v1 coding battles · ELO ranking · Play vs the computer
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: 10,
            background: 'linear-gradient(90deg, #ef4444, #f97316, #facc15)',
          }}
        />
      </div>
    ),
    size
  );
}
