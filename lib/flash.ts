import "server-only";
import { cookies } from "next/headers";

export const COOKIE_FLASH = "flash";

/**
 * Pesan sekali tampil yang bertahan melewati redirect setelah Server Action.
 * Dibaca & dihapus oleh <FlashToaster /> di client, jadi tidak httpOnly.
 */
export async function setFlash(pesan: string) {
  // Next.js sudah meng-encode nilai cookie; jangan di-encode dua kali.
  (await cookies()).set(COOKIE_FLASH, pesan, {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false,
  });
}

/** Ucapan setelah menyimpan (DESIGN §8). */
export function pesanTersimpan(apa: string) {
  return `Alhamdulillah Jaza Kumullahu Khoiro. ${apa}`;
}
