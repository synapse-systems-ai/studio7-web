"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { usePromoBrand } from "@/lib/promo-brand-context";
import { cn } from "@/lib/utils";

export function PromoHeroGalleryPage() {
  const brand = usePromoBrand();
  const adminApi = brand.adminApiBase;
  const [slides, setSlides] = useState([]);
  const [customized, setCustomized] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);
  const [schemaStale, setSchemaStale] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${adminApi}/hero-slides`, { credentials: "include" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load gallery");
      setSlides(j.slides || []);
      setCustomized(Boolean(j.customized));
      setTableMissing(Boolean(j.tableMissing));
      setSchemaStale(Boolean(j.schemaStale));
      setDbError(j.dbError || null);
    } catch (e) {
      toast.error("Could not load gallery", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, [adminApi]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadFile = async (file, { replaceSlideId } = {}) => {
    if (!file) return;
    setUploading(true);
    if (replaceSlideId) setReplacingId(replaceSlideId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch(`${adminApi}/upload-image`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const uploaded = await up.json();
      if (!up.ok) throw new Error(uploaded.error || "Upload failed");

      if (replaceSlideId && customized && !String(replaceSlideId).startsWith("bundled-")) {
        const r = await fetch(`${adminApi}/hero-slides/${replaceSlideId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: uploaded.url }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Replace failed");
        setSlides(j.slides || []);
        setCustomized(Boolean(j.customized));
        toast.success("Photo replaced");
        return;
      }

      const r = await fetch(`${adminApi}/hero-slides`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: uploaded.url }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not add photo");
      setSlides(j.slides || []);
      setCustomized(Boolean(j.customized));
      toast.success("Photo added to gallery");
    } catch (e) {
      toast.error("Upload failed", { description: e.message });
    } finally {
      setUploading(false);
      setReplacingId(null);
    }
  };

  const importDefaults = async () => {
    setBusyId("seed");
    try {
      const r = await fetch(`${adminApi}/hero-slides`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Import failed");
      setSlides(j.slides || []);
      setCustomized(Boolean(j.customized));
      toast.success(j.seeded ? "Default photos imported — you can edit them now" : "Gallery already customized");
    } catch (e) {
      toast.error("Import failed", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const removeSlide = async (slide) => {
    setBusyId(slide.id);
    try {
      const r = await fetch(`${adminApi}/hero-slides/${slide.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Delete failed");
      setSlides(j.slides || []);
      setCustomized(Boolean(j.customized));
      toast.success("Photo removed");
    } catch (e) {
      toast.error("Delete failed", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const moveSlide = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const a = slides[index];
    const b = slides[targetIndex];
    if (String(a.id).startsWith("bundled-") || String(b.id).startsWith("bundled-")) {
      toast.info("Import defaults first to reorder photos");
      return;
    }
    setBusyId(a.id);
    try {
      await fetch(`${adminApi}/hero-slides/${a.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: b.sort_order }),
      });
      const r2 = await fetch(`${adminApi}/hero-slides/${b.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: a.sort_order }),
      });
      const j = await r2.json();
      if (!r2.ok) throw new Error(j.error || "Reorder failed");
      setSlides(j.slides || []);
    } catch (e) {
      toast.error("Reorder failed", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const saveAlt = async (slide, alt_text) => {
    if (String(slide.id).startsWith("bundled-")) return;
    try {
      const r = await fetch(`${adminApi}/hero-slides/${slide.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt_text }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Save failed");
      setSlides(j.slides || []);
    } catch (e) {
      toast.error("Could not save description", { description: e.message });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Background gallery</h1>
            <p className="text-muted-foreground">
              Fading photos behind promo sign-up pages. Reorder, replace, remove, or add images.
            </p>
          </div>
          <AdminBackLink href={brand.adminBasePath} label={`Back to ${brand.listTitle}`} />
        </div>

        {schemaStale ? (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base">Reload Supabase API schema</CardTitle>
              <CardDescription className="space-y-2">
                <p>
                  The table exists, but the API hasn&apos;t picked it up yet. In Supabase SQL Editor, run:
                </p>
                <code className="block rounded-md bg-muted px-3 py-2 text-xs">
                  notify pgrst, &apos;reload schema&apos;;
                </code>
                <p>
                  Or use <strong>Project Settings → API → Reload schema</strong>, then refresh this page and click{" "}
                  <strong>Import current defaults</strong>.
                </p>
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {tableMissing ? (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base">Database setup required</CardTitle>
              <CardDescription>
                Run{" "}
                <code className="text-xs">supabase/migrations/20261008120000_promo_hero_slides.sql</code> in Supabase
                SQL Editor, then refresh. Until then, bundled photos still show on promo pages.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {dbError && !tableMissing && !schemaStale ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-base">Could not read gallery</CardTitle>
              <CardDescription className="font-mono text-xs break-all">{dbError}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                Hero slideshow
              </CardTitle>
              <CardDescription className="mt-1">
                {customized
                  ? `${slides.length} photo${slides.length === 1 ? "" : "s"} in rotation`
                  : "Showing bundled defaults — import to edit individual photos"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {!customized ? (
                <Button type="button" variant="outline" disabled={busyId === "seed"} onClick={importDefaults}>
                  {busyId === "seed" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Import current defaults
                </Button>
              ) : null}
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <label className="cursor-pointer">
                  {uploading && !replacingId ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-2 h-4 w-4" />
                  )}
                  Add photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadFile(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Loading gallery…</p>
            ) : slides.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No photos yet. Add one or import the default set.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {slides.map((slide, index) => {
                  const isBundled = String(slide.id).startsWith("bundled-");
                  const isBusy = busyId === slide.id || replacingId === slide.id;
                  return (
                    <div
                      key={slide.id}
                      className={cn(
                        "group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
                        isBundled && "border-dashed",
                      )}
                    >
                      <div className="relative aspect-[4/3] bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.src} alt={slide.alt || ""} className="h-full w-full object-cover" />
                        <div className="absolute left-2 top-2 flex gap-1">
                          <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
                            {index + 1}
                          </Badge>
                          {isBundled ? (
                            <Badge variant="outline" className="border-white/40 bg-black/40 text-white backdrop-blur-sm">
                              Default
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-3 p-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Description (accessibility)</Label>
                          <Input
                            defaultValue={slide.alt || ""}
                            disabled={isBundled}
                            placeholder="e.g. Dance floor at Studio 7"
                            onBlur={(e) => {
                              if (e.target.value !== (slide.alt || "")) {
                                void saveAlt(slide, e.target.value);
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            disabled={index === 0 || isBusy}
                            onClick={() => moveSlide(index, -1)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            disabled={index === slides.length - 1 || isBusy}
                            onClick={() => moveSlide(index, 1)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={isBusy || isBundled} asChild>
                            <label className={cn("cursor-pointer", (isBundled || isBusy) && "pointer-events-none opacity-50")}>
                              {replacingId === slide.id ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ImagePlus className="mr-1 h-3.5 w-3.5" />
                              )}
                              Replace
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="sr-only"
                                disabled={isBundled || isBusy}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) void uploadFile(file, { replaceSlideId: slide.id });
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                disabled={isBundled || isBusy}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  It will no longer appear in the fading background on promo pages.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => removeSlide(slide)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
