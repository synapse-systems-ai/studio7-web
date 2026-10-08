"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Images, Plus, Search, Tag, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { usePromoBrand } from "@/lib/promo-brand-context";
import { PROMO_BRAND_STUDIO7 } from "@/lib/promo-brands";
import {
  PROMO_CAMPAIGN_FORMAT_GUEST_LIST,
  PROMO_CAMPAIGN_FORMAT_INSTAGRAM,
  PROMO_CAMPAIGN_FORMAT_OPTIONS,
  formatCampaignFormatLabel,
} from "@/lib/promo-campaign-format";

function CreateCampaignDialog({ onCreated }) {
  const brand = usePromoBrand();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [campaignFormat, setCampaignFormat] = useState(PROMO_CAMPAIGN_FORMAT_GUEST_LIST);
  const [discountPercent, setDiscountPercent] = useState("10");
  const [instagramUsername, setInstagramUsername] = useState("studio7.rsa");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(brand.adminApiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.id,
          campaign_format: campaignFormat,
          discount_percent: Math.min(100, Math.max(1, parseInt(discountPercent, 10) || 10)),
          instagram_username:
            campaignFormat === PROMO_CAMPAIGN_FORMAT_INSTAGRAM ? instagramUsername.trim() : undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to create campaign");
      toast.success("Campaign created");
      setOpen(false);
      setName("");
      setCampaignFormat(PROMO_CAMPAIGN_FORMAT_GUEST_LIST);
      setDiscountPercent("10");
      setInstagramUsername("studio7.rsa");
      onCreated?.(j.campaign);
    } catch (e) {
      toast.error("Could not create campaign", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New {brand.label} campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g. Summer launch party"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Campaign format</Label>
            <Select
              value={campaignFormat}
              onValueChange={(v) => setCampaignFormat(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMO_CAMPAIGN_FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PROMO_CAMPAIGN_FORMAT_OPTIONS.find((o) => o.value === campaignFormat)?.description}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-discount">Discount %</Label>
            <Input
              id="campaign-discount"
              type="number"
              min={1}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
          {campaignFormat === PROMO_CAMPAIGN_FORMAT_INSTAGRAM ? (
            <div className="space-y-2">
              <Label htmlFor="campaign-ig">Instagram account to follow</Label>
              <Input
                id="campaign-ig"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                placeholder="studio7.rsa"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create} disabled={saving || !name.trim()}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CampaignCard({ campaign, onDeleted }) {
  const brand = usePromoBrand();
  const [deleting, setDeleting] = useState(false);
  const detailHref = `${brand.adminBasePath}/${campaign.id}`;

  const deleteCampaign = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`${brand.adminApiBase}/${campaign.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to delete campaign");
      toast.success("Campaign deleted");
      onDeleted?.(campaign.id);
    } catch (e) {
      toast.error("Failed to delete campaign", { description: e.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Link
            href={detailHref}
            className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Tag className="size-5" />
          </Link>
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  disabled={deleting}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete campaign</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes &ldquo;{campaign.name}&rdquo; and all {campaign.signup_count}{" "}
                    signup{campaign.signup_count === 1 ? "" : "s"}. This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteCampaign}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href={detailHref}>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
        <Link href={detailHref} className="block">
          <CardTitle className="mt-3 flex items-center gap-2">
            {campaign.name}
            {!campaign.is_active && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="space-y-1">
            <span className="block">{campaign.headline}</span>
            <Badge variant="outline" className="font-normal">
              {formatCampaignFormatLabel(campaign.campaign_format)}
            </Badge>
          </CardDescription>
        </Link>
      </CardHeader>
      <CardContent>
        <Link href={detailHref} className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {campaign.signup_count} signup{campaign.signup_count === 1 ? "" : "s"}
        </Link>
      </CardContent>
    </Card>
  );
}

export function PromoCampaignsListPage() {
  const brand = usePromoBrand();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${brand.adminApiBase}?brand=${encodeURIComponent(brand.id)}`, {
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load campaigns");
      setCampaigns(j.campaigns || []);
    } catch (e) {
      toast.error("Failed to load campaigns", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, [brand.adminApiBase, brand.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = campaigns.filter((c) => {
      if (statusFilter === "active" && !c.is_active) return false;
      if (statusFilter === "inactive" && c.is_active) return false;
      if (!q) return true;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.headline?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return String(a.name).localeCompare(String(b.name));
      if (sort === "signups") return (b.signup_count || 0) - (a.signup_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [campaigns, search, statusFilter, sort]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{brand.listTitle}</h1>
            <p className="text-muted-foreground">{brand.listSubtitle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
            {brand.id === PROMO_BRAND_STUDIO7 ? (
              <Link
                href={`${brand.adminBasePath}/hero-gallery`}
                className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-2")}
              >
                <Images className="h-4 w-4" />
                Background gallery
              </Link>
            ) : null}
            <CreateCampaignDialog
              onCreated={(c) => c && router.push(`${brand.adminBasePath}/${c.id}`)}
            />
            <AdminBackLink href="/admin" label="Back to admin" shortLabel="Back" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, headline, or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="signups">Most signups</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {campaigns.length === 0
                ? "No campaigns yet. Create one to get a public QR landing page."
                : "No campaigns match your search or filters."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onDeleted={(id) => setCampaigns((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
