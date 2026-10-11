// what a form action sends back to the form
export type FormState = {
  error?: string;
  warning?: string;
  success?: string;
  needsConfirm?: boolean;
};
