// Static export + GitHub Pages means every public link is a query-string
// route (no [token] dynamic segments — see CLAUDE.md §11), built from the
// same basePath the app itself was built with.
export function publicUrl(path: "/q" | "/track" | "/delivery", token: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${basePath}${path}?token=${token}`;
}
