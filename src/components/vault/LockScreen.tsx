import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) { setLoading(false); toast.error("Session expired"); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error("Wrong password"); return; }
    onUnlock();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl btn-gradient">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Vault locked</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your password to unlock.</p>
          <form className="mt-6 space-y-3" onSubmit={handle}>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-xl border border-border bg-input px-10 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-gradient btn-gradient-hover flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60">
              {loading ? "Unlocking…" : "Unlock"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
