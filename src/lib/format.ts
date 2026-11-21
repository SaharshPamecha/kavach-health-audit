export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export const inrShort = (n: number) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  if (n >= 1000) return "₹" + Math.round(n / 1000) + "k";
  return "₹" + Math.round(n);
};

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;

export const cn = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");
