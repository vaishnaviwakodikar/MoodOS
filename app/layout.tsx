import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import ThemeWatcher from "./ThemeWatcher"; // 👈 add this

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "MoodOS — Student Life Dashboard",
  description: "Track your mood, habits, study, expenses and attendance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){document.documentElement.classList.toggle('dark',window.matchMedia('(prefers-color-scheme: dark)').matches)})();`,
          }}
        />
      </head>
      <body className={dmSans.variable} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <ThemeWatcher /> {/* 👈 add this */}
        {children}
      </body>
    </html>
  );
}