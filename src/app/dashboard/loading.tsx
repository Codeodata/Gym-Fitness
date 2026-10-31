export default function Loading() {
  return (
    <div
      data-client-theme=""
      style={{ background: "var(--bg)", minHeight: "100svh" }}
      className="flex items-center justify-center"
    >
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
      />
    </div>
  );
}
