import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, Check, Download, PenLine, Search, Shuffle } from "lucide-react";
import { previewPathPrefix } from "@/lib/preview-path-prefix";
import {
  ROWS,
  TENSES,
  gradeAnswer,
  loadBook,
  resolveVerb,
  searchVerbs,
  showForms,
  type Grade,
  type VerbBook,
  type VerbForms,
} from "@/lib/verbs";

type Mode = "lookup" | "practice";
type Pool = "common" | "all";

function slotId(kind: "pp" | "prp" | "cell", row = 0, tense = 0) {
  if (kind === "pp") return "pp";
  if (kind === "prp") return "prp";
  return `c${row}-${tense}`;
}

function expectedOf(forms: VerbForms, id: string): string[] | null {
  if (id === "pp") return forms.pp.length ? forms.pp : null;
  if (id === "prp") return forms.prp.length ? forms.prp : null;
  const match = /^c(\d)-(\d)$/.exec(id);
  if (!match) return null;
  return forms.t[Number(match[2])]?.[Number(match[1])] ?? null;
}

function answerIds(forms: VerbForms) {
  const ids = ["pp", "prp"];
  for (let tense = 0; tense < TENSES.length; tense++) {
    for (let row = 0; row < ROWS.length; row++) {
      const cell = forms.t[tense]?.[row];
      if (cell && cell.length) ids.push(slotId("cell", row, tense));
    }
  }
  return ids;
}

