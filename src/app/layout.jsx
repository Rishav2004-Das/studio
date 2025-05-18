
import { Geist } from "next/font/google"; // Removed Geist_Mono
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout.jsx";
import { AuthProvider } from "@/contexts/auth-context.jsx"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Removed Geist_Mono setup
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata = {
  title: "Telebounties App",
  description: "Complete tasks, earn tokens, and climb the leaderboard!",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased`} // Removed geistMono.variable
      >
        <AuthProvider> {/* Wrap AppLayout with AuthProvider */}
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
