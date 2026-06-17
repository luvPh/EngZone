import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ChatBubble from "@/components/ChatBubble";
import { AppProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "EngZone — Học tiếng Anh với AI",
  description: "English learning web app powered by Claude",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0d12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-10">
              {children}
            </main>
          </div>
          <ChatBubble />
        </AppProvider>
      </body>
    </html>
  );
}
