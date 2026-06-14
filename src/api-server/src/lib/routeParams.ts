export function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function routeParamInt(value: string | string[] | undefined): number {
  return parseInt(routeParam(value), 10);
}
