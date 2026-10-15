/** Getar sangat singkat sebagai umpan balik sentuh (Android); diam saja bila tidak didukung. */
export function getar(ms = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    // beberapa peramban menolak getar tanpa interaksi; abaikan
  }
}
