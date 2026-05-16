import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CANB English",
  description: "매일 정해진 문법 학습을 100점까지 반복하는 온라인 학습 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
