// @ts-nocheck
import { z } from "zod";
export const CurrencyEnum = z.enum([
  "MYR",
  "SGD",
  "THB",
  "VND",
  "IDR",
  "PHP",
  "USD",
  "EUR",
  "JPY",
  "GBP",
  "AUD",
  "CAD",
  "CHF",
  "CNH",
  "HKD",
  "NZD",
]);
export type Currency = z.infer<typeof CurrencyEnum>;
