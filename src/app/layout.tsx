import type { Metadata, Viewport } from "next";
import { Orbitron, Rajdhani, JetBrains_Mono } from "next/font/google";
import { Vista } from "@/components/Vista";
import { Disclaimer } from "@/components/Disclaimer";
import { getTheme, usesWebGL } from "@/lib/theme";
import "./globals.css";

const display = Orbitron({
  subsets: ["latin"],
  variable: "--font-display-local",
  display: "swap",
});

const sans = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans-local",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono-local",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ORB // 2088 — a rede social em 3D",
    template: "%s · ORB // 2088",
  },
  description:
    "ORB // 2088 é uma rede social independente com amigos, comunidades, scraps, cutucadas e ranking — cada perfil tem um núcleo e uma VISTA gerados em 3D no navegador.",
  applicationName: "ORB // 2088",
  keywords: ["rede social", "comunidades", "scrapbook", "3d", "webgl", "nostalgia"],
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      data-theme={theme}
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        {usesWebGL(theme) ? <Vista /> : null}
        <div className="relative z-10">{children}</div>
        <Disclaimer compact />
      </body>
    </html>
  );
}
