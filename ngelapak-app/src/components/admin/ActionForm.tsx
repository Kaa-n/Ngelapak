"use client";

import { useActionState, type ReactNode } from "react";

export type ActionState = { success?: string; error?: string };
export type AdminAction = (state: ActionState, data: FormData) => Promise<ActionState>;


export default function ActionForm({
  action, children, label, danger = false,
}: {
  action: AdminAction;
  children?: ReactNode;
  label: string;
  danger?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="flex min-w-0 flex-col items-start gap-3">
      <fieldset className="w-full min-w-0 space-y-3" disabled={pending}>
        {children}
        <button
          type="submit"
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${danger ? "bg-red-700" : "bg-[#003466]"}`}
        >
          {pending ? "Menyimpan…" : label}
        </button>
      </fieldset>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-800">{state.success}</p>}
    </form>
  );
}
