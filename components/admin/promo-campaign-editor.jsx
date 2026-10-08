'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { DynamicQrCode, useDynamicQrDownload } from '@/components/qr/dynamic-qr-code'
import { getPromoCampaignPreviewImage } from '@/lib/promo-brand-image'
import { formatPromoValidDuration } from '@/lib/promo-signup'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { DebouncedInput } from '@/components/ui/debounced-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-jwt-auth'
import { getPromoLandingUrl } from '@/lib/promo-public-url'
import { usePromoBrand } from '@/lib/promo-brand-context'
import { formatPromoStatusLabel } from '@/lib/promo-signup'

const CODE_VALID_PRESETS = [
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
  { label: '72 hours', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
  { label: '30 days', hours: 720 },
]

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const RANGE_OPTIONS = [
  { id: 'week', label: 'Last week' },
  { id: '2weeks', label: '2 weeks' },
  { id: 'month', label: 'Month' },
  { id: '3months', label: 'Last 3 months' },
  { id: 'custom', label: 'Custom' },
]

function statusBadgeVariant(status) {
  if (status === 'used') return 'secondary'
  if (status === 'expired') return 'destructive'
  if (status === 'cancelled') return 'outline'
  return 'default'
}

function ContentTab({ campaign, onSaved }) {
  const brand = usePromoBrand()
  const adminApi = brand.adminApiBase
  const initialHours = campaign.code_valid_hours ?? 24
  const presetMatch = CODE_VALID_PRESETS.find((p) => p.hours === initialHours)

  const [form, setForm] = useState({
    name: campaign.name || '',
    headline: campaign.headline || '',
    description: campaign.description || '',
    image_url: campaign.image_url || '',
    discount_percent: campaign.discount_percent ?? 10,
    terms_text: campaign.terms_text || '',
    is_active: campaign.is_active,
    code_valid_hours: initialHours,
    code_valid_preset: presetMatch ? String(presetMatch.hours) : 'custom',
    starts_at: toDatetimeLocal(campaign.starts_at),
    ends_at: toDatetimeLocal(campaign.ends_at),
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const publicUrl = getPromoLandingUrl(campaign.slug)
  const previewImage = form.image_url || getPromoCampaignPreviewImage(campaign)
  const { download: downloadQrPng } = useDynamicQrDownload()

  const uploadImage = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch(`${adminApi}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Upload failed')
      setForm((f) => ({ ...f, image_url: j.url }))
      toast.success('Image uploaded - save changes to apply')
    } catch (e) {
      toast.error('Upload failed', { description: e.message })
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        headline: form.headline,
        description: form.description,
        image_url: form.image_url || null,
        discount_percent: form.discount_percent,
        terms_text: form.terms_text,
        is_active: form.is_active,
        code_valid_hours: Number(form.code_valid_hours) || 24,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      }
      const r = await fetch(`${adminApi}/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to save')
      toast.success('Campaign updated')
      onSaved?.(j.campaign)
    } catch (e) {
      toast.error('Save failed', { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const downloadQr = async () => {
    try {
      const { ios } = await downloadQrPng(publicUrl, { fileName: `${campaign.slug}-qr.png` })
      if (ios) toast.info('Long-press the QR code image and tap "Save to Photos"')
    } catch {
      toast.error('Could not export QR code')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Landing page content</CardTitle>
          <CardDescription>Editable text and image for this campaign's public page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign name (internal)</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              placeholder="Get 10% off your next order"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Scan, sign up, and get 10% off your next order at The 420 Doctor."
            />
          </div>
          <div className="space-y-2">
            <Label>Landing page image</Label>
            <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                <label className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-2 h-4 w-4" />
                  )}
                  {uploading ? 'Uploading…' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadImage(file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </Button>
              {form.image_url ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Use default brand video
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP or GIF - max 5MB. Shown full-screen behind the signup form. Leave empty for the default brand video.
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Code expiration</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                How long each customer&apos;s discount code stays valid after they sign up.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Validity period</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.code_valid_preset}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'custom') {
                      setForm((f) => ({ ...f, code_valid_preset: 'custom' }))
                      return
                    }
                    const hours = Number(val)
                    setForm((f) => ({ ...f, code_valid_preset: val, code_valid_hours: hours }))
                  }}
                >
                  {CODE_VALID_PRESETS.map((p) => (
                    <option key={p.hours} value={String(p.hours)}>
                      {p.label}
                    </option>
                  ))}
                  <option value="custom">Custom (hours)</option>
                </select>
              </div>
              {form.code_valid_preset === 'custom' ? (
                <div className="space-y-2">
                  <Label>Custom hours</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8760}
                    value={form.code_valid_hours}
                    onChange={(e) => setForm((f) => ({ ...f, code_valid_hours: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Applies as</Label>
                  <p className="flex h-9 items-center text-sm text-muted-foreground">
                    {formatPromoValidDuration(form.code_valid_hours)}
                  </p>
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Campaign starts (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Campaign ends (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Campaign dates control when the QR landing page accepts new signups. Code validity is separate - each signup gets their own timer.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.discount_percent}
                onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Active</Label>
              <div className="flex h-9 items-center">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Terms (optional, shown in small print)</Label>
            <Textarea
              rows={2}
              value={form.terms_text}
              onChange={(e) => setForm((f) => ({ ...f, terms_text: e.target.value }))}
              placeholder="One code per customer. Cannot be combined with other offers."
            />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">QR code</CardTitle>
          <CardDescription>Scanning this opens the public landing page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center rounded-lg border bg-white p-4">
            <DynamicQrCode id="promo-qr-svg" value={publicUrl} size={180} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Public link</Label>
            <div className="flex items-center gap-2">
              <Input value={publicUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={downloadQr}>
            <Download className="mr-2 h-4 w-4" />
            Download QR
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticsTab({ campaignId }) {
  const brand = usePromoBrand()
  const adminApi = brand.adminApiBase
  const { user } = useAuth()
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'
  const [range, setRange] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [search, setSearch] = useState('')
  const [signups, setSignups] = useState([])
  const [clicksCount, setClicksCount] = useState(0)
  const [conversionRate, setConversionRate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [resendingId, setResendingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ range })
      if (range === 'custom') {
        if (!customFrom) {
          setLoading(false)
          return
        }
        params.set('from', customFrom)
        if (customTo) params.set('to', customTo)
      }
      const trimmedSearch = search.trim()
      if (trimmedSearch) params.set('search', trimmedSearch)

      const r = await fetch(`${adminApi}/${campaignId}/analytics?${params}`, { credentials: 'include' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to load analytics')
      setSignups(j.signups || [])
      setClicksCount(j.clicks_count ?? 0)
      setConversionRate(j.conversion_rate)
    } catch (e) {
      toast.error('Failed to load analytics', { description: e.message })
    } finally {
      setLoading(false)
    }
  }, [adminApi, campaignId, range, customFrom, customTo, search])

  useEffect(() => {
    load()
  }, [load])

  const cancelSignup = async (signup) => {
    if (!window.confirm(`Cancel promo code ${signup.discount_code} for ${signup.name}? This cannot be undone.`)) {
      return
    }
    setCancellingId(signup.id)
    try {
      const r = await fetch(`${adminApi}/${campaignId}/signups/${signup.id}/cancel`, {
        method: 'POST',
        credentials: 'include',
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to cancel signup')
      setSignups((prev) =>
        prev.map((s) => (s.id === signup.id ? { ...s, ...j.signup, status: j.signup.status } : s)),
      )
      toast.success('Signup cancelled', {
        description: `${signup.discount_code} is no longer valid - that email/phone can sign up again for a new code.`,
      })
    } catch (e) {
      toast.error('Failed to cancel signup', { description: e.message })
    } finally {
      setCancellingId(null)
    }
  }

  const resendSignup = async (signup) => {
    setResendingId(signup.id)
    try {
      const r = await fetch(`${adminApi}/${campaignId}/signups/${signup.id}/resend`, {
        method: 'POST',
        credentials: 'include',
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to resend')
      const parts = []
      if (j.emailOk) parts.push('email')
      if (j.smsOk) parts.push('SMS')
      toast.success('Code resent', { description: `Sent via ${parts.join(' and ') || 'unknown channel'}.` })
    } catch (e) {
      toast.error('Failed to resend', { description: e.message })
    } finally {
      setResendingId(null)
    }
  }

  const deleteSignup = async (signup) => {
    setDeletingId(signup.id)
    try {
      const r = await fetch(`${adminApi}/${campaignId}/signups/${signup.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to delete signup')
      setSignups((prev) => prev.filter((s) => s.id !== signup.id))
      toast.success('Signup deleted')
    } catch (e) {
      toast.error('Failed to delete signup', { description: e.message })
    } finally {
      setDeletingId(null)
    }
  }

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Code', 'Status', 'Signed up', 'Expires']
    const rows = signups.map((s) => [
      s.name,
      s.email || '',
      s.phone || '',
      s.discount_code,
      formatPromoStatusLabel(s.status),
      new Date(s.created_at).toLocaleString(),
      s.expires_at ? new Date(s.expires_at).toLocaleString() : '',
    ])
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'promo-signups.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              size="sm"
              variant={range === opt.id ? 'default' : 'outline'}
              onClick={() => setRange(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="rounded-lg border bg-muted/30 px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">Views → signups</p>
          <p className="text-lg font-bold tabular-nums">
            {conversionRate != null ? `${conversionRate}%` : '-'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {signups.length} signup{signups.length === 1 ? '' : 's'} / {clicksCount} view{clicksCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-auto" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-auto" />
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Signups</CardTitle>
            <CardDescription>Everyone who scanned this campaign&apos;s QR and submitted their details.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <DebouncedInput
                placeholder="Search name, email, phone, code…"
                value={search}
                onChange={setSearch}
                delay={300}
                className="pl-9"
              />
            </div>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={signups.length === 0}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : signups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No signups in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signed up</TableHead>
                    {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signups.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.email || '-'}</TableCell>
                      <TableCell>{s.phone || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{s.discount_code}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(s.status)}>
                          {formatPromoStatusLabel(s.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(s.created_at).toLocaleString()}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {s.status === 'ongoing' ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                disabled={resendingId === s.id}
                                onClick={() => resendSignup(s)}
                              >
                                <Send className="mr-1.5 h-3.5 w-3.5" />
                                {resendingId === s.id ? 'Resending…' : 'Resend'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive hover:text-destructive"
                                disabled={cancellingId === s.id}
                                onClick={() => cancelSignup(s)}
                              >
                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </div>
                          ) : s.status === 'cancelled' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-destructive hover:text-destructive"
                                  disabled={deletingId === s.id}
                                >
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this signup?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently removes {s.name}&apos;s cancelled signup record. This can&apos;t be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteSignup(s)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PromotionCampaignPage({ params }) {
  const { campaignId } = use(params)
  const brand = usePromoBrand()
  const adminApi = brand.adminApiBase
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [brandMismatch, setBrandMismatch] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setBrandMismatch(false)
    try {
      const r = await fetch(`${adminApi}/${campaignId}`, { credentials: 'include' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Failed to load campaign')
      const loaded = j.campaign
      const rowBrand = loaded?.brand || '420_doctor'
      if (rowBrand !== brand.id) {
        setBrandMismatch(true)
        setCampaign(null)
        toast.error('Wrong campaign area', {
          description: `This campaign belongs under ${rowBrand === 'studio7' ? 'Studio 7' : '420 Doctor'} promotions.`,
        })
        return
      }
      setCampaign(loaded)
    } catch (e) {
      toast.error('Failed to load campaign', { description: e.message })
    } finally {
      setLoading(false)
    }
  }, [adminApi, campaignId, brand.id])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign?.name || 'Campaign'}</h1>
            <p className="text-muted-foreground">Edit the landing page and view analytics.</p>
          </div>
          <Link
            href={brand.adminBasePath}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'default' }),
              'inline-flex h-9 shrink-0 items-center whitespace-nowrap px-4',
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            Back to {brand.listTitle}
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Loading…</p>
        ) : brandMismatch || !campaign ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {brandMismatch ? 'Open this campaign from the correct promotions list.' : 'Campaign not found.'}
          </p>
        ) : (
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="mt-4">
              <ContentTab campaign={campaign} onSaved={setCampaign} />
            </TabsContent>
            <TabsContent value="analytics" className="mt-4">
              <AnalyticsTab campaignId={campaignId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  )
}
