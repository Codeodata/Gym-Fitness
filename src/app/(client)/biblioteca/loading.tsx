export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
      />
    </div>
  );
}
