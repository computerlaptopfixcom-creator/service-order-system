/**
 * Computer Laptop Fix Portal
 * Developed by HielOS
 */
import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppButton } from "./whatsapp-button";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Sistema de Taller",
  description: "Gestión de órdenes de servicio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 transition-colors">
        <ThemeProvider>
          <ToastProvider>
            <CurrencyProvider>
              {children}
              <WhatsAppButton />
            </CurrencyProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
