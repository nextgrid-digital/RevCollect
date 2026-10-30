import type { Metadata } from 'next';

export const APP_URL = 'https://app.revcollect.ai';
export const APP_NAME = 'RevCollect';
export const APP_DESCRIPTION =
  'Collections inbox for bookkeepers. Connect Xero, QuickBooks Online, or Zoho Books. Draft follow-ups and send from Gmail.';

export function publicMetadata({
  title,
  description,
  path,
  absoluteTitle = false
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: APP_DESCRIPTION
        }
      ]
    }
  };
}
