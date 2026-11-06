import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { book, randomVerb } from "./data";
import { EditMine } from "./edit-mine";
import { searchVerbs } from "./model";
import { loadMine, randomOf } from "./mine";

export function PickVerb({
  onPick,
  initialQuery = "",
}: {
  onPick: (infinitive: string) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [mine, setMine] = useState<string[]>([]);
  const names = useMemo(() => (query.trim() ? searchVerbs(book, query) : book.common), [query]);

  useEffect(() => {
    void loadMine().then(setMine);
  }, []);

  function openRandomMine() {
    if (!mine.length) {
      showToast({ style: Toast.Style.Failure, title: "我的动词还是空的", message: "先编辑一份列表" });
      return;
    }
    onPick(randomOf(mine));
  }

  const extra = (
    <>
      <Action title="随机我的" icon={Icon.Shuffle} onAction={openRandomMine} />
      <Action title="随机常用" icon={Icon.Shuffle} onAction={() => onPick(randomVerb("common"))} />
      <Action title="随机全部" icon={Icon.Shuffle} onAction={() => onPick(randomVerb("all"))} />
      <Action.Push title="编辑我的动词" icon={Icon.Pencil} target={<EditMine onSaved={() => void loadMine().then(setMine)} />} />
    </>
  );

  return (
    <List
      filtering={false}
      throttle
      searchBarPlaceholder="动词原形，如 aller、être、souvenir"
      onSearchTextChange={setQuery}
    >
      {!query.trim() && mine.length > 0 && (
        <List.Section title={`我的 ${mine.length}`}>
          {mine.map((name) => (
            <List.Item
              key={`mine-${name}`}
              title={name}
              actions={
                <ActionPanel>
                  <Action title="打开" icon={Icon.Book} onAction={() => onPick(name)} />
                  {extra}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      <List.Section title={query.trim() ? "匹配" : `常用 ${book.common.length}`}>
        {names.map((name) => (
          <List.Item
            key={name}
            title={name}
            actions={
              <ActionPanel>
                <Action title="打开" icon={Icon.Book} onAction={() => onPick(name)} />
                {extra}
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {!names.length && <List.EmptyView title="词库里没有这个原形" />}
    </List>
  );
}
