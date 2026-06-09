import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { encryptString } from "@/lib/crypto";
import { Eye, EyeOff, Shuffle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { VaultItem } from "./VaultItemCard";
import { z } from "zod";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  editing: VaultItem | null;
  defaultCategory: string;
  onSaved: () => void;
}

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  category: z.string().min(1),
  username: z.string().max(200).optional(),
  password: z.string().min(1, "Password is required").max(500),
  notes: z.string().max(2000).optional(),
});

export function AddEditDialog({ open, onOpenChange, userId, editing, defaultCategory, onSaved }: Props) {
  const [category, setCategory] = useState(defaultCategory);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(editing?.category ?? defaultCategory);
      setName(editing?.name ?? "");
      setUsername(editing?.username ?? "");
      setPassword(editing?.password ?? "");
      setNotes(editing?.notes ?? "");
      setShow(false);
    }
  }, [open, editing, defaultCategory]);

  function generate() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    const arr = new Uint8Array(18);
    crypto.getRandomValues(arr);
    let out = "";
    for (let i = 0; i < arr.length; i++) out += chars[arr[i] % chars.length];
    setPassword(out);
    setShow(true);
  }

  async function handleSave() {
    const parsed = schema.safeParse({ name, category, username, password, notes });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    try {
      const encPassword = await encryptString(parsed.data.password, userId);
      const encNotes = parsed.data.notes ? await encryptString(parsed.data.notes, userId) : null;
      const payload = {
        user_id: userId,
        category: parsed.data.category,
        name: parsed.data.name,
        username: parsed.data.username || null,
        password: encPassword,
        notes: encNotes,
      };
      const res = editing
        ? await supabase.from("vault_items").update(payload).eq("id", editing.id)
        : await supabase.from("vault_items").insert(payload);
      if (res.error) throw res.error;
      toast.success(editing ? "Updated" : "Saved");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-lg border-border bg-popover/80 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{editing ? "Edit entry" : "New entry"}</DialogTitle>
          <DialogDescription>Stored encrypted in your private vault.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Category</Label>
            <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] transition ${
                      active ? "border-primary bg-primary/15" : "border-border bg-secondary/40 hover:bg-secondary"
                    }`}
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${c.gradient} text-white`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Account name / nickname</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Free Fire ID" />
          </div>

          <div>
            <Label>Username / Email / UID (optional)</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. player@game.com" />
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative mt-1">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-border bg-input px-3 py-2.5 pr-20 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button type="button" onClick={generate} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Generate">
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setShow((s) => !s)} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={show ? "Hide" : "Show"}>
                  {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Recovery info, security questions…"
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button onClick={() => onOpenChange(false)} className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-gradient btn-gradient-hover flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Save entry"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
    />
  );
}
