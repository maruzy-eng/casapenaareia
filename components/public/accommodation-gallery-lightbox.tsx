"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  PlayCircle,
  X,
} from "lucide-react";

type GalleryItem = {
  id: string;
  media_type: "image" | "video";
  url: string;
  title: string | null;
  sort_order: number | null;
  created_at: string | null;
};

type AccommodationGalleryLightboxProps = {
  items: GalleryItem[];
  accommodationName: string;
};

function getVideoEmbedUrl(url: string) {
  if (url.includes("youtube.com/watch?v=")) {
    const videoId = url.split("v=")[1]?.split("&")[0];

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0];

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  if (url.includes("vimeo.com/")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0];

    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }

  return null;
}

export function AccommodationGalleryLightbox({
  items,
  accommodationName,
}: AccommodationGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  const hasItems = items.length > 0;

  const canGoPrevious = useMemo(() => {
    if (activeIndex === null) return false;

    return items.length > 1;
  }, [activeIndex, items.length]);

  const canGoNext = useMemo(() => {
    if (activeIndex === null) return false;

    return items.length > 1;
  }, [activeIndex, items.length]);

  function openLightbox(index: number) {
    setActiveIndex(index);
  }

  function closeLightbox() {
    setActiveIndex(null);
  }

  function goPrevious() {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;

      if (currentIndex === 0) {
        return items.length - 1;
      }

      return currentIndex - 1;
    });
  }

  function goNext() {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) return currentIndex;

      if (currentIndex === items.length - 1) {
        return 0;
      }

      return currentIndex + 1;
    });
  }

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        goPrevious();
      }

      if (event.key === "ArrowRight") {
        goNext();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  if (!hasItems) {
    return (
      <div className="mt-6 rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center">
        <ImageIcon className="mx-auto h-8 w-8 text-stone-400" />

        <h3 className="mt-4 text-lg font-semibold text-stone-950">
          Galeria ainda não cadastrada
        </h3>

        <p className="mt-2 text-sm text-stone-500">
          Em breve adicionaremos mais fotos e vídeos desta acomodação.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => {
          const embedUrl =
            item.media_type === "video" ? getVideoEmbedUrl(item.url) : null;

          return (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => openLightbox(index)}
                className="relative block aspect-video w-full overflow-hidden bg-stone-200 text-left"
              >
                {item.media_type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.title || accommodationName || "Foto"}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : embedUrl ? (
                  <div className="relative h-full w-full bg-stone-950">
                    <iframe
                      src={embedUrl}
                      title={item.title || "Vídeo"}
                      className="pointer-events-none h-full w-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    muted
                    playsInline
                  />
                )}

                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 shadow-sm">
                  {item.media_type === "image" ? (
                    <>
                      <ImageIcon className="h-3.5 w-3.5" />
                      Foto
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3.5 w-3.5" />
                      Vídeo
                    </>
                  )}
                </span>

                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-950 shadow-sm">
                    Abrir
                  </span>
                </span>
              </button>

              {item.title ? (
                <div className="p-5">
                  <h3 className="font-medium text-stone-950">{item.title}</h3>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {activeItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-stone-950 transition hover:bg-stone-200"
            aria-label="Fechar galeria"
          >
            <X className="h-5 w-5" />
          </button>

          {canGoPrevious ? (
            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-950 transition hover:bg-stone-200 md:inline-flex"
              aria-label="Mídia anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : null}

          {canGoNext ? (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-950 transition hover:bg-stone-200 md:inline-flex"
              aria-label="Próxima mídia"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          ) : null}

          <div className="w-full max-w-6xl">
            <div className="overflow-hidden rounded-[2rem] bg-black shadow-2xl">
              <div className="relative aspect-video max-h-[76vh] bg-black">
                {activeItem.media_type === "image" ? (
                  <img
                    src={activeItem.url}
                    alt={activeItem.title || accommodationName || "Foto"}
                    className="h-full w-full object-contain"
                  />
                ) : getVideoEmbedUrl(activeItem.url) ? (
                  <iframe
                    src={getVideoEmbedUrl(activeItem.url) || ""}
                    title={activeItem.title || "Vídeo"}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeItem.url}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                )}
              </div>

              <div className="flex flex-col gap-3 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-950">
                    {activeItem.title || accommodationName}
                  </p>

                  <p className="mt-1 text-xs text-stone-500">
                    {activeIndex !== null ? activeIndex + 1 : 1} de{" "}
                    {items.length}
                  </p>
                </div>

                <div className="flex gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={goPrevious}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700"
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-medium text-white"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}