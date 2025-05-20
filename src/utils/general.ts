export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export const appendTimestamp = (string: string) => string + '-' + Date.now();
