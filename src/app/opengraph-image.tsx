import { ImageResponse } from 'next/og';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/site';

export const alt = APP_DESCRIPTION;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#faf6f0',
        color: '#2c261c',
        padding: 72
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 1,
          color: '#c45c26'
        }}
      >
        {APP_NAME}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 58,
            fontWeight: 600,
            lineHeight: 1.12,
            letterSpacing: -1
          }}
        >
          Collections inbox for bookkeepers
        </div>
        <div style={{ display: 'flex', fontSize: 26, lineHeight: 1.4, color: '#5c5348' }}>
          Xero, QuickBooks Online, or Zoho Books. Drafts you send from Gmail.
        </div>
      </div>
    </div>,
    { ...size }
  );
}
