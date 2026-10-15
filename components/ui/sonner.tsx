"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Toast kartu terang di bawah (DESIGN §6, §11): ikon berwarna + teks, di atas navigasi bawah HP.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      duration={5000}
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: 88 }}
      gap={8}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-primary" />,
        info: <InfoIcon className="size-5 text-info" />,
        warning: <TriangleAlertIcon className="size-5 text-warn" />,
        error: <OctagonXIcon className="size-5 text-bahaya" />,
        loading: <Loader2Icon className="size-5 animate-spin text-primary" />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "calc(var(--radius) * 1.3)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !text-base !py-3.5 !shadow-[0_8px_24px_rgba(20,22,22,0.10)]",
          actionButton: "!bg-mint !text-mint-foreground !font-semibold !h-8 !px-3 !rounded-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
