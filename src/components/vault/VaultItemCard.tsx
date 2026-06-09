import { useState } from "react";
import { Copy, Eye, EyeOff, Pencil, Trash2, MoreVertical } from "lucide-react";
import { getCategory } from "@/lib/categories";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface VaultItem {
  id: string;
  category: string;
  name: string;
  username: string;
  password: string;
  notes: string;
}

export function VaultItemCard({
  item, onEdit, onDelete,
}: { item: VaultItem; onEdit: () => void; onDelete: () => void }) {
  const cat = getCategory(item.category);
  const [show, setShow] = useState(false);
  const Icon = cat.icon;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-0.5">
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${cat.gradient} opacity-20 blur-2xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-lg`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{item.name}</div>
            <div className="truncate text-xs text-muted-foreground">{cat.label}</div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Menu">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DeleteItem onConfirm={onDelete} name={item.name} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 space-y-2">
        {item.username && (
          <Row label="Username" value={item.username} onCopy={() => copy(item.username, "Username")} />
        )}
        <Row
          label="Password"
          value={show ? item.password : "•".repeat(Math.min(item.password.length || 8, 14))}
          onCopy={() => copy(item.password, "Password")}
          extra={
            <button onClick={() => setShow((s) => !s)} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={show ? "Hide" : "Show"}>
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          }
          mono
        />
        {item.notes && (
          <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            {item.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label, value, onCopy, extra, mono,
}: { label: string; value: string; onCopy: () => void; extra?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`truncate text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
      {extra}
      <button onClick={onCopy} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Copy ${label}`}>
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DeleteItem({ onConfirm, name }: { onConfirm: () => void; name: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>This entry will be permanently removed from your vault.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
