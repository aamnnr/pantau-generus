/**
 * Normalisasi No. HP Indonesia ke format 62xxxxxxxxxx (ARCHITECTURE §3).
 * Mengembalikan null bila bukan nomor seluler Indonesia yang wajar.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;

  // Seluler Indonesia: 62 8xx, total 10–13 digit setelah 62.
  if (!/^628\d{8,11}$/.test(digits)) return null;
  return digits;
}

export function phoneToEmail(normalizedPhone: string, domain: string): string {
  return `${normalizedPhone}@${domain}`;
}
