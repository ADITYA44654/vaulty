import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — Vaultly" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode } = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">(mode ?? "signin");
  useEffect(() => { if (mode) setTab(mode); }, [mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl btn-gradient">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">Vaultly</span>
        </Link>

        <div className="glass rounded-3xl p-7">
          <div className="mb-6 flex gap-1 rounded-xl bg-secondary/60 p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  tab === t ? "btn-gradient" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {tab === "signin" && <SignInForm onForgot={() => setTab("forgot")} />}
          {tab === "signup" && <SignUpForm onDone={() => setTab("signin")} />}
          {tab === "forgot" && <ForgotForm onBack={() => setTab("signin")} />}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Encrypted in your browser. Only you can decrypt your vault.
        </p>
      </div>
    </main>
  );
}

function Field({
  icon: Icon, type = "text", ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type={type}
        {...props}
        className="w-full rounded-xl border border-border bg-input px-10 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="current-password"
        className="w-full rounded-xl border border-border bg-input px-10 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-gradient btn-gradient-hover mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
    >
      {loading ? "Please wait…" : children}
      {!loading && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

function SignInForm({ onForgot }: { onForgot: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }
  return (
    <form className="space-y-3" onSubmit={handle}>
      <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <PasswordField value={password} onChange={setPassword} placeholder="Your password" />
      <div className="flex justify-end">
        <button type="button" onClick={onForgot} className="text-xs text-muted-foreground hover:text-foreground">
          Forgot password?
        </button>
      </div>
      <SubmitBtn loading={loading}>Unlock vault</SubmitBtn>
    </form>
  );
}

function SignUpForm({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) {
      toast.success("Vault created");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Check your inbox to confirm your email");
      onDone();
    }
  }
  return (
    <form className="space-y-3" onSubmit={handle}>
      <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <PasswordField value={password} onChange={setPassword} placeholder="Create a strong password" />
      <p className="text-xs text-muted-foreground">Use at least 8 characters. This unlocks your encrypted vault.</p>
      <SubmitBtn loading={loading}>Create vault</SubmitBtn>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) { toast.error("Enter a valid email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset email sent");
    onBack();
  }
  return (
    <form className="space-y-3" onSubmit={handle}>
      <h2 className="text-base font-semibold">Reset your password</h2>
      <p className="text-xs text-muted-foreground">We'll email you a secure link to set a new password.</p>
      <Field icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <SubmitBtn loading={loading}>Send reset link</SubmitBtn>
      <button type="button" onClick={onBack} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
        Back to sign in
      </button>
    </form>
  );
}
