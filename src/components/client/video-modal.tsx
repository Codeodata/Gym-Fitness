"use client";

import { X } from "lucide-react";

export type ActiveVideo = { url: string; title: string; poster?: string };

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function VideoModal({ video, onClose }: { video: ActiveVideo | null; onClose: () => void }) {
  if (!video) return null;
  const yt = youtubeId(video.url);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-bold text-sm truncate pr-2" style={{ color: "var(--text)" }}>{video.title}</p>
          <button
            onClick={onClose}
            className="p-1 rounded-lg shrink-0"
            style={{ color: "var(--text-3)", cursor: "pointer" }}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {yt ? (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000" }}>
            <iframe
              src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        ) : (
          <video
            src={video.url}
            poster={video.poster}
            controls
            autoPlay
            playsInline
            className="w-full"
            style={{ display: "block", background: "#000", maxHeight: "70vh" }}
          />
        )}
      </div>
    </div>
  );
}
