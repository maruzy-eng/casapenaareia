"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  GripVertical,
  ImageIcon,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createAccommodationMedia,
  deleteAccommodationMedia,
  updateAccommodationMedia,
  updateAccommodationMediaOrder,
  type UpdateMediaOrderState,
  type UpdateMediaState,
} from "@/lib/actions/admin/accommodation-media";

type MediaItem = {
  id: string;
  unit_id: string;
  media_type: "image" | "video";
  url: string;
  title: string | null;
  sort_order: number | null;
  created_at: string | null;
};

type AccommodationMediaManagerProps = {
  unitId: string;
  unitSlug: string;
  unitName: string;
  media: MediaItem[];
};

const initialOrderState: UpdateMediaOrderState = {
  success: false,
  message: "",
};

const initialEditState: UpdateMediaState = {
  success: false,
  message: "",
};

const inputClass =
  "h-11 w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-text-muted)] focus:border-[var(--app-teal)] focus:ring-4 focus:ring-[var(--app-teal)]/10 dark:bg-white/5";

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

export function AccommodationMediaManager({
  unitId,
  unitSlug,
  unitName,
  media,
}: AccommodationMediaManagerProps) {
  const [items, setItems] = useState(media);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hasChangedOrder, setHasChangedOrder] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const [orderState, orderFormAction, isOrderPending] = useActionState(
    updateAccommodationMediaOrder,
    initialOrderState
  );

  const [editState, editFormAction, isEditPending] = useActionState(
    updateAccommodationMedia,
    initialEditState
  );

  useEffect(() => {
    setItems(media);
    setHasChangedOrder(false);
  }, [media]);

  useEffect(() => {
    if (orderState.success) {
      setHasChangedOrder(false);
    }
  }, [orderState.success]);

  useEffect(() => {
    if (editState.success) {
      setEditingItem(null);
    }
  }, [editState.success]);

  const orderedIds = useMemo(() => {
    return items.map((item) => item.id);
  }, [items]);

  function moveItem(dragId: string, targetId: string) {
    if (dragId === targetId) return;

    setItems((currentItems) => {
      const dragIndex = currentItems.findIndex((item) => item.id === dragId);
      const targetIndex = currentItems.findIndex((item) => item.id === targetId);

      if (dragIndex === -1 || targetIndex === -1) {
        return currentItems;
      }

      const updatedItems = [...currentItems];
      const [removedItem] = updatedItems.splice(dragIndex, 1);

      updatedItems.splice(targetIndex, 0, removedItem);

      return updatedItems;
    });

    setHasChangedOrder(true);
  }

  function handleDragStart(itemId: string) {
    setDraggedId(itemId);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDrop(targetId: string) {
    if (!draggedId) return;

    moveItem(draggedId, targetId);
    setDraggedId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
  }

  function moveUp(itemId: string) {
    setItems((currentItems) => {
      const index = currentItems.findIndex((item) => item.id === itemId);

      if (index <= 0) {
        return currentItems;
      }

      const updatedItems = [...currentItems];
      const currentItem = updatedItems[index];
      const previousItem = updatedItems[index - 1];

      updatedItems[index - 1] = currentItem;
      updatedItems[index] = previousItem;

      return updatedItems;
    });

    setHasChangedOrder(true);
  }

  function moveDown(itemId: string) {
    setItems((currentItems) => {
      const index = currentItems.findIndex((item) => item.id === itemId);

      if (index === -1 || index >= currentItems.length - 1) {
        return currentItems;
      }

      const updatedItems = [...currentItems];
      const currentItem = updatedItems[index];
      const nextItem = updatedItems[index + 1];

      updatedItems[index + 1] = currentItem;
      updatedItems[index] = nextItem;

      return updatedItems;
    });

    setHasChangedOrder(true);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-white shadow-[var(--app-shadow-soft)] dark:bg-[var(--app-card)]">
      <div className="border-b border-[var(--app-border)] bg-[var(--app-card-soft)] px-6 py-6 md:px-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
          Galeria
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--app-text)]">
          Fotos e vídeos
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--app-text-soft)]">
          Adicione mídias, edite títulos e arraste os cards para alterar a ordem
          da galeria pública.
        </p>
      </div>

      <div className="p-6 md:p-8">
        <form
          action={createAccommodationMedia}
          className="rounded-[1.75rem] border border-[var(--app-border)] bg-[var(--app-card-soft)] p-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <input type="hidden" name="unit_id" value={unitId} />
            <input type="hidden" name="unit_slug" value={unitSlug} />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                Tipo de mídia
              </span>

              <select
                name="media_type"
                required
                defaultValue="image"
                className={inputClass}
              >
                <option value="image">Foto</option>
                <option value="video">Vídeo</option>
              </select>
            </label>

            <div className="rounded-2xl border border-[var(--app-border)] bg-white p-4 dark:bg-white/5">
              <p className="text-sm font-black text-[var(--app-text)]">
                Ordem automática
              </p>

              <p className="mt-1 text-xs leading-5 text-[var(--app-text-soft)]">
                Novas mídias entram no final. Depois você pode arrastar.
              </p>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
              Título opcional
            </span>

            <input
              name="title"
              className={inputClass}
              placeholder="Ex: Vista da varanda"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
              Upload de arquivo
            </span>

            <input
              name="media_file"
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="block w-full cursor-pointer rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-sm text-[var(--app-text-soft)] outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--app-primary)] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[var(--app-primary-strong)] dark:bg-white/5"
            />

            <span className="mt-2 block text-xs text-[var(--app-text-muted)]">
              Fotos até 10MB. Vídeos até 100MB.
            </span>
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
              Ou cole uma URL
            </span>

            <input
              name="url"
              className={inputClass}
              placeholder="https://youtube.com/... ou https://..."
            />
          </label>

          <button
            type="submit"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-6 text-sm font-bold text-white transition hover:bg-[var(--app-primary-strong)]"
          >
            <Plus className="h-4 w-4" />
            Adicionar à galeria
          </button>
        </form>

        <div className="mt-8">
          {orderState.message ? (
            <div
              className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${
                orderState.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              }`}
            >
              {orderState.success ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : null}

              <span>{orderState.message}</span>
            </div>
          ) : null}

          {editState.message ? (
            <div
              className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium ${
                editState.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              }`}
            >
              {editState.success ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : null}

              <span>{editState.message}</span>
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-card-soft)] p-8 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-[var(--app-primary)]" />

              <h3 className="mt-4 text-lg font-black text-[var(--app-text)]">
                Nenhuma mídia cadastrada
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--app-text-soft)]">
                Adicione fotos e vídeos para deixar a página pública mais
                completa.
              </p>
            </div>
          ) : (
            <>
              <form action={orderFormAction} className="mb-5">
                <input type="hidden" name="unit_id" value={unitId} />
                <input type="hidden" name="unit_slug" value={unitSlug} />
                <input
                  type="hidden"
                  name="ordered_ids"
                  value={JSON.stringify(orderedIds)}
                />

                <button
                  type="submit"
                  disabled={!hasChangedOrder || isOrderPending}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-6 text-sm font-bold text-white transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isOrderPending
                    ? "Salvando ordem..."
                    : hasChangedOrder
                      ? "Salvar nova ordem"
                      : "Ordem salva"}
                </button>
              </form>

              <div className="grid gap-5 md:grid-cols-2">
                {items.map((item, index) => {
                  const embedUrl =
                    item.media_type === "video"
                      ? getVideoEmbedUrl(item.url)
                      : null;

                  const isDragging = draggedId === item.id;
                  const isEditing = editingItem?.id === item.id;

                  return (
                    <article
                      key={item.id}
                      draggable={!isEditing}
                      onDragStart={() => handleDragStart(item.id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(item.id)}
                      onDragEnd={handleDragEnd}
                      className={`overflow-hidden rounded-[1.75rem] border bg-[var(--app-card-soft)] transition ${
                        isDragging
                          ? "scale-[0.98] border-[var(--app-teal)] opacity-60"
                          : "border-[var(--app-border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border)] bg-white px-4 py-3 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--app-primary)] text-xs font-black text-white">
                            {index + 1}
                          </span>

                          <span className="text-sm font-bold text-[var(--app-text)]">
                            {item.media_type === "image" ? "Foto" : "Vídeo"}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="inline-flex cursor-grab items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-card-soft)] px-3 py-2 text-xs font-bold text-[var(--app-text-soft)] active:cursor-grabbing"
                          title="Arraste para reordenar"
                        >
                          <GripVertical className="h-4 w-4" />
                          Arrastar
                        </button>
                      </div>

                      <div className="relative aspect-video bg-[var(--app-primary-soft)]">
                        {item.media_type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.title || unitName || "Foto"}
                            className="h-full w-full object-cover"
                          />
                        ) : embedUrl ? (
                          <iframe
                            src={embedUrl}
                            title={item.title || "Vídeo"}
                            className="pointer-events-none h-full w-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        ) : (
                          <video
                            src={item.url}
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        )}

                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--app-primary)] shadow-sm">
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
                      </div>

                      <div className="p-4">
                        {isEditing ? (
                          <form action={editFormAction} className="space-y-4">
                            <input
                              type="hidden"
                              name="media_id"
                              value={item.id}
                            />

                            <input
                              type="hidden"
                              name="unit_id"
                              value={unitId}
                            />

                            <input
                              type="hidden"
                              name="unit_slug"
                              value={unitSlug}
                            />

                            <label className="block">
                              <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                                Tipo
                              </span>

                              <select
                                name="media_type"
                                defaultValue={item.media_type}
                                className={inputClass}
                              >
                                <option value="image">Foto</option>
                                <option value="video">Vídeo</option>
                              </select>
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                                Título
                              </span>

                              <input
                                name="title"
                                defaultValue={item.title || ""}
                                className={inputClass}
                                placeholder="Título da mídia"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-2 block text-sm font-bold text-[var(--app-text)]">
                                URL
                              </span>

                              <input
                                name="url"
                                required
                                defaultValue={item.url}
                                className={inputClass}
                                placeholder="https://..."
                              />
                            </label>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="submit"
                                disabled={isEditPending}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[var(--app-primary)] px-4 text-sm font-bold text-white transition hover:bg-[var(--app-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Save className="h-4 w-4" />
                                {isEditPending ? "Salvando..." : "Salvar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
                              >
                                <X className="h-4 w-4" />
                                Cancelar
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p className="font-black text-[var(--app-text)]">
                              {item.title || "Sem título"}
                            </p>

                            <p className="mt-1 break-all text-xs leading-5 text-[var(--app-text-muted)]">
                              {item.url}
                            </p>

                            <p className="mt-2 text-xs font-medium text-[var(--app-text-muted)]">
                              Posição atual: {index + 1}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => moveUp(item.id)}
                                disabled={index === 0}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5"
                              >
                                Subir
                              </button>

                              <button
                                type="button"
                                onClick={() => moveDown(item.id)}
                                disabled={index === items.length - 1}
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5"
                              >
                                Descer
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--app-border)] bg-white px-4 text-sm font-bold text-[var(--app-primary)] transition hover:bg-[var(--app-primary-soft)] dark:bg-white/5"
                              >
                                <Edit3 className="h-4 w-4" />
                                Editar
                              </button>

                              <form action={deleteAccommodationMedia}>
                                <input
                                  type="hidden"
                                  name="media_id"
                                  value={item.id}
                                />

                                <input
                                  type="hidden"
                                  name="unit_id"
                                  value={unitId}
                                />

                                <input
                                  type="hidden"
                                  name="unit_slug"
                                  value={unitSlug}
                                />

                                <button
                                  type="submit"
                                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remover
                                </button>
                              </form>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}