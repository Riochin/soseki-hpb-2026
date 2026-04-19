import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_JP, Noto_Sans_JP, Yuji_Syuku, Reggae_One } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const yujiSyuku = Yuji_Syuku({
  variable: "--font-yuji-syuku",
  subsets: ["latin"],
  weight: ["400"],
});

const reggaeOne = Reggae_One({
  variable: "--font-reggae-one",
  subsets: ["latin"],
  weight: ["400"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
});


export const metadata: Metadata = {
  title: "SOSEKI 20th | Happy Birthday!",
  description: "アクメ漱石 20歳誕生日記念ファンサイト",
  openGraph: {
    title: "SOSEKI 20th | Happy Birthday!",
    description: "アクメ漱石 20歳誕生日記念ファンサイト",
    images: ["https://soseki-20th.vercel.app/ogp.png?v=2"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOSEKI 20th | Happy Birthday!",
    description: "アクメ漱石 20歳誕生日記念ファンサイト",
    images: ["https://soseki-20th.vercel.app/ogp.png?v=2"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJP.variable} ${notoSansJP.variable} ${yujiSyuku.variable} ${reggaeOne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
