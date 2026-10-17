import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym Fitness",
  description: "Plataforma de entrenamiento personalizado",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
