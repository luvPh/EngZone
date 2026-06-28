import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
import ChatBubble from "@/components/ChatBubble";
import SyncProvider from "@/components/SyncProvider";
import { AppProvider } from "@/lib/store";
import { ThemeProvider, themeNoFlashScript } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "EngZone — Học tiếng Anh với AI",
  description: "English learning web app powered by Claude",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf9f5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AppProvider>
            <SyncProvider>
              <Shell>{children}</Shell>
              <ChatBubble />
            </SyncProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
