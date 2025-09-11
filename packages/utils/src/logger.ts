import { createLogger, format, transports } from "winston";

// V1 Axiom Configuration
const baseLabels = {
  env: process.env.NODE_ENV ?? "development",
  region: process.env.AIBOS_REGION ?? "my-1",
  service: process.env.SERVICE_NAME ?? "unknown"
};

// V1 Dataset mapping
const AXIOM_DATASETS = {
  app: process.env.NODE_ENV === "production" ? "app_web_prod" : "app_web_staging",
  api: process.env.NODE_ENV === "production" ? "api_prod" : "api_staging", 
  jobs: process.env.NODE_ENV === "production" ? "jobs_prod" : "jobs_staging"
} as const;

export function makeLogger(dataset: "app"|"api"|"jobs") {
  const axiomDataset = AXIOM_DATASETS[dataset];
  
  const loggerTransports = [
    new transports.Console({ 
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      )
    })
  ];

  // Add Axiom transport in production
  if (process.env.AXIOM_TOKEN && process.env.AXIOM_ORG_ID) {
    try {
      // Dynamic import to handle potential import issues
      const AxiomTransport = require("@axiomhq/winston").AxiomTransport;
      loggerTransports.push(
        new AxiomTransport({ 
          dataset: axiomDataset,
          token: process.env.AXIOM_TOKEN!,
          orgId: process.env.AXIOM_ORG_ID!
        })
      );
    } catch (error) {
      console.warn("Axiom transport not available, using console only:", error instanceof Error ? error.message : String(error));
    }
  }

  return createLogger({
    level: process.env.LOG_LEVEL ?? "info",
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    ),
    defaultMeta: baseLabels,
    transports: loggerTransports
  });
}
export function withCtx(
  logger: ReturnType<typeof makeLogger>,
  ctx: { tenant_id?: string; company_id?: string; request_id?: string; user_id?: string }
) { return logger.child({ ...ctx }); }
