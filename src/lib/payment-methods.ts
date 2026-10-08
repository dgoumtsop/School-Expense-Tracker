// values match the PaymentMethod enum in schema.prisma
export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "MOBILE_MONEY", label: "Mobile money" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];