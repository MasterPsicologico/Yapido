declare module 'date-fns' {
  export function formatDistanceToNow(date: Date | string | number, options?: { addSuffix?: boolean; locale?: any }): string;
  export function format(date: Date | string | number, formatStr: string, options?: { locale?: any }): string;
}

declare module 'date-fns/locale/es' {
  const es: any;
  export { es };
}
