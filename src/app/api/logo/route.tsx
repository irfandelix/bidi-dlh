import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
          backgroundColor: '#ffffff', // kotak putih
          borderRadius: '128px', // rounded corners for the app icon itself
          fontWeight: 900,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#34d399', // emerald-400
            color: '#0f172a', // slate-900
            border: '16px solid #0f172a', // 2 * 8
            borderRadius: '96px', // xl = 12 * 8
            padding: '24px 72px', // px-3 py-1 scaled up
            fontSize: '144px', // text-2xl scaled up
            boxShadow: '32px 32px 0 0 #0f172a', // 4px * 8
            marginBottom: '32px', // space between BIDI and DLH
            letterSpacing: '4px',
          }}
        >
          BIDI
        </div>
        <div style={{ 
            color: '#0f172a', 
            fontSize: '192px', // text-3xl scaled up
            lineHeight: 1,
            letterSpacing: '-8px', // tracking-tight
            marginTop: '16px'
        }}>
          DLH
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
