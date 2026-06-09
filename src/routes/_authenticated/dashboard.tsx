import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { decryptString } from "@/lib/crypto";
import { Shield, Plus, Search, LogOut, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { VaultItemCard, type VaultItem } from "@/components/vault/VaultItemCard";
import { AddEditDialog } from "@/components/vault/AddEditDialog";
import { LockScreen } from "@/components/vault/LockScreen";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your Vault — Vaultly" }] }),
  component: Dashboard,
});

const INACTIVITY_MS = 5 * 60 * 1000;

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VaultItem | null>(null);
  const [locked, setLocked] = useState(false);
  const inactivityTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Auto-lock on inactivity
  useEffect(() => {
    function reset() {
      window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = window.setTimeout(() => setLocked(true), INACTIVITY_MS);
    }
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      window.clearTimeout(inactivityTimer.current);
    };
  }, []);

  const { data: items, isLoading } = useQuery({
    queryKey: ["vault_items", userId],
    enabled: !!userId,
    queryFn: async (): Promise<VaultItem[]> => {
      const { data, error } = await supabase
        .from("vault_items")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const decrypted = await Promise.all(
        (data ?? []).map(async (row) => ({
          id: row.id,
          category: row.category,
          name: row.name,
          username: row.username ?? "",
          password: await decryptString(row.password, userId!),
          notes: row.notes ? await decryptString(row.notes, userId!) : "",
        }))
      );
      return decrypted;
    },
  });

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const q = search.toLowerCase().trim();
    return items.filter((it) => {
      if (activeCategory && it.category !== activeCategory) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.username.toLowerCase().includes(q) ||
        getCategory(it.category).label.toLowerCase().includes(q)
      );
    });
  }, [items, search, activeCategory]);

  const countsByCat = useMemo(() => {
    const m = new Map<string, number>();
    items?.forEach((it) => m.set(it.category, (m.get(it.category) ?? 0) + 1));
    return m;
  }, [items]);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (locked) {
    return <LockScreen onUnlock={() => setLocked(false)} />;
  }

  return (
    <main className="min-h-screen pb-32">
      <header className="sticky top-0 z-20 border-b border-border/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl btn-gradient"><Shield className="h-5 w-5" /></div>
            <div>
              <div className="font-display text-base font-bold leading-none">Vaultly</div>
              <div className="text-[10px] text-muted-foreground">{items?.length ?? 0} entries secured</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocked(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
              aria-label="Lock vault"
            >
              <Lock className="h-4 w-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-medium hover:bg-secondary"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
            <button
              onClick={handleSignOut}
              className="sm:hidden grid h-9 w-9 place-items-center rounded-xl border border-border bg-secondary/60"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="glass rounded-3xl p-5 sm:p-8">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" /> Encrypted on device
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-4xl">
            Your <span className="text-gradient">private vault</span>
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            All your accounts, game IDs, and credentials — visible only to you.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, category…"
                className="w-full rounded-xl border border-border bg-input pl-10 pr-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="btn-gradient btn-gradient-hover flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> Add account
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <CatChip
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
            label={`All (${items?.length ?? 0})`}
          />
          {CATEGORIES.map((c) => (
            <CatChip
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
              icon={<c.icon className="h-3.5 w-3.5" />}
              label={`${c.label}${countsByCat.get(c.id) ? ` (${countsByCat.get(c.id)})` : ""}`}
              gradient={c.gradient}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="glass h-36 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState onAdd={() => { setEditing(null); setDialogOpen(true); }} hasItems={!!items?.length} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <VaultItemCard
                key={item.id}
                item={item}
                onEdit={() => { setEditing(item); setDialogOpen(true); }}
                onDelete={async () => {
                  const { error } = await supabase.from("vault_items").delete().eq("id", item.id);
                  if (error) { toast.error(error.message); return; }
                  toast.success("Deleted");
                  qc.invalidateQueries({ queryKey: ["vault_items"] });
                }}
              />
            ))}
          </div>
        )}
      </section>

      <button
        onClick={() => { setEditing(null); setDialogOpen(true); }}
        className="btn-gradient btn-gradient-hover fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-2xl sm:hidden"
        aria-label="Add account"
      >
        <Plus className="h-6 w-6" />
      </button>

      {userId && (
        <AddEditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={userId}
          editing={editing}
          defaultCategory={activeCategory ?? "website"}
          onSaved={() => qc.invalidateQueries({ queryKey: ["vault_items"] })}
        />
      )}
    </main>
  );
}

function CatChip({
  active, onClick, label, icon, gradient,
}: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode; gradient?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-transparent btn-gradient"
          : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon && (
        <span className={`grid h-4 w-4 place-items-center rounded-full ${gradient && !active ? `bg-gradient-to-br ${gradient} text-white` : ""}`}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
}

function EmptyState({ onAdd, hasItems }: { onAdd: () => void; hasItems: boolean }) {
  return (
    <div className="glass rounded-3xl p-10 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl btn-gradient">
        <Plus className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{hasItems ? "No matches" : "Your vault is empty"}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasItems ? "Try a different search or filter." : "Add your first account to get started."}
      </p>
      {!hasItems && (
        <button onClick={onAdd} className="btn-gradient btn-gradient-hover mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add first account
        </button>
      )}
    </div>
  );
}
