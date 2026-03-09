"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[embed.cat global error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body style={{ backgroundColor: "#09090b", margin: 0 }}>
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
          <div style={{ maxWidth: 420, padding: 24, textAlign: "center", color: "#e4e4e7", fontFamily: "Inter, system-ui, sans-serif" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Something went wrong</h2>
            <pre style={{ maxHeight: 160, overflow: "auto", background: "#0a0a0b", borderRadius: 8, padding: 12, textAlign: "left", fontSize: 11, color: "#f87171", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {error.message}
            </pre>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
              <button
                onClick={reset}
                style={{ padding: "8px 16px", borderRadius: 6, background: "#5865f2", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                Try again
              </button>
              <button
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                style={{ padding: "8px 16px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#a1a1aa", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                Clear data & reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
