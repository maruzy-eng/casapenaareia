import { Trash2 } from "lucide-react";
import { deleteBlockedDate } from "@/lib/actions/admin/blocked-dates";

type DeleteBlockedDateButtonProps = {
  id: string;
};

export function DeleteBlockedDateButton({ id }: DeleteBlockedDateButtonProps) {
  return (
    <form action={deleteBlockedDate}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700 transition hover:bg-rose-100"
      >
        <Trash2 className="h-4 w-4" />
        Remover
      </button>
    </form>
  );
}
