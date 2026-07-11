"use client";

import Image from "next/image";
import { useState } from "react";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

interface GalleryImage {
  id?: string;
  url: string;
  alt?: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : [{ url: "https://images.unsplash.com/photo-1468495244123-6c6c332ee458?w=800&q=80", alt: productName }];
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [hoverZoom, setHoverZoom] = useState(false);

  const current = gallery[active] || gallery[0];

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-white"
        onMouseEnter={() => setHoverZoom(true)}
        onMouseLeave={() => setHoverZoom(false)}
      >
        <Image
          src={current.url}
          alt={current.alt || productName}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn(
            "object-cover transition duration-300",
            hoverZoom && "scale-110"
          )}
          priority
        />
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur transition hover:bg-white"
          aria-label="Zoom image"
        >
          <ZoomIn className="h-3.5 w-3.5" />
          Zoom
        </button>
      </div>

      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((img, i) => (
            <button
              key={img.id || img.url}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition",
                i === active ? "border-[var(--brand)]" : "border-transparent opacity-75 hover:opacity-100"
              )}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title={productName} size="lg">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--surface)]">
          <Image
            src={current.url}
            alt={current.alt || productName}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-contain"
          />
        </div>
      </Modal>
    </div>
  );
}
