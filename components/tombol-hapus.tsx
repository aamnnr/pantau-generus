"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";

/** Aksi merusak selalu lewat konfirmasi (DESIGN §1.5). */
export function TombolHapus({ action, judul, keterangan, label = "Hapus" }: {
  action: () => Promise<FormState | void>;
  judul: string;
  keterangan: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" className="w-full lg:w-auto">
          <Trash2 aria-hidden />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{judul}</AlertDialogTitle>
          <AlertDialogDescription>{keterangan}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const hasil = await action();
                if (hasil?.error) {
                  toast.error(hasil.error);
                  setOpen(false);
                }
              })
            }
          >
            {pending ? "Menghapus…" : `Ya, ${label.toLowerCase()}`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
