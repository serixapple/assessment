import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CERO 審査事例集",
  description: "CEROレーティング審査事例のデータベース",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white font-bold text-sm px-2 py-1 rounded">
                CERO
              </div>
              <span className="font-semibold text-gray-800 hidden sm:block">審査事例集</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                事例一覧
              </Link>
              <Link
                href="/cases/new"
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors font-medium"
              >
                ＋ 事例登録
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
