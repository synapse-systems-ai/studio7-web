"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-jwt-auth";
import { hasPromotionsAdminAccess } from "@/lib/promotions-auth";

export function Studio7UsersPage() {
  const { data: session } = useSession();
  const isAdmin = hasPromotionsAdminAccess(session?.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to load users");
      setUsers(j.users || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.is_active).length;
    const admins = users.filter((u) => String(u.role).toLowerCase() === "admin").length;
    return { total: users.length, active, admins };
  }, [users]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Team access</p>
            <h1 className="text-3xl font-bold tracking-tight">User management</h1>
            <p className="text-zinc-600">
              Create team logins here, or let people register on the public sign-up page (marketing access by default).
            </p>
          </div>
          {isAdmin && <CreateUserDialog onCreated={load} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-zinc-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-700">Team members</CardTitle>
              <Users className="size-4 text-violet-600" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{loading ? "-" : stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-700">Active</CardTitle>
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{loading ? "-" : stats.active}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-700">Admins</CardTitle>
              <ShieldCheck className="size-4 text-zinc-500" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">{loading ? "-" : stats.admins}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-zinc-300 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-zinc-900">Team directory</CardTitle>
            <CardDescription className="text-zinc-600">
              Roles with access to promotions: admin, marketing, store_manager
            </CardDescription>
          </CardHeader>
          <CardContent className="text-zinc-900">
            {loading ? (
              <p className="py-10 text-center text-sm font-medium text-zinc-600">Loading team…</p>
            ) : users.length === 0 ? (
              <p className="py-10 text-center text-sm font-medium text-zinc-600">
                No users yet. Add your first team member.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 bg-zinc-100 hover:bg-zinc-100">
                    <TableHead className="px-4 font-semibold text-zinc-800">Name</TableHead>
                    <TableHead className="px-4 font-semibold text-zinc-800">Email</TableHead>
                    <TableHead className="px-4 font-semibold text-zinc-800">Role</TableHead>
                    <TableHead className="px-4 font-semibold text-zinc-800">Status</TableHead>
                    {isAdmin ? (
                      <TableHead className="px-4 text-right font-semibold text-zinc-800">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="border-zinc-200">
                      <TableCell className="px-4 font-semibold text-zinc-900">{u.name || "-"}</TableCell>
                      <TableCell className="px-4 text-zinc-800">{u.email}</TableCell>
                      <TableCell className="px-4">
                        <Badge
                          variant="outline"
                          className="border-violet-200 bg-violet-50 font-medium capitalize text-violet-900"
                        >
                          {u.role?.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge
                          variant="outline"
                          className={
                            u.is_active
                              ? "border-emerald-200 bg-emerald-50 font-medium text-emerald-900"
                              : "border-zinc-300 bg-zinc-100 font-medium text-zinc-700"
                          }
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      {isAdmin ? (
                        <TableCell className="px-4 text-right">
                          <DeleteUserButton
                            user={u}
                            currentUserId={session?.user?.id}
                            onDeleted={load}
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function DeleteUserButton({ user, currentUserId, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const isSelf = String(currentUserId) === String(user.id);

  const remove = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not remove user");
      toast.success(`${user.name || user.email} removed from Studio 7`);
      onDeleted?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  if (isSelf) {
    return <span className="text-xs text-zinc-500">You</span>;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          disabled={deleting}
        >
          <Trash2 className="mr-1.5 size-4" aria-hidden />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove team member?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-zinc-900">{user.name}</span> ({user.email}) will lose access to Studio
            7 admin. Their account stays in the database but is deactivated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              remove();
            }}
          >
            {deleting ? "Removing…" : "Delete user"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CreateUserDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("marketing");

  const submit = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to create user");
      toast.success("User created");
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      onCreated?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New team member</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="store_manager">Store manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !name || !email || !password}>
            {saving ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
