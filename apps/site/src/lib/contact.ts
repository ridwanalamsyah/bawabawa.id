/** Business WhatsApp number in 62… format (configure NEXT_PUBLIC_WA_NUMBER). */
export const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "6281234567890";

export function waLink(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
