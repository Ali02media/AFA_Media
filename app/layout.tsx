import type { Metadata, Viewport } from "next";
import { Slabo_27px, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CalProvider } from "@/components/cal";

const slabo = Slabo_27px({
  variable: "--font-slabo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Marketing That Gets Your Phone Ringing`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "UK marketing agency",
    "web design",
    "AI chatbots",
    "email marketing",
    "Google ads",
    "Meta ads",
    "service business marketing",
    "lead generation",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Marketing That Gets Your Phone Ringing`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Marketing That Gets Your Phone Ringing`,
    description: site.description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${slabo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-foreground">
        <CalProvider />
        <Navbar />
        <main className="relative z-10 flex-1">{children}</main>
        <div className="relative z-10">
          <Footer />
        </div>
      </body>
    </html>
  );
}
