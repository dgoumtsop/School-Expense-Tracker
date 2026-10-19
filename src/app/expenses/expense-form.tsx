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
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="panel grid gap-4 p-5 md:grid-cols-2"
    >
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div>
        <label htmlFor="exp-date" className="label">Date</label>
        <input
          id="exp-date"
          name="date"
          type="date"
          required
          defaultValue={initial?.date}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="exp-amount" className="label">Amount (FCFA)</label>
        <input
          id="exp-amount"
          name="amount"
          type="number"
          min="1"
          max="2147483647"
          required
          placeholder="e.g. 50000"
          defaultValue={initial?.amount}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="exp-category" className="label">Category</label>
        <select
          id="exp-category"
          name="categoryId"
          required
          defaultValue={initial?.categoryId}
          className="field"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="exp-account" className="label">Paid from account</label>
        <select
          id="exp-account"
          name="accountId"
          required
          defaultValue={initial?.accountId}
          className="field"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="exp-method" className="label">Payment method</label>
        <select
          id="exp-method"
          name="paymentMethod"
          required
          defaultValue={initial?.paymentMethod}
          className="field"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="exp-supplier" className="label">Supplier (optional)</label>
        <select
          id="exp-supplier"
          name="supplierId"
          defaultValue={initial?.supplierId ?? ""}
          className="field"
        >
          <option value="">No supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label htmlFor="exp-description" className="label">Description (optional)</label>
        <input
          id="exp-description"
          name="description"
          placeholder="What was this for?"
          defaultValue={initial?.description ?? ""}
          className="field"
        />
      </div>

      {(state.error || state.success || state.warning) && (
        <div className="md:col-span-2" role="status" aria-live="polite">
          {state.error && (
            <p className="alert alert-error">{state.error}</p>
          )}
          {state.success && (
            <p className="alert alert-success">
              {state.success}
            </p>
          )}
          {state.warning && (
            <p className="alert alert-warning">
              {state.warning}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {submitLabel}
        </button>
        {state.needsConfirm && (
          <button
            type="submit"
            name="confirm"
            value="yes"
            disabled={pending}
            className="btn btn-danger"
          >
            Save anyway
          </button>
        )}
      </div>
    </form>
  );
}
