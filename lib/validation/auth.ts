import { z } from "zod";

export const masukSchema = z.object({
  noHp: z.string().trim().min(1, "Silakan isi No. HP."),
  pin: z.string().regex(/^\d{6}$/, "PIN terdiri dari 6 angka."),
});
