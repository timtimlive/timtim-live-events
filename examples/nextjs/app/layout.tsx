import type { ReactNode } from "react";

export const metadata = {
  title: "TimTim.Live events — Next.js example",
  description: "Server-rendered events from the TimTim.Live API.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fff", color: "#0f172a", margin: "0 auto", maxWidth: 960, padding: "24px 16px" }}>
        {children}
      </body>
    </html>
  );
}