export function Conjugator() {
  const [book, setBook] = useState<VerbBook | null>(null);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<Mode>("lookup");
  const [pool, setPool] = useState<Pool>("common");
  const [query, setQuery] = useState("être");
  const [verb, setVerb] = useState("être");
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [notice, setNotice] = useState("");
  const [pluginHref, setPluginHref] = useState("/french-verbs-raycast.zip?v=9");

  useEffect(() => {
    const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
    setPluginHref(`${prefix ?? ""}/french-verbs-raycast.zip?v=9`);
  }, []);

  useEffect(() => {
    loadBook().then(setBook).catch((err: unknown) => {
      setLoadError(err instanceof Error ? err.message : "动词表加载失败");
    });
  }, []);

  const forms = book?.verbs[verb] ?? null;
  const suggestions = useMemo(
    () => (book && query.trim() ? searchVerbs(book, query) : []),
    [book, query],
  );

  function selectVerb(next: string) {
    setVerb(next);
    setQuery(next);
    setAnswers({});
    setChecked(false);
    setNotice("");
    setOpen(false);
  }

  function commitQuery() {
    if (!book) return;
    const resolved = resolveVerb(book, query);
    if (!resolved) {
      setNotice("词库里没有这个不定式。用原形，例如 être、aller、souvenir。");
      setOpen(true);
      return;
    }
    selectVerb(resolved);
  }

  function randomVerb() {
    if (!book) return;
    const list = pool === "common" ? book.common : Object.keys(book.verbs);
    const next = list[Math.floor(Math.random() * list.length)] ?? "être";
    selectVerb(next);
    setMode("practice");
  }

  function check() {
    if (!forms) return;
    const ids = answerIds(forms);
    const filled = ids.filter((id) => (answers[id] ?? "").trim());
    if (filled.length === 0) {
      setNotice("先填几格再检查。空着的不记分。");
      setChecked(false);
      return;
    }
    setChecked(true);
    setNotice("");
  }

  const summary = useMemo(() => {
    if (!forms || !checked) return null;
    let ok = 0;
    let bad = 0;
    let empty = 0;
    for (const id of answerIds(forms)) {
      const grade = gradeAnswer(expectedOf(forms, id), answers[id] ?? "");
      if (grade === "ok") ok++;
      else if (grade === "bad") bad++;
      else if (grade === "empty") empty++;
    }
    return { ok, bad, empty, filled: ok + bad };
  }, [forms, checked, answers]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent">B1 变位练习</p>
            <h1 className="font-display text-4xl leading-none text-ink">法语变位</h1>
            <p className="mt-2 max-w-xl text-muted">
              左上角是过去分词和现在分词。其余六列按人称填写。空格不记分，两种公认拼写都算对。
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <a
              href={pluginHref}
              download="french-verbs-raycast.zip"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white"
            >
              <Download className="size-4" />
              下载 Raycast 插件
            </a>
            <p className="text-sm text-muted">
              {book ? `${Object.keys(book.verbs).length.toLocaleString("zh-CN")} 个动词` : "正在加载词库"}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="inline-flex rounded-lg bg-line p-1" role="tablist" aria-label="模式">
            <ModeButton active={mode === "lookup"} onClick={() => setMode("lookup")} icon={<BookOpen className="size-4" />}>
              查询
            </ModeButton>
            <ModeButton active={mode === "practice"} onClick={() => setMode("practice")} icon={<PenLine className="size-4" />}>
              练习
            </ModeButton>
          </div>

          <div className="relative min-w-0 flex-1">
            <label className="sr-only" htmlFor="verb-query">
              动词原形
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              id="verb-query"
              value={query}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="输入原形，如 aller、être"
              className="h-12 w-full rounded-lg border border-line bg-card pr-4 pl-10 text-base outline-none focus:border-accent"
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                setNotice("");
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (suggestions[0] && infinitivePrefersSuggestion(query, suggestions[0])) {
                    selectVerb(suggestions[0]);
                  } else {
                    commitQuery();
                  }
                }
                if (event.key === "Escape") setOpen(false);
              }}
            />
            {open && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-card py-1 shadow-sm">
                {suggestions.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-accent-soft"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectVerb(name)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={commitQuery}
            className="h-12 rounded-lg bg-accent px-5 font-semibold text-card"
          >
            打开
          </button>
        </div>

        {mode === "practice" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={randomVerb}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 font-semibold"
            >
              <Shuffle className="size-4" />
              随机一题
            </button>
            <div className="inline-flex rounded-lg border border-line bg-card p-1 text-sm">
              <PoolButton active={pool === "common"} onClick={() => setPool("common")}>
                常用 {book?.common.length ?? ""}
              </PoolButton>
              <PoolButton active={pool === "all"} onClick={() => setPool("all")}>
                全部
              </PoolButton>
            </div>
            <button
              type="button"
              onClick={check}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-4 font-semibold text-card"
            >
              <Check className="size-4" />
              检查
            </button>
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setChecked(false);
                setNotice("");
              }}
              className="h-11 rounded-lg px-3 text-muted"
            >
              清空
            </button>
            {summary && (
              <p className="text-sm">
                已填 {summary.filled} 格，正确 <span className="font-semibold text-accent">{summary.ok}</span>
                {summary.bad > 0 && (
                  <>
                    ，错误 <span className="font-semibold text-wrong">{summary.bad}</span>
                  </>
                )}
                {summary.empty > 0 && <span className="text-muted">，空着 {summary.empty}</span>}
              </p>
            )}
          </div>
        )}

        {notice && <p className="text-sm text-wrong">{notice}</p>}
        {loadError && <p className="text-sm text-wrong">{loadError}</p>}

        <section className="overflow-hidden rounded-lg border border-line bg-card">
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="font-display text-3xl leading-none">{verb}</h2>
            <p className="text-sm text-muted">{mode === "lookup" ? "查询" : "自己填，再检查"}</p>
          </div>
          {!forms && !loadError && <p className="px-4 py-8 text-muted">正在准备变位表…</p>}
          {forms && (
            <div className="overflow-x-auto">
              <table className="w-max min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="sticky left-0 z-10 min-w-36 bg-card px-3 py-3 align-bottom">
                      {mode === "lookup" ? (
                        <span className="font-display text-lg">
                          {showForms(forms.pp)}
                          <span className="text-muted"> / </span>
                          {showForms(forms.prp)}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <PartInput
                            label="过去分词"
                            value={answers.pp ?? ""}
                            grade={checked ? gradeAnswer(forms.pp, answers.pp ?? "") : undefined}
                            expected={showForms(forms.pp)}
                            onChange={(value) => setAnswers((prev) => ({ ...prev, pp: value }))}
                          />
                          <PartInput
                            label="现在分词"
                            value={answers.prp ?? ""}
                            grade={checked ? gradeAnswer(forms.prp, answers.prp ?? "") : undefined}
                            expected={showForms(forms.prp)}
                            onChange={(value) => setAnswers((prev) => ({ ...prev, prp: value }))}
                          />
                        </div>
                      )}
                      {mode === "lookup" && (
                        <span className="mt-1 block text-xs font-normal text-muted">过去分词 / 现在分词</span>
                      )}
                    </th>
                    {TENSES.map((tense) => (
                      <th key={tense.zh} className="min-w-32 px-3 py-3 align-bottom font-semibold">
                        {tense.zh}
                        <span className="mt-0.5 block text-xs font-normal text-muted">{tense.fr}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, rowIndex) => (
                    <tr key={row.label} className="border-b border-line last:border-b-0">
                      <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-semibold">{row.label}</th>
                      {TENSES.map((tense, tenseIndex) => {
                        const cell = forms.t[tenseIndex]?.[rowIndex] ?? null;
                        const id = slotId("cell", rowIndex, tenseIndex);
                        const grade = checked ? gradeAnswer(cell, answers[id] ?? "") : undefined;
                        return (
                          <td key={tense.zh} className="px-3 py-2 align-top">
                            {mode === "lookup" || !cell ? (
                              <span className={cell ? "" : "text-muted"}>{showForms(cell)}</span>
                            ) : (
                              <CellInput
                                label={`${row.label} ${tense.zh}`}
                                value={answers[id] ?? ""}
                                grade={grade}
                                expected={showForms(cell)}
                                onChange={(value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="max-w-3xl text-sm text-muted">
          变位取自《法兰西学院词典》第 9 版的整理表（v0.5.0，2026 年 10 月核对过 6,358
          个动词的简单时态）。这里用主动语态；只存在代词式的动词会带上 me / te / se。斜线两边都是可接受拼写。重音算进正误。
        </footer>
      </div>
    </main>
  );
}

function infinitivePrefersSuggestion(query: string, suggestion: string) {
  return query.trim().length > 0 && suggestion.toLowerCase().startsWith(query.trim().toLowerCase());
}

function ModeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "inline-flex h-10 items-center gap-2 rounded-md px-4 font-semibold " +
        (active ? "bg-card text-ink" : "text-muted")
      }
    >
      {icon}
      {children}
    </button>
  );
}

function PoolButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={"h-9 rounded-md px-3 font-semibold " + (active ? "bg-accent-soft text-accent" : "text-muted")}
    >
      {children}
    </button>
  );
}

function PartInput({
  label,
  value,
  onChange,
  grade,
  expected,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  grade?: Grade;
  expected: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <CellInput label={label} value={value} onChange={onChange} grade={grade} expected={expected} />
    </label>
  );
}

function CellInput({
  label,
  value,
  onChange,
  grade,
  expected,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  grade?: Grade;
  expected: string;
}) {
  const tone =
    grade === "bad"
      ? "border-wrong bg-wrong-soft"
      : grade === "ok"
        ? "border-accent bg-accent-soft"
        : "border-line bg-card";
  return (
    <div className="min-w-28">
      <input
        aria-label={label}
        value={value}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-md border px-2 text-base outline-none focus:border-accent ${tone}`}
      />
      {grade === "bad" && <p className="mt-1 text-xs text-wrong">{expected}</p>}
    </div>
  );
}
