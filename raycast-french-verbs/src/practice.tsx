import { Action, ActionPanel, Grid, Icon, showToast, Toast, type LaunchProps } from "@raycast/api";
import { useRef, useState, type JSX } from "react";
import { cellImage, type BoardSlot, type CellStyle } from "./cell-image";
import { book, hAspire, randomVerb } from "./data";
import { EditMine } from "./edit-mine";
import {
  expectedOf,
  gradeAnswer,
  ROWS,
  showForms,
  slotLabel,
  speechLines,
  TENSES,
  type SpeechLine,
  type VerbForms,
} from "./model";
import { addMine, loadMine, randomOf, removeMine } from "./mine";
import { OpenVerb } from "./open-verb";
import { playSpeech } from "./speech";

const TENSE_KEYS = ["1", "2", "3", "4", "5", "6"] as const;

export default function PracticeCommand(props: LaunchProps) {
  return (
    <OpenVerb
      fallbackText={props.fallbackText}
      render={({ infinitive, pick }) => <PracticeGrid key={infinitive} infinitive={infinitive} onPick={pick} />}
    />
  );
}

function PracticeGrid({ infinitive, onPick }: { infinitive: string; onPick: (infinitive: string) => void }) {
  const forms = book.verbs[infinitive];
  const start = forms?.pp.length ? "pp" : "c0-0";
  const [cursor, setCursor] = useState(start);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");
  const [checked, setChecked] = useState(false);
  const cursorRef = useRef(cursor);
  const answersRef = useRef(answers);
  const echo = useRef<string | null>(null);
  const lock = useRef(false);
  cursorRef.current = cursor;
  answersRef.current = answers;

  if (!forms) return <Grid><Grid.EmptyView title="没有这个动词" /></Grid>;

  function remember(id: string, value: string) {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
  }

  function select(id: string) {
    const value = answersRef.current[id] ?? "";
    echo.current = value;
    cursorRef.current = id;
    lock.current = true;
    setCursor(id);
    setSearchText(value);
    setTimeout(() => {
      lock.current = false;
    }, 120);
  }

  function onSelectionChange(id: string | null) {
    if (!id) return;
    if (lock.current) {
      if (id !== cursorRef.current) setCursor(cursorRef.current);
      return;
    }
    if (id !== cursorRef.current) select(id);
  }

  function onSearch(value: string) {
    if (echo.current !== null && value === echo.current) {
      echo.current = null;
      return;
    }
    echo.current = null;
    const id = cursorRef.current;
    if (!editable(forms!, id)) return;
    lock.current = true;
    setSearchText(value);
    remember(id, value);
    setChecked(false);
    setTimeout(() => {
      lock.current = false;
    }, 120);
  }

  function moveDown() {
    const id = cursorRef.current;
    const down = neighbor(forms!, id, 1, 0);
    if (down) {
      select(down);
      return;
    }
    const col = columnOf(id) ?? -1;
    for (let nextCol = col + 1; nextCol < TENSES.length; nextCol++) {
      select(`c0-${nextCol}`);
      return;
    }
    select(forms!.pp.length ? "pp" : "c0-0");
  }

  function check() {
    const ids = editableIds(forms!);
    const filled = ids.filter((id) => (answersRef.current[id] ?? "").trim());
    if (!filled.length) {
      showToast({ style: Toast.Style.Failure, title: "先填几格再检查", message: "空着的不记分" });
      setChecked(false);
      return;
    }
    setChecked(true);
    let ok = 0;
    let bad = 0;
    for (const id of filled) {
      const grade = gradeAnswer(expectedOf(forms!, id), answersRef.current[id] ?? "");
      if (grade === "ok") ok++;
      else if (grade === "bad") bad++;
    }
    showToast({
      style: bad ? Toast.Style.Failure : Toast.Style.Success,
      title: `已填 ${filled.length}，正确 ${ok}，错误 ${bad}`,
      message: bad ? "错的格子下面，红色是正确拼写" : "这一格都对",
    });
  }

  function reset() {
    answersRef.current = {};
    setAnswers({});
    setChecked(false);
    select(cursorRef.current);
    setSearchText("");
    echo.current = "";
  }

  const lines = speechLines(infinitive, forms, hAspire.has(infinitive));
  const actions = (primary: JSX.Element) => (
    <ActionPanel>
      {primary}
      <Action title="检查" icon={Icon.Check} shortcut={{ modifiers: ["cmd"], key: "return" }} onAction={check} />
      {lines.map((line) => (
        <Action
          key={line.id}
          title={line.zh}
          icon={Icon.Speaker}
          shortcut={shortcutFor(line)}
          onAction={() => playSpeech(line.speech, line.zh)}
        />
      ))}
      <Action title="清空" icon={Icon.Trash} onAction={reset} />
      <Action title="换一个动词" icon={Icon.Book} onAction={() => onPick("")} />
      <Action
        title="加入我的动词"
        icon={Icon.Plus}
        onAction={() =>
          void addMine(infinitive).then((added) =>
            showToast({ style: Toast.Style.Success, title: added ? "已加入我的动词" : "已经在我的动词里" }),
          )
        }
      />
      <Action
        title="移出我的动词"
        icon={Icon.Minus}
        onAction={() =>
          void removeMine(infinitive).then(() => showToast({ style: Toast.Style.Success, title: "已移出我的动词" }))
        }
      />
      <Action.Push title="编辑我的动词" icon={Icon.Pencil} target={<EditMine />} />
      <Action
        title="随机我的"
        icon={Icon.Shuffle}
        onAction={() =>
          void loadMine().then((list) => {
            if (!list.length) {
              showToast({ style: Toast.Style.Failure, title: "我的动词还是空的" });
              return;
            }
            onPick(randomOf(list));
          })
        }
      />
      <Action title="随机常用" icon={Icon.Shuffle} onAction={() => onPick(randomVerb("common"))} />
      <Action title="随机全部" icon={Icon.Shuffle} onAction={() => onPick(randomVerb("all"))} />
    </ActionPanel>
  );

  const participleIds = [...(forms.pp.length ? ["pp"] : []), ...(forms.prp.length ? ["prp"] : [])];
  const personIds = ROWS.flatMap((_, row) => TENSES.map((__, tense) => `c${row}-${tense}`));

  function renderItem(id: string) {
    const slot = slotOf(forms!, answers, checked, cursor, id);
    return (
      <Grid.Item
        key={id}
        id={id}
        content={cellImage(slot.main, slot.label, slot.style, slot.correct)}
        actions={actions(<Action title="下一行" icon={Icon.ArrowDown} onAction={moveDown} />)}
      />
    );
  }

  return (
    <Grid
      navigationTitle={infinitive}
      columns={6}
      aspectRatio="16/9"
      inset={Grid.Inset.Zero}
      fit={Grid.Fit.Fill}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={onSearch}
      onSelectionChange={onSelectionChange}
      selectedItemId={cursor}
      searchBarPlaceholder={`填写 ${slotLabel(cursor)} · 方向键换格 · 回车下一行 · ⌘↩ 检查`}
    >
      {participleIds.length > 0 && (
        <Grid.Section columns={6} aspectRatio="16/9" inset={Grid.Inset.Zero} fit={Grid.Fit.Fill}>
          {participleIds.map(renderItem)}
        </Grid.Section>
      )}
      <Grid.Section columns={6} aspectRatio="16/9" inset={Grid.Inset.Zero} fit={Grid.Fit.Fill}>
        {personIds.map(renderItem)}
      </Grid.Section>
    </Grid>
  );
}

