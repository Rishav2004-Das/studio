
import { Geist } from "next/font/google"; 
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout.jsx";
import { AuthProvider } from "@/contexts/auth-context.jsx"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata = {
  title: "Telebounties App",
  description: "Complete tasks, earn HTR, and climb the leaderboard!",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased`} 
      >
        <AuthProvider> 
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
