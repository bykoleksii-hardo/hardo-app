import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'HARDO — AI mock interviews for IB';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FBF7EE',
          padding: '72px 80px',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              border: '2px solid #11161E',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 600,
              color: '#11161E',
            }}
          >
            H
          </div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: '0.16em',
              color: '#11161E',
              fontWeight: 500,
            }}
          >
            HARDO
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 80,
              lineHeight: 1.05,
              color: '#11161E',
              maxWidth: 980,
            }}
          >
            Practice against <span style={{ fontStyle: 'italic', color: '#B88736' }}>the bar.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#11161E',
              opacity: 0.7,
              maxWidth: 880,
              lineHeight: 1.35,
            }}
          >
            AI mock interviews for IB. Twelve questions per session, voice or text, a real scorecard at the end.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 16,
            letterSpacing: '0.22em',
            color: '#B88736',
          }}
        >
          <div>— LETTER GRADE PER ANSWER</div>
          <div>SIX-AXIS RADAR</div>
          <div>HIRE CALL</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