function shortcutFor(line: SpeechLine) {
  if (line.id === "part") return { modifiers: ["cmd" as const], key: "0" as const };
  const match = /^t(\d)$/.exec(line.id);
  const key = match ? TENSE_KEYS[Number(match[1])] : undefined;
  if (!key) return undefined;
  return { modifiers: ["cmd" as const], key };
}

function editable(forms: VerbForms, id: string) {
  return Boolean(expectedOf(forms, id));
}

function editableIds(forms: VerbForms) {
  const ids: string[] = [];
  if (forms.pp.length) ids.push("pp");
  if (forms.prp.length) ids.push("prp");
  for (let tense = 0; tense < TENSES.length; tense++) {
    for (let row = 0; row < ROWS.length; row++) {
      const id = `c${row}-${tense}`;
      if (expectedOf(forms, id)) ids.push(id);
    }
  }
  return ids;
}

function columnOf(id: string) {
  if (id === "pp") return 0;
  if (id === "prp") return 1;
  const match = /^c(\d)-(\d)$/.exec(id);
  return match ? Number(match[2]) : null;
}

function rowOf(id: string) {
  if (id === "pp" || id === "prp") return -1;
  const match = /^c(\d)-(\d)$/.exec(id);
  return match ? Number(match[1]) : null;
}

function idAt(row: number, col: number) {
  if (row < 0) return col === 0 ? "pp" : col === 1 ? "prp" : null;
  if (row >= ROWS.length || col < 0 || col >= TENSES.length) return null;
  return `c${row}-${col}`;
}

function neighbor(forms: VerbForms, id: string, dRow: number, dCol: number) {
  const row = rowOf(id);
  const col = columnOf(id);
  if (row === null || col === null) return null;
  const next = idAt(row + dRow, col + dCol);
  if (!next) return null;
  if (next === "pp" && !forms.pp.length) return null;
  if (next === "prp" && !forms.prp.length) return null;
  return next;
}

function slotOf(
  forms: VerbForms,
  answers: Record<string, string>,
  checked: boolean,
  cursor: string,
  id: string,
): BoardSlot {
  const text = cellText(forms, answers, checked, id);
  return { ...text, style: cellStyle(forms, answers, checked, cursor, id) };
}

function cellText(forms: VerbForms, answers: Record<string, string>, checked: boolean, id: string) {
  const label =
    id === "pp" ? "过去分词" : id === "prp" ? "现在分词" : id.startsWith("c0-") ? (TENSES[Number(id.slice(3))]?.zh ?? "") : "";
  if (!expectedOf(forms, id)) return { main: "—", label, correct: undefined as string | undefined };
  const raw = (answers[id] ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return { main: "____", label, correct: undefined };
  const expected = expectedOf(forms, id);
  if (checked && expected && gradeAnswer(expected, raw) === "bad") {
    return { main: raw, label, correct: showForms(expected) };
  }
  return { main: raw, label, correct: undefined };
}

function cellStyle(
  forms: VerbForms,
  answers: Record<string, string>,
  checked: boolean,
  cursor: string,
  id: string,
): CellStyle {
  if (!expectedOf(forms, id)) return "na";
  const raw = (answers[id] ?? "").trim();
  if (checked && raw) return gradeAnswer(expectedOf(forms, id), raw) === "bad" ? "bad" : "ok";
  if (cursor === id) return "selected";
  return "plain";
}
