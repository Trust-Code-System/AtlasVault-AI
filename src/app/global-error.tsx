"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f8fafc", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "0 16px" }}>
          <h1 style={{ fontSize: 20, color: "#0f172a", marginBottom: 8 }}>AtlasVault hit an unexpected problem</h1>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 420, lineHeight: 1.6 }}>
            Please refresh the page. Your documents and workspace data are safe.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: 20, background: "#2a4fe2", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
