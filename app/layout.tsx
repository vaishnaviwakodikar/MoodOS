import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "MoodOS — Student Life Dashboard",
  description: "Track your mood, habits, study, expenses and attendance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={dmSans.variable} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}