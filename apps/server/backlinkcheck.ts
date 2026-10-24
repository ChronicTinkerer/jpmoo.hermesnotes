/**
 * Old notes keep their links.
 *
 * `@` became the one trigger for linking anything, and what it writes is the
 * `[label](block:<id>)` link `|` always wrote. The notes already in a library
 * say it the older ways too — a `|<id>` in a title, and in a body — and every one
 * of them still has to come back as a backlink on the block it names.
 *
 * A backlink is a SQL prefilter (`LIKE %token%` on the body and on properties)
 * followed by a check in code. Both halves are exercised here: the tokens the
 * query searches for must occur in the stored text, and the text must then read
 * as naming the block.
 *
 * Run: pnpm --filter @hermes/server backlinkcheck
 */
import assert from "node:assert/strict";
import { blockIdTokens, inlineMentions, namesBlock } from "@hermes/shared";

const target = "0f8e2a3c-5b1d-4e6f-9a7b-1c2d3e4f5a6b";
const other = "11111111-2222-4333-8444-555555555555";

/** What the backlink query does: any token, in the body or the properties' JSON. */
const prefilter = (properties: Record<string, unknown>, content: string | null, id: string) =>
  blockIdTokens(id).some((tok) => (content ?? "").includes(tok) || JSON.stringify(properties).includes(tok));

const backlinks = (properties: Record<string, unknown>, content: string | null, id: string) =>
  prefilter(properties, content, id) && namesBlock(properties, content, id);

const cases: { name: string; properties: Record<string, unknown>; content: string | null; yes: boolean }[] = [
  { name: "old |id in a note body", properties: { title: "Standup" }, content: `Talked about |${target} today.`, yes: true },
  { name: "old |id in a title", properties: { title: `Follow up on |${target}` }, content: null, yes: true },
  { name: "old |[label](block:id) link", properties: { title: "Notes" }, content: `See |[Plan](block:${target}).`, yes: true },
  { name: "@-picked link", properties: { title: "Notes" }, content: `Ask [Sherly](block:${target}) about it.`, yes: true },
  { name: "a different block", properties: { title: "Notes" }, content: `See |${other} and [x](block:${other}).`, yes: false },
  { name: "plain words", properties: { title: "Notes" }, content: "nothing linked here", yes: false },
];

let failed = 0;
for (const c of cases) {
  const got = backlinks(c.properties, c.content, target);
  const ok = got === c.yes;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${c.name}: backlink ${got ? "yes" : "no"}`);
}

// A note naming its own block is not a link to it.
assert.deepEqual(inlineMentions({ title: `|${target}` }, null, target).ids, []);

if (failed) {
  console.error(`${failed} case(s) failed`);
  process.exit(1);
}
console.log("mentions: all cases pass");
