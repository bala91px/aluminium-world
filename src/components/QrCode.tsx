// No-key public QR image endpoint — fine for a demo, read only at runtime by
// the browser (not the build), so it doesn't touch the static export at all.
export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="QR code" width={size} height={size} className="rounded-lg border border-border" />
  );
}
