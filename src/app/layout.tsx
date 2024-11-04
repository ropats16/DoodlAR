import "./globals.css";
import { Inter } from "next/font/google";
import { GameProvider } from "@/context/GameContext";
import { ArweaveWalletKit } from "arweave-wallet-kit";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DoodlAR",
  description: "A multiplayer drawing and guessing game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} flex flex-col h-screen bg-background text-foreground`}
      >
        <ArweaveWalletKit
          config={{
            permissions: [
              "ACCESS_ADDRESS",
              "ACCESS_PUBLIC_KEY",
              "SIGN_TRANSACTION",
              "DISPATCH",
            ],
            ensurePermissions: true,
          }}
          theme={{
            displayTheme: "light",
          }}
        >
          <GameProvider>
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
            <Toaster />
            <Footer />
          </GameProvider>
        </ArweaveWalletKit>
      </body>
    </html>
  );
}
