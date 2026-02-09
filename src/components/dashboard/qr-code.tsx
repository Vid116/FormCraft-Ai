"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QRCodeDisplay({ url }: { url: string }) {
  const [show, setShow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (show && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#18181b", light: "#ffffff" },
      });
    }
  }, [show, url]);

  function downloadPNG() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "formcraft-qr.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        QR Code
      </button>

      {show && (
        <div className="absolute top-8 right-0 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-4 flex flex-col items-center gap-3">
          <canvas ref={canvasRef} />
          <button
            onClick={downloadPNG}
            className="text-xs text-blue-600 hover:underline"
          >
            Download PNG
          </button>
          <button
            onClick={() => setShow(false)}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
