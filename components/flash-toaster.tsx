"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const NAMA = "flash";

/** Nilai cookie bisa ter-encode lebih dari sekali tergantung lapisan yang menulisnya. */
function decode(nilai: string) {
  let s = nilai;
  try {
    for (let i = 0; i < 3 && /%[0-9A-F]{2}/i.test(s); i++) s = decodeURIComponent(s);
  } catch {
    // biarkan apa adanya bila bukan teks ter-encode yang valid
  }
  return s;
}

/** Menampilkan pesan dari setFlash() (Server Action → redirect) lalu menghapus cookie-nya. */
export function FlashToaster() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${NAMA}=`));
    if (!cookie) return;
    document.cookie = `${NAMA}=; Max-Age=0; path=/`;
    toast.success(decode(cookie.slice(NAMA.length + 1)));
  }, [pathname, searchParams]);

  return <Toaster />;
}
