export function waLink(mobile: string, message: string): string {
  const digits = mobile.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("91") ? digits : `91${digits}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
