import { useState } from "react";
import type { FeedPerson } from "../api.ts";

const REPLY: Record<NonNullable<FeedPerson["response"]>, string> = {
  accepted: "yes",
  declined: "no",
  tentative: "maybe",
  pending: "no reply",
  delegated: "delegated",
};

/** How many names show before "Show all": a staff-wide meeting invites hundreds. */
const SHOWN = 8;

const label = (p: FeedPerson) => p.name || p.email;

/**
 * Who a calendar feed says organized an event and who it invited. Read-only:
 * these are the feed's to say, as its description is.
 *
 * Shown on a feed event's pane and on a Hermes event joined to one. A feed that
 * names nobody shows nothing at all — many don't, and an empty "Invited" would
 * read as "nobody was invited" rather than "the feed didn't say".
 */
export function FeedPeople({
  organizer,
  attendees,
}: {
  organizer: FeedPerson | null | undefined;
  attendees: FeedPerson[] | undefined;
}) {
  const [all, setAll] = useState(false);
  const people = attendees ?? [];
  if (!organizer && people.length === 0) return null;

  // Replies counted only when the feed gives them; a feed with none would
  // otherwise report everybody as "no reply", which it never said.
  const counts = new Map<string, number>();
  for (const p of people) if (p.response) counts.set(REPLY[p.response], (counts.get(REPLY[p.response]) ?? 0) + 1);
  const tally = ["yes", "maybe", "no", "no reply", "delegated"]
    .filter((k) => counts.get(k))
    .map((k) => `${counts.get(k)} ${k}`)
    .join(" · ");

  const isOrganizer = (p: FeedPerson) =>
    Boolean(organizer?.email && p.email && organizer.email.toLowerCase() === p.email.toLowerCase());
  const shown = all ? people : people.slice(0, SHOWN);

  return (
    <div className="feed-people">
      {organizer && (
        <div className="feed-people-organizer">
          <span className="feed-people-label">Organizer</span>
          <span title={organizer.email}>{label(organizer)}</span>
        </div>
      )}
      {people.length > 0 && (
        <>
          <div className="feed-people-label">
            Invited ({people.length}){tally && <span className="feed-people-tally"> — {tally}</span>}
          </div>
          <ul className="feed-people-list">
            {shown.map((p, i) => (
              <li key={p.email || i} className={p.response ? `reply-${p.response}` : undefined}>
                <span className="feed-people-name" title={p.email}>
                  {label(p)}
                </span>
                {isOrganizer(p) && <span className="feed-people-note">organizer</span>}
                {p.optional && <span className="feed-people-note">optional</span>}
                {p.response && <span className="feed-people-reply">{REPLY[p.response]}</span>}
              </li>
            ))}
          </ul>
          {people.length > SHOWN && (
            <button className="feed-people-more" onClick={() => setAll((v) => !v)}>
              {all ? "Show fewer" : `Show all ${people.length}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
