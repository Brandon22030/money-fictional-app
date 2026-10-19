declare namespace jest {
  // The type parameters must match the declaration merged from @types/jest.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R, T = unknown> {
    toHavePathname(pathname: string): R;
    toHavePathnameWithParams(pathname: string): R;
    toHaveSegments(segments: string[]): R;
    toHaveSearchParams(params: Record<string, string | string[]>): R;
    toHaveRouterState(state: Record<string, unknown> | undefined): R;
  }
}
