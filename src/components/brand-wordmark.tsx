import Image from "next/image";

// "Claudia Duran" como firma (igual que el logo) + "FITNESS" chico y espaciado.
export function BrandWordmark({ size = "md", color = "#fff" }: { size?: "sm" | "md"; color?: string }) {
  const sm = size === "sm";
  return (
    <span className="inline-flex flex-col items-start leading-none">
      <span className="sr-only">Claudia Duran Fitness</span>
      <span
        aria-hidden
        style={{
          fontFamily: "var(--font-signature)",
          fontSize: sm ? "1.5rem" : "1.875rem",
          lineHeight: 1,
          color,
          // la firma sale fina en tamaños chicos: un leve brillo de marca la sostiene
          textShadow: "0 0 14px rgba(244,114,182,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        Claudia Duran
      </span>
      <span
        aria-hidden
        className="font-bold uppercase"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: sm ? "0.5625rem" : "0.625rem",
          letterSpacing: "0.42em",
          marginTop: sm ? "1px" : "3px",
          paddingLeft: sm ? "1.6rem" : "2rem",
          color,
          opacity: 0.75,
        }}
      >
        Fitness
      </span>
    </span>
  );
}

// Lettering original del logo (recortado de clau-login.jpg, fondo transparente).
// Para fondos oscuros: el texto es plateado metalizado.
export function BrandLogoLettering({ width = 158 }: { width?: number }) {
  return (
    <Image
      src="/brand-wordmark.png"
      alt="Claudia Duran Fitness"
      width={width}
      height={Math.round((width * 101) / 400)}
      priority
      style={{ width, height: "auto", filter: "drop-shadow(0 0 10px rgba(244,114,182,0.25))" }}
    />
  );
}
