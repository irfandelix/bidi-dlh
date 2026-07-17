import { ImageResponse } from 'next/og';
 
// Route segment config
export const runtime = 'edge';
 
// Image metadata
export const size = {
  width: 64,
  height: 64,
};
export const contentType = 'image/png';
 
export default function Icon() {
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
          backgroundColor: '#ffffff',
          borderRadius: '16px',
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
            border: '2px solid #0f172a',
            borderRadius: '6px',
            padding: '1px 3px',
            fontSize: '16px',
            boxShadow: '1px 1px 0 0 #0f172a',
            marginBottom: '2px',
          }}
        >
          BIDI
        </div>
        <div style={{ color: '#0f172a', fontSize: '18px', lineHeight: 1 }}>
          DLH
        </div>
      </div>
    ),
    { ...size }
  );
}
