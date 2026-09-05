import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif for page titles only; see .font-display in globals.css.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Projects, tickets and deadlines that refuse to be forgotten.",
};

export const THEME_COOKIE = "taskflow-theme";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * The theme lives in a cookie so the server can stamp data-theme onto the
   * HTML it sends. That removes the usual blocking inline script -- there is
   * no flash to prevent, because the very first byte already carries the
   * right theme. Absent cookie means "follow the system", which the CSS
   * handles via prefers-color-scheme.
   */
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = stored === "light" || stored === "dark" ? stored : undefined;

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-ink flex h-full flex-col">{children}</body>
    </html>
  );
}
