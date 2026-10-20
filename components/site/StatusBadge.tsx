import { STATUS_PUBLIC, type Status } from "@/lib/types";

const dot: Record<Status, string> = {
  Available: "bg-bay",
  "Prints Available": "border border-bay bg-transparent",
  Sold: "bg-rust",
  NFS: "bg-sage",
};

export function StatusBadge({ status, className = "" }: { status: Status; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-ink-soft ${className}`}>
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${dot[status]}`} />
      {STATUS_PUBLIC[status]}
    </span>
  );
}
