import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Check, i as PenLine, n as Shuffle, o as BookOpen, r as Search } from "../_libs/lucide-react.mjs";
import { n as previewPathPrefix } from "./router-DRfz9O88.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BE1m9_6S.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TENSES = [
	{
		zh: "现在时",
		fr: "présent"
	},
	{
		zh: "未完成过去时",
		fr: "imparfait"
	},
	{
		zh: "简单将来时",
		fr: "futur simple"
	},
	{
		zh: "条件式现在时",
		fr: "conditionnel"
	},
	{
		zh: "虚拟式现在时",
		fr: "subjonctif"
	},
	{
		zh: "命令式",
		fr: "impératif"
	}
];
var ROWS = [
	{ label: "je" },
	{ label: "tu" },
	{ label: "il / elle" },
	{ label: "nous" },
	{ label: "vous" },
	{ label: "ils / elles" }
];
var bookPromise = null;
function assetUrl(path) {
	if (typeof window === "undefined") return path;
	return `${previewPathPrefix(window.location.hostname, window.location.pathname) ?? ""}${path}`;
}
function loadBook() {
	if (!bookPromise) bookPromise = fetch(assetUrl("/verbs.json")).then((res) => {
		if (!res.ok) throw new Error("动词表加载失败");
		return res.json();
	});
	return bookPromise;
}
function fold(input) {
	return input.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/œ/g, "oe").replace(/æ/g, "ae").toLowerCase().trim();
}
function infinitiveQuery(input) {
	return fold(input).replace(/^s['’]\s*/, "").replace(/^se\s+/, "");
}
function normAnswer(input) {
	return input.normalize("NFC").trim().toLowerCase().replace(/[’ʼ′]/g, "'").replace(/\s+/g, " ");
}
function showForms(forms) {
	if (!forms || forms.length === 0) return "—";
	return forms.join(" / ");
}
function gradeAnswer(expected, raw) {
	if (!expected || expected.length === 0) return "na";
	if (!raw.trim()) return "empty";
	const n = normAnswer(raw);
	return expected.some((form) => normAnswer(form) === n) ? "ok" : "bad";
}
function searchVerbs(book, raw, limit = 8) {
	const q = infinitiveQuery(raw);
	if (!q) return [];
	const names = Object.keys(book.verbs);
	const exact = [];
	const prefix = [];
	const contains = [];
	for (const name of names) {
		const folded = fold(name);
		if (folded === q) exact.push(name);
		else if (folded.startsWith(q)) prefix.push(name);
		else if (folded.includes(q)) contains.push(name);
	}
	return [
		...exact,
		...prefix,
		...contains
	].slice(0, limit);
}
function resolveVerb(book, raw) {
	const q = infinitiveQuery(raw);
	if (!q) return null;
	if (book.verbs[raw.trim().toLowerCase()]) return raw.trim().toLowerCase();
	return Object.keys(book.verbs).find((name) => fold(name) === q) ?? null;
}
function slotId(kind, row = 0, tense = 0) {
	if (kind === "pp") return "pp";
	if (kind === "prp") return "prp";
	return `c${row}-${tense}`;
}
function expectedOf(forms, id) {
	if (id === "pp") return forms.pp.length ? forms.pp : null;
	if (id === "prp") return forms.prp.length ? forms.prp : null;
	const match = /^c(\d)-(\d)$/.exec(id);
	if (!match) return null;
	return forms.t[Number(match[2])]?.[Number(match[1])] ?? null;
}
function answerIds(forms) {
	const ids = ["pp", "prp"];
	for (let tense = 0; tense < TENSES.length; tense++) for (let row = 0; row < ROWS.length; row++) {
		const cell = forms.t[tense]?.[row];
		if (cell && cell.length) ids.push(slotId("cell", row, tense));
	}
	return ids;
}
function Conjugator() {
	const [book, setBook] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)("");
	const [mode, setMode] = (0, import_react.useState)("lookup");
	const [pool, setPool] = (0, import_react.useState)("common");
	const [query, setQuery] = (0, import_react.useState)("être");
	const [verb, setVerb] = (0, import_react.useState)("être");
	const [open, setOpen] = (0, import_react.useState)(false);
	const [answers, setAnswers] = (0, import_react.useState)({});
	const [checked, setChecked] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		loadBook().then(setBook).catch((err) => {
			setLoadError(err instanceof Error ? err.message : "动词表加载失败");
		});
	}, []);
	const forms = book?.verbs[verb] ?? null;
	const suggestions = (0, import_react.useMemo)(() => book && query.trim() ? searchVerbs(book, query) : [], [book, query]);
	function selectVerb(next) {
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
		selectVerb(list[Math.floor(Math.random() * list.length)] ?? "être");
		setMode("practice");
	}
	function check() {
		if (!forms) return;
		if (answerIds(forms).filter((id) => (answers[id] ?? "").trim()).length === 0) {
			setNotice("先填几格再检查。空着的不记分。");
			setChecked(false);
			return;
		}
		setChecked(true);
		setNotice("");
	}
	const summary = (0, import_react.useMemo)(() => {
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
		return {
			ok,
			bad,
			empty,
			filled: ok + bad
		};
	}, [
		forms,
		checked,
		answers
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-paper text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold tracking-wide text-accent",
							children: "B1 变位练习"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-4xl leading-none text-ink",
							children: "法语变位"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-xl text-muted",
							children: "左上角是过去分词和现在分词。其余六列按人称填写。空格不记分，两种公认拼写都算对。"
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: book ? `${Object.keys(book.verbs).length.toLocaleString("zh-CN")} 个动词` : "正在加载词库"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 lg:flex-row lg:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex rounded-lg bg-line p-1",
							role: "tablist",
							"aria-label": "模式",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
								active: mode === "lookup",
								onClick: () => setMode("lookup"),
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" }),
								children: "查询"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
								active: mode === "practice",
								onClick: () => setMode("practice"),
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "size-4" }),
								children: "练习"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "verb-query",
									children: "动词原形"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "verb-query",
									value: query,
									autoCapitalize: "none",
									autoCorrect: "off",
									spellCheck: false,
									placeholder: "输入原形，如 aller、être",
									className: "h-12 w-full rounded-lg border border-line bg-card pr-4 pl-10 text-base outline-none focus:border-accent",
									onChange: (event) => {
										setQuery(event.target.value);
										setOpen(true);
										setNotice("");
									},
									onFocus: () => setOpen(true),
									onKeyDown: (event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											if (suggestions[0] && infinitivePrefersSuggestion(query, suggestions[0])) selectVerb(suggestions[0]);
											else commitQuery();
										}
										if (event.key === "Escape") setOpen(false);
									}
								}),
								open && suggestions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-card py-1 shadow-sm",
									children: suggestions.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "block w-full px-3 py-2 text-left hover:bg-accent-soft",
										onMouseDown: (event) => event.preventDefault(),
										onClick: () => selectVerb(name),
										children: name
									}) }, name))
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: commitQuery,
							className: "h-12 rounded-lg bg-accent px-5 font-semibold text-card",
							children: "打开"
						})
					]
				}),
				mode === "practice" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: randomVerb,
							className: "inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { className: "size-4" }), "随机一题"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex rounded-lg border border-line bg-card p-1 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PoolButton, {
								active: pool === "common",
								onClick: () => setPool("common"),
								children: ["常用 ", book?.common.length ?? ""]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoolButton, {
								active: pool === "all",
								onClick: () => setPool("all"),
								children: "全部"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: check,
							className: "inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-4 font-semibold text-card",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "检查"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setAnswers({});
								setChecked(false);
								setNotice("");
							},
							className: "h-11 rounded-lg px-3 text-muted",
							children: "清空"
						}),
						summary && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [
								"已填 ",
								summary.filled,
								" 格，正确 ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-accent",
									children: summary.ok
								}),
								summary.bad > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["，错误 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-wrong",
									children: summary.bad
								})] }),
								summary.empty > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: ["，空着 ", summary.empty]
								})
							]
						})
					]
				}),
				notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-wrong",
					children: notice
				}),
				loadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-wrong",
					children: loadError
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "overflow-hidden rounded-lg border border-line bg-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3 border-b border-line px-4 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl leading-none",
								children: verb
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: mode === "lookup" ? "查询" : "自己填，再检查"
							})]
						}),
						!forms && !loadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-4 py-8 text-muted",
							children: "正在准备变位表…"
						}),
						forms && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "overflow-x-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "w-max min-w-full border-collapse",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-line text-left",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "sticky left-0 z-10 min-w-36 bg-card px-3 py-3 align-bottom",
										children: [mode === "lookup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-display text-lg",
											children: [
												showForms(forms.pp),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-muted",
													children: " / "
												}),
												showForms(forms.prp)
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartInput, {
												label: "过去分词",
												value: answers.pp ?? "",
												grade: checked ? gradeAnswer(forms.pp, answers.pp ?? "") : void 0,
												expected: showForms(forms.pp),
												onChange: (value) => setAnswers((prev) => ({
													...prev,
													pp: value
												}))
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartInput, {
												label: "现在分词",
												value: answers.prp ?? "",
												grade: checked ? gradeAnswer(forms.prp, answers.prp ?? "") : void 0,
												expected: showForms(forms.prp),
												onChange: (value) => setAnswers((prev) => ({
													...prev,
													prp: value
												}))
											})]
										}), mode === "lookup" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-1 block text-xs font-normal text-muted",
											children: "过去分词 / 现在分词"
										})]
									}), TENSES.map((tense) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
										className: "min-w-32 px-3 py-3 align-bottom font-semibold",
										children: [tense.zh, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mt-0.5 block text-xs font-normal text-muted",
											children: tense.fr
										})]
									}, tense.zh))]
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ROWS.map((row, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-line last:border-b-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "sticky left-0 z-10 bg-card px-3 py-2 text-left font-semibold",
										children: row.label
									}), TENSES.map((tense, tenseIndex) => {
										const cell = forms.t[tenseIndex]?.[rowIndex] ?? null;
										const id = slotId("cell", rowIndex, tenseIndex);
										const grade = checked ? gradeAnswer(cell, answers[id] ?? "") : void 0;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-3 py-2 align-top",
											children: mode === "lookup" || !cell ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cell ? "" : "text-muted",
												children: showForms(cell)
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CellInput, {
												label: `${row.label} ${tense.zh}`,
												value: answers[id] ?? "",
												grade,
												expected: showForms(cell),
												onChange: (value) => setAnswers((prev) => ({
													...prev,
													[id]: value
												}))
											})
										}, tense.zh);
									})]
								}, row.label)) })]
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
					className: "max-w-3xl text-sm text-muted",
					children: "变位取自《法兰西学院词典》第 9 版的整理表（v0.5.0，2026 年 10 月核对过 6,358 个动词的简单时态）。这里用主动语态；只存在代词式的动词会带上 me / te / se。斜线两边都是可接受拼写。重音算进正误。"
				})
			]
		})
	});
}
function infinitivePrefersSuggestion(query, suggestion) {
	return query.trim().length > 0 && suggestion.toLowerCase().startsWith(query.trim().toLowerCase());
}
function ModeButton({ active, onClick, icon, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		role: "tab",
		"aria-selected": active,
		onClick,
		className: "inline-flex h-10 items-center gap-2 rounded-md px-4 font-semibold " + (active ? "bg-card text-ink" : "text-muted"),
		children: [icon, children]
	});
}
function PoolButton({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "h-9 rounded-md px-3 font-semibold " + (active ? "bg-accent-soft text-accent" : "text-muted"),
		children
	});
}
function PartInput({ label, value, onChange, grade, expected }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CellInput, {
			label,
			value,
			onChange,
			grade,
			expected
		})]
	});
}
function CellInput({ label, value, onChange, grade, expected }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-w-28",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			"aria-label": label,
			value,
			autoCapitalize: "none",
			autoCorrect: "off",
			spellCheck: false,
			onChange: (event) => onChange(event.target.value),
			className: `h-11 w-full rounded-md border px-2 text-base outline-none focus:border-accent ${grade === "bad" ? "border-wrong bg-wrong-soft" : grade === "ok" ? "border-accent bg-accent-soft" : "border-line bg-card"}`
		}), grade === "bad" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-wrong",
			children: expected
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Conjugator, {});
}
//#endregion
export { Home as component };
