import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { auth } from "~/server/auth";
import CombinedProviders from "~/app/provider"; 

export const metadata: Metadata = {
  title: "Airtable",
  description: "Rep 1:1 Airtable",
  icons: [{ rel: "icon", url: "/airtable-logo-notext.webp" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Make the function async to fetch data
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  
  // 3. Fetch the session data on the server
  const session = await auth(); 

  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="overflow-hidden">
        {/* 4. Use the new CombinedProviders component */}
        <CombinedProviders session={session}>
          {children}
        </CombinedProviders>
      </body>
    </html>
  );
}