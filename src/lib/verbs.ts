import { previewPathPrefix } from "@/lib/preview-path-prefix";

export type Cell = string[] | null;

export type VerbForms = {
  pp: string[];
  prp: string[];
  /** présent, imparfait, futur, conditionnel, subjonctif, impératif. 6 persons each. */
  t: Cell[][];
};

export type VerbBook = {
  source: string;
  version: string;
  verbs: Record<string, VerbForms>;
  common: string[];
};

export const TENSES = [
  { zh: "现在时", fr: "présent" },
  { zh: "未完成过去时", fr: "imparfait" },
  { zh: "简单将来时", fr: "futur simple" },
  { zh: "条件式现在时", fr: "conditionnel" },
  { zh: "虚拟式现在时", fr: "subjonctif" },
  { zh: "命令式", fr: "impératif" },
] as const;

export const ROWS = [
  { label: "je" },
  { label: "tu" },
  { label: "il / elle" },
  { label: "nous" },
  { label: "vous" },
  { label: "ils / elles" },
] as const;

let bookPromise: Promise<VerbBook> | null = null;

function assetUrl(path: string) {
  if (typeof window === "undefined") return path;
  const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
  return `${prefix ?? ""}${path}`;
}

export function loadBook() {
  if (!bookPromise) {
    bookPromise = fetch(assetUrl("/verbs.json")).then((res) => {
      if (!res.ok) throw new Error("动词表加载失败");
      return res.json() as Promise<VerbBook>;
    });
  }
  return bookPromise;
}

export function fold(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .toLowerCase()
    .trim();
}

export function infinitiveQuery(input: string) {
  return fold(input)
    .replace(/^s['’]\s*/, "")
    .replace(/^se\s+/, "");
}

export function normAnswer(input: string) {
  return input
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[’ʼ′]/g, "'")
    .replace(/\s+/g, " ");
}

export function showForms(forms: string[] | null | undefined) {
  if (!forms || forms.length === 0) return "—";
  return forms.join(" / ");
}

export type Grade = "na" | "empty" | "ok" | "bad";

export function gradeAnswer(expected: string[] | null | undefined, raw: string): Grade {
  if (!expected || expected.length === 0) return "na";
  if (!raw.trim()) return "empty";
  const n = normAnswer(raw);
  return expected.some((form) => normAnswer(form) === n) ? "ok" : "bad";
}

export function searchVerbs(book: VerbBook, raw: string, limit = 8) {
  const q = infinitiveQuery(raw);
  if (!q) return [];
  const names = Object.keys(book.verbs);
  const exact: string[] = [];
  const prefix: string[] = [];
  const contains: string[] = [];
  for (const name of names) {
    const folded = fold(name);
    if (folded === q) exact.push(name);
    else if (folded.startsWith(q)) prefix.push(name);
    else if (folded.includes(q)) contains.push(name);
  }
  return [...exact, ...prefix, ...contains].slice(0, limit);
}

export function resolveVerb(book: VerbBook, raw: string) {
  const q = infinitiveQuery(raw);
  if (!q) return null;
  if (book.verbs[raw.trim().toLowerCase()]) return raw.trim().toLowerCase();
  const exact = Object.keys(book.verbs).find((name) => fold(name) === q);
  return exact ?? null;
}
