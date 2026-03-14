import { toDataURL } from 'qrcode';

/**
 * Generates a QR code as a data URL for embedding in HTML/images
 * @param url - The URL to encode in the QR code
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    const dataUrl = await toDataURL(url, {
      width: 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

/**
 * Builds the client portal URL for an order
 * @param orderNumber - The order number
 * @returns The full URL to the client portal for this order
 */
export function buildOrderPortalURL(orderNumber: string): string {
  // Use window.location.origin for client-side, or a default for SSR
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : '';
  return `${baseUrl}/orden/${orderNumber}`;
}
