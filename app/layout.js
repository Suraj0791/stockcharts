import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "D3.js Stock Visualization",
  description: "Interactive stock price visualization with D3.js and React",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
