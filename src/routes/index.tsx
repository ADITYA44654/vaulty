import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Shield, Lock, KeyRound, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vaultly — Your Secure Password Vault" },
      { name: "description", content: "Save unlimited passwords, game IDs, and logins in an encrypted personal vault." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl btn-gradient">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <span className="font-display text-2xl">Vaultly</span>
        </div>
        <Link to="/auth" className="btn-soft px-4 py-2 text-sm font-medium">
          Sign in
        </Link>
      </nav>

      <section className="mx-auto max-w-5xl px-6 pt-12 pb-24 text-center">
        <div className="mx-auto mb-7 chip">
          <Sparkles className="h-3.5 w-3.5" />
          End-to-end encrypted
        </div>
        <h1 className="text-balance text-5xl leading-[1.02] sm:text-7xl">
          Every password,
          <br />
          <em className="not-italic text-gradient">perfectly secure.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Save unlimited app logins, game IDs, websites and credentials in a private vault only you can unlock.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="btn-gradient btn-gradient-hover gap-2 px-6 py-3 text-sm font-semibold">
            Create your vault
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth" search={{ mode: "signin" }} className="btn-soft px-6 py-3 text-sm font-semibold">
            I already have one
          </Link>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Zero-knowledge", desc: "Encrypted in your browser before storage." },
            { icon: KeyRound, title: "Unlimited entries", desc: "Save 100s of game IDs, apps and sites." },
            { icon: Shield, title: "Private vault", desc: "Strict per-user isolation. Only you see it." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 text-left">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
