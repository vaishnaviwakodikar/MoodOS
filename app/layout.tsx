import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import ThemeWatcher from "./ThemeWatcher";

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
      <body className={dmSans.variable} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <ThemeWatcher />
        {children}
      </body>
    </html>
  );
}