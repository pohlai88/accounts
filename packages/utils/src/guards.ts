// Property guards for dynamic object access
export function hasProp<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return !!obj && typeof obj === "object" && prop in (obj as any);
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function hasProps<T extends string>(
  obj: unknown,
  props: readonly T[]
): obj is Record<T, unknown> {
  return !!obj && typeof obj === "object" && props.every(prop => prop in (obj as any));
}

export function isStringRecord(v: unknown): v is Record<string, string> {
  return isRecord(v) && Object.values(v).every(val => typeof val === "string");
}

export function isNumberRecord(v: unknown): v is Record<string, number> {
  return isRecord(v) && Object.values(v).every(val => typeof val === "number");
}
