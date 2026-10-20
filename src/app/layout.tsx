import type { Metadata } from "next";
import "./globals.css";
import "../components/auth/auth.css";

export const metadata: Metadata = {
  title: {
    default: "IdeaMotion — Ideas, explained in motion",
    template: "%s | IdeaMotion",
  },
  description:
    "An educational motion graphics studio. An independent portfolio project in development.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
