"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KUNCI = "petunjuk-pasang-ditutup";

function sudahDitutup() {
  try {
    return localStorage.getItem(KUNCI) === "1";
  } catch {
    return false;
  }
}

function tandaiDitutup() {
  try {
    localStorage.setItem(KUNCI, "1");
  } catch {
    // Penyimpanan diblokir (mode privat): petunjuk mungkin muncul lagi, tidak masalah.
  }
}

/**
 * Petunjuk "Tambahkan ke layar utama" sekali setelah masuk, bisa ditutup (DESIGN §10).
 * Android/Chrome: tombol Pasang memakai dialog bawaan. iPhone (Safari tidak punya dialog): langkah manual.
 */
export function PetunjukPasang() {
  const [acara, setAcara] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const terpasang = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
    if (terpasang || sudahDitutup()) return;

    const tangkap = (e: Event) => {
      e.preventDefault();
      setAcara(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", tangkap);
    // Tanpa beforeinstallprompt di iOS; dicek setelah mount agar tidak beda dengan HTML server.
    const idIos = window.setTimeout(() => setIos(/iphone|ipad|ipod/i.test(navigator.userAgent)), 0);
    return () => {
      window.removeEventListener("beforeinstallprompt", tangkap);
      window.clearTimeout(idIos);
    };
  }, []);

  if (!acara && !ios) return null;

  const tutup = () => {
    tandaiDitutup();
    setAcara(null);
    setIos(false);
  };

  return (
    <div
      role="region"
      aria-label="Pasang aplikasi"
      className="fixed inset-x-3 bottom-20 z-40 flex animate-muncul flex-col gap-3 rounded-2xl border bg-card p-4 shadow-[0_8px_24px_rgba(20,22,22,0.10)] print:hidden lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-base font-semibold">Pasang Pantau Generus</p>
          <p className="text-sm text-muted-foreground">
            {acara
              ? "Tambahkan ke layar utama agar bisa dibuka seperti aplikasi biasa."
              : "Ketuk tombol Bagikan di Safari, lalu pilih “Tambahkan ke Layar Utama”."}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Tutup petunjuk" onClick={tutup}>
          <X aria-hidden />
        </Button>
      </div>
      {acara && (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="lg" onClick={tutup}>
            Nanti saja
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={async () => {
              await acara.prompt();
              await acara.userChoice;
              tutup();
            }}
          >
            <Download aria-hidden />
            Pasang
          </Button>
        </div>
      )}
    </div>
  );
}
