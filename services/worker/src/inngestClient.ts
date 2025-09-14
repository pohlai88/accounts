import { Inngest } from "inngest";

// V1 Inngest Configuration with DLQ and retry policies
export const inngest = new Inngest({
  id: "aibos-worker",
  name: "AIBOS Worker",
  retries: 3,
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  isDev: process.env.NODE_ENV === "development",
});
