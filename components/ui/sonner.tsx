"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Toast di bawah (DESIGN §6), teks 16px+, tema terang saja.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      duration={6000}
      offset={{ bottom: 96 }}
      mobileOffset={{ bottom: 96 }}
      className="toaster group"
      icons={{
        // Warna terang karena latar toast gelap (#121413).
        success: <CircleCheckIcon className="size-5 text-[#7fe0a6]" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5 text-[#ffb866]" />,
        error: <OctagonXIcon className="size-5 text-[#ff9b9b]" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !text-base !py-4",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
