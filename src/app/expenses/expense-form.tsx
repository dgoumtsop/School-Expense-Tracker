"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import type { FormState } from "@/lib/form-state";

type Option = { id: number; name: string };

type Initial = {
  id?: number;
  date?: string;
  amount?: number;
  categoryId?: number;
  accountId?: number;
  supplierId?: number | null;
  paymentMethod?: string;
  description?: string | null;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  categories: Option[];
  accounts: Option[];
  suppliers: Option[];
  initial?: Initial;
  submitLabel: string;
};

export function ExpenseForm({
  action,
  categories,
  accounts,
  suppliers,
  initial,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const formRef = useRef<HTMLFormElement>(null);

  // clear the fields after a successful add
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  // submit by hand so the form doesn't auto-reset when the server asks to confirm
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) data.set(submitter.name, submitter.value);
    startTransition(() => formAction(data));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-2 max-w-md mb-8">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <input
        name="date"
        type="date"
        required
        defaultValue={initial?.date}
        className="border rounded px-2 py-1"
      />
      <input
        name="amount"
        type="number"
        min="1"
        required
        placeholder="Amount (FCFA)"
        defaultValue={initial?.amount}
        className="border rounded px-2 py-1"
      />
      <select
        name="categoryId"
        required
        defaultValue={initial?.categoryId}
        className="border rounded px-2 py-1"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        name="accountId"
        required
        defaultValue={initial?.accountId}
        className="border rounded px-2 py-1"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <select
        name="paymentMethod"
        required
        defaultValue={initial?.paymentMethod}
        className="border rounded px-2 py-1"
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        name="supplierId"
        defaultValue={initial?.supplierId ?? ""}
        className="border rounded px-2 py-1"
      >
        <option value="">No supplier</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        name="description"
        placeholder="Description (optional)"
        defaultValue={initial?.description ?? ""}
        className="border rounded px-2 py-1"
      />

      {state.error && <p className="text-red-600">{state.error}</p>}
      {state.success && <p className="text-green-700">{state.success}</p>}
      {state.warning && <p className="text-yellow-700">{state.warning}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="border rounded px-3 py-1">
          {submitLabel}
        </button>
        {state.needsConfirm && (
          <button
            type="submit"
            name="confirm"
            value="yes"
            disabled={pending}
            className="border rounded px-3 py-1 text-red-600"
          >
            Save anyway
          </button>
        )}
      </div>
    </form>
  );
}
