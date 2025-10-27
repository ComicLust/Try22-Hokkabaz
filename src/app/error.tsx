"use client";

import React, { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Mark hydrated even if error occurred so CSS rules take effect consistently
    try {
      document.documentElement.setAttribute("data-hydrated", "1");
    } catch {}
    // Optional: log error for observability if any client logger exists
    // console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body>
        <div id="fallback" style={{ padding: 16 }}>
          <h1>Bir şeyler ters gitti</h1>
          <p>Sayfa açılırken beklenmedik bir hata oluştu. Temel görünümü gösteriyoruz.</p>
          <p>
            İsterseniz <button onClick={reset} style={{ textDecoration: "underline" }}>yeniden dene</button>.
          </p>
          <nav style={{ marginTop: 12 }}>
            <a href="/" style={{ marginRight: 8 }}>Ana Sayfa</a>
            <a href="/bonuslar" style={{ marginRight: 8 }}>Bonuslar</a>
            <a href="/hakkimizda">Hakkımızda</a>
          </nav>
        </div>
      </body>
    </html>
  );
}