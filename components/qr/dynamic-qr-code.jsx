"use client";

import { useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

const DEFAULT_LEVEL = "M";

/**
 * Client-rendered QR code that updates when `value` changes.
 */
export function DynamicQrCode({
  value,
  size = 180,
  level = DEFAULT_LEVEL,
  className,
  id,
  "aria-label": ariaLabel = "QR code",
}) {
  const encoded = String(value ?? "").trim();
  if (!encoded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed bg-zinc-50 text-xs text-zinc-400",
          className,
        )}
        style={{ width: size, height: size }}
      >
        No link
      </div>
    );
  }

  return (
    <QRCodeSVG
      id={id}
      value={encoded}
      size={size}
      level={level}
      includeMargin
      role="img"
      aria-label={ariaLabel}
      className={cn("h-auto max-w-full", className)}
    />
  );
}

async function qrValueToPngDataUrl(value, { width = 1024 } = {}) {
  const QRCodeLib = (await import("qrcode")).default;
  return QRCodeLib.toDataURL(value, {
    width,
    margin: 2,
    errorCorrectionLevel: DEFAULT_LEVEL,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export function useDynamicQrDownload() {
  const isIOS = useCallback(
    () =>
      typeof navigator !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)),
    [],
  );

  const download = useCallback(
    async (value, { fileName = "qr-code.png", width = 1024 } = {}) => {
      const encoded = String(value ?? "").trim();
      if (!encoded) throw new Error("Nothing to export");

      const iosTab = isIOS() ? window.open("", "_blank") : null;

      try {
        const dataUrl = await qrValueToPngDataUrl(encoded, { width });

        if (iosTab) {
          iosTab.document.write(
            `<title>${fileName}</title><body style="margin:0;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${dataUrl}" style="max-width:100%;height:auto;" /></body>`,
          );
          iosTab.document.close();
          return { ios: true };
        }

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return { ios: false };
      } catch (err) {
        iosTab?.close();
        throw err;
      }
    },
    [isIOS],
  );

  return { download, isIOS };
}
