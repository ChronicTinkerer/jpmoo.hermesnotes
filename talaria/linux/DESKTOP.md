# The desktop — Talaria as the place you work

**Status: design, not built.** Worked out in conversation on 2026-10-22. Nothing
below exists yet except the pieces it names as already here.

Hyprland with Noctalia only. KDE keeps the Talaria it has; see *Where it runs*.

## The thesis

Today Talaria sits *beside* the desktop: a tray, panels you summon, a desk you
open. This is the step after that. **The canvas is the desktop**, every project
is a canvas, and everything — an app window, a block, a website — opens *from
where it lives* on a canvas, or flies in from nowhere if it lives on none.

It is a new shape, not a port and not a rewrite. It keeps everything Talaria
earned — the daemon as the only thing that knows Hermes exists, `canvas.json`
as the contract, the canvas fork, the compositor backend, "what the renderer
does not understand, it must not destroy" — and it reverses one decision on
purpose: `AMBIENT.md` #4, workspace binding, was skipped because "nobody here
works in workspaces." In this design workspaces are how projects run, so it is
back, and for a reason the original note did not have.

## The model

| | |
|---|---|
| **Project** | A canvas. That is the whole requirement. A workspace, a folder and a set of app cards are facets it grows when used. **A project need not be a Hermes project**; it may be bound to one, and then it carries that block's id. |
| **Home** | The project that is always there: a scratchpad and the front door. It holds loose notes, a card for each project, and the **Recent** strip (see *Floating*). |
| **Canvas** | A local `canvas.json` document, held by the daemon — **not** a Hermes canvas collection. Its items either reference a block by `blockId` or are local notes, exactly as now. |
| **Card** | A placed thing on a canvas: a block, an app on a target, a website. Asleep, it is a snapshot and an intent. Open, it is bound to a live window or editor. |
| **Floating** | A thing that is open and placed nowhere — the browser you are riffing in, a block you just looked up. *Place* turns it into a card. |
| **Workspace** | A project's desktop: `name:<project id>` in Hyprland, created the first time something in the project opens. The bar shows the project's title, never the id. |

**A canvas is not a Hermes collection, and that is deliberate.** Window cards,
launch targets, folders and snapshots are furniture of this machine, and the
format already says furniture is not knowledge. None of it goes through
interchange, so none of it needs a prefix, a LIMITS entry or a manifest claim.
What *is* knowledge — a block — is referenced by id, so one block on three
project canvases is still one block. The tool strip has to keep the difference
visible: "note on this canvas" and "block in the library" are different things.

**A line drawn between two blocks stays on the canvas** unless you say
otherwise. There is an explicit *make it a relation* action, so drawing never
quietly writes to the library.

### Two kinds of card, chosen when the card is made

- **Bookmark** — always opens to the target it was made with. The snapshot is
  what was saved, so the card looks like what it points to.
- **Resume** — opens where you left it. Target and snapshot update on every
  close, so the card looks like where you stopped.

Placing a floating thing defaults to *resume* (you are mid-something); making a
card fresh from the tool strip defaults to *bookmark*. One toggle on the
placement prompt, changeable later. **Store the original target beside the
current one from the start**, or "reset to original" has nothing to reset to.
The two must look different on the canvas, or the opening animation will
surprise you.

What *resume* can mean is set by the app, and the card says so honestly: a web
page resumes its URL; an editor its folder; a terminal only its directory — a
resumed terminal reads "in `~/ogham`", not "where you left off."

**Bookmark cards are built first. Resume is a spike** — see *Apps*.

### Floating things are not lost

The floating thing is the most valuable thing on screen and the easiest to
lose. Closed without being placed, it does not vanish: it lands on Home's
**Recent** strip, to be placed or thrown away. Home is where triage happens.

## Verbs

Every surface — a click on a card, a launcher result, a hotkey, Morgan — calls
the same small set, defined once, in the daemon:

| | |
|---|---|
| `go <project>` | switch to its workspace; it becomes current for the canvas, drawer and launcher |
| `open <card>` | focus its window if one is bound; otherwise launch its target and bind what appears |
| `open <block>` | see *Opening* |
| `launch <app> [target]` | start an app in the current project, in the project's folder |
| `place <thing> [canvas]` | floating → card, on the current canvas or a named one |
| `close <project>` | snapshot and close its placed windows; ask about its floating ones |
| `new …` | project, note on Home, card from the focused window |

This is the same discipline as the format: one vocabulary, many callers, and no
surface with a private copy of what "open" means.

## Opening

**Everything opens.** What differs is where from.

- **On the current canvas:** it opens *out of its card*, and the animation and
  presentation make that plain — you can see which card you just opened.
- **On another canvas:** `go` there, then open out of the card.
- **On no canvas:** it flies in floating, with *place on a canvas* offered on
  it.

For blocks this is easy — the editor is our own page and can grow from the
card's exact rectangle. For app windows Hyprland owns the animation and takes no
origin per window, so the canvas fakes it: the snapshot zooms toward where the
window will land, the real window maps underneath, and a crossfade hands over.
A floating launch can name its rectangle (`exec [float; move …; size …]`); a
tiled one learns its tile only once mapped, so the first version zooms to the
center.

## Surfaces

### The canvas

The canvas fork, one surface, two layers:

- **`bottom`** normally — above Noctalia's wallpaper (which is on `background`),
  below every window. An empty workspace *is* the canvas.
- **`overlay`** on a key, to see the canvas over a project's tiled windows, and
  the same key drops it back. One program, so nothing about it is a window rule
  that a config reload can drop — which is the whole class of bug the panels
  have now.
- Keyboard focus **on demand**, so it takes keys when clicked into and never
  steals them from a tiled app.

Noctalia's own desktop widgets also live on the desktop and will either be
covered or have to move. Find out which layer they use before deciding.

### The launcher

A Noctalia `[[launcher_provider]]` with `include_in_global_search = true`, so
its results sit in the ordinary search beside apps rather than behind a prefix,
and `setQuery` for a second step. The plugin holds no state; it relays one
ranked query to the daemon, which a launcher of our own would later call
unchanged.

What it finds: projects (ranked high), cards ("Ogham › VS Code on `~/ogham`"),
blocks from the local mirror (a few in the global list, all of them behind a
prefix), files in the current project's folder, live windows, and the `new`
verbs. Current project and recency raise the rank.

**It does not search apps.** Noctalia already does, and a plain app launch
lands on the active workspace — the current project — anyway. The daemon sees
the window appear and offers to make it a card. The provider adds only what
Noctalia cannot know: targets bound to a project.

`krunner.py` already decided two things worth keeping: an unprefixed query
matches **titles only**, and **forty are fetched to keep ten**.

One limit to live with: a Noctalia result has a single activation, so "place it
here instead of going there" is a second step, not a modifier key.

### The drawer

The current project's folder as a tree, inside the canvas surface — not a
Noctalia panel, because dragging a file onto the canvas has to work and that is
one process talking to itself. A dropped file is a card that opens it. Dropped
onto a *note*, it can be a path; it cannot be the file's contents, which is
the attachment entry still open in `pkm-interchange/LIMITS.md`.

### The bar

A thin Noctalia widget: the current project's title, a switcher, and the number
of live windows per project. Noctalia keeps the tray, notifications, lock
screen, wallpaper and Morgan's plugin, unchanged.

## Apps

**The real cost is knowing which window belongs to which card.** Hyprland ties a
launch to a window by pid, and that fails for anything single-instance — a
browser, VS Code, often a terminal — because the launch hands off to the running
process and exits. So each kind of app gets an **adapter**: how to open *this
target* in a *new window*, how to recognize that window, whether it can be
closed silently, and what *resume* means for it.

- **Terminal** — Ghostty as a fresh instance with its own class. Easy.
- **Editor** — `code --new-window <folder>`, matched by folder in the title.
- **Web** — the real browser, not one of ours. `firefox --new-window <url>`
  opens a real window with your extensions and logins. To bind it, the daemon
  notes which browser windows exist, launches, and claims the **next new one**
  to map; from then on it follows the Hyprland address, which is fixed for the
  window's life. Two browser windows opened in the same second could cross;
  that is rare enough to accept.

Everything else opens floating and unbound until it earns an adapter.

**Resume for the web is the open spike.** Bookmarks need nothing more than the
above; resume needs the URL you ended on, and a browser tells the compositor
only its title. Three candidates:

1. **A small extension** reporting each window's tabs to the daemon. Cleanest,
   and the only one that brings back *all* the tabs — but it reverses the
   decision recorded under *Still open* not to build Glance's rung 5. The
   owner's call.
2. **Firefox's session file** (`sessionstore-backups/recovery.jsonlz4`), which
   lists every window's tabs and is rewritten every fifteen seconds or so,
   matched to Hyprland's windows by the active tab's title. No extension; hacky;
   can be a little stale at the moment of closing.
3. **A WebEngine window of our own.** Full control, but a plainer browser with
   its own cookie store. Held back as a "quick web card" if the others are
   awkward.

### Snapshots

A card's snapshot is a capture of *its own* window's rectangle while visible —
on leaving the workspace, on close, and on a slow timer. Ubuntu's grim has no
per-window capture, so this is a region of the screen, and it is the screen.

**This is where the ambient panel went wrong, so it is bounded on purpose.** The
panel was removed because following the focus meant photographing every window
passed through. Snapshots are only ever of windows that are cards, never of a
window because focus crossed it, they honor `blindlist.py`, and they stay on
this machine.

## Pruning

Several browser windows across several projects will eat memory fast. **Cards
are what make closing safe** — a window can be closed only if its card brings
it back — so safety is decided per thing, not per policy:

| | closed automatically? |
|---|---|
| bookmark card | **yes** — reopens exactly as it was |
| resume card | **not yet** — only once resume works for that adapter |
| floating, unplaced | **never** |
| anything with unsaved state | **never** — a polite close to an editor on a hidden workspace is a "Save changes?" dialog nobody can see. The adapter declares it: a web bookmark can; a terminal only when its shell has no children. |

When, gentlest first:

1. **`close <project>`**, asked for. Snapshot, close, remove the workspace.
   Floating windows in it get one prompt: place, send to Recent, or close.
2. **Projects left alone** for a while — configurable, a few hours — have their
   safe windows closed quietly. Last visit comes from Hyprland's focus events.
3. **Memory pressure**, read from `/proc/pressure/memory` rather than free
   memory: close the least recently used safe windows until it eases, never in
   the current project, never anything focused in the last few minutes.

SIGSTOP is not an answer — it frees the CPU and keeps every byte. Firefox's own
unload-tabs-on-low-memory setting is a useful second layer inside each window.

**Always visible:** cards show live or asleep, a quiet notification through
Noctalia says what was closed and that it is on the canvas, and the bar counts
live windows per project.

## Morgan

Morgan (`~/Documents/Scripts/heyclaude`) keeps reaching Hermes through Hermes'
own MCP. Two reasons: it does not always run on this laptop — the home-server
role has no desktop to ask — and Hermes' MCP is the richer surface, with the
`interchange_*` tools there if it ever needs the format. `AMBIENT.md`'s "only
the daemon knows Hermes exists" was about the desktop's *sensors and surfaces*;
Morgan is a peer client of Hermes, not one of those.

What brings them together is **the block id**, not a shared door:

- The daemon serves an MCP of its own — projects, canvases, cards, the drawer,
  the verbs, and what is current — and Morgan adds it as a second server.
- *What am I looking at?* comes from the daemon: Ogham, its canvas, block
  `b_123` selected. **No screenshot.** That is sight Morgan no longer has to
  take, which is the problem noted in its tests.
- *Tell me about it* or *mark it done* goes to Hermes with that same id.
- *Put this on the Ogham canvas* goes to the daemon.

What is current is **state, not a record**: no history of windows is kept,
which is the line the Linux context record was removed for and still holds.

A change Morgan writes to Hermes reaches a canvas when the mirror syncs —
seconds, not a correctness problem.

## Where it runs

| | |
|---|---|
| **Daemon** | `packages/daemon`, extended. Projects, canvases, cards, the verbs, the launcher query, the MCP. **Shared with the Mac**, so everything new is additive routes, and `canvas.json` stays where it is — it becomes Home — so the Mac app sees no change. Per-project canvases are new files beside it; `canvas.ts` and `canvasagent.ts` assume one path today and are the first thing that changes. |
| **Canvas surface** | The canvas fork in WebEngine, drawn as a layer surface, with the drawer inside it. |
| **Shell** | `linux/shell`, as now: panels, Glance, settings, hotkeys. Hyprland work goes through `wm/hypr.py`; KDE's backend answers "no desktop" and nothing else changes there — the one-shell rule stands. |
| **Noctalia plugin** | Bar widget and launcher provider, calling the CLI. Everything Noctalia-specific is here, so replacing Noctalia's bar someday is a rewrite of this and nothing else. |
| **Hyprland config** | Binds and workspace rules that call the same CLI, written by `install.sh` as the binds are now. |

### Starting it

Nothing new in kind — one more process, started the way the shell already is:

| | started by |
|---|---|
| Noctalia | your own `exec-once` in `hyprland.conf`, as now |
| Talaria daemon | `talaria.service`, the systemd user unit, as now |
| Talaria shell | `exec-once` in `~/.config/hypr/talaria.conf` through `systemd-run --scope`, as now |
| **Canvas surface** | **new:** a second line in `talaria.conf`, written by `install.sh` beside the shell's |
| Noctalia plugin | Noctalia itself, from `~/.local/share/noctalia/plugins/`, like workspace-peek |

No ordering is needed between them. Noctalia's wallpaper and the canvas sit on
different layers and neither waits for the other; the canvas and the plugin ask
the daemon, which systemd started before the session.

**One thing worth doing differently for the canvas:** a crashed panel is a
panel that does not open, but a crashed canvas is a blank desktop. So it may
want to be a user *service* that restarts, rather than a scope that does not —
decide once it exists and has been seen to fail. `hyprland.conf` stays the
user's; `install.sh` only writes `talaria.conf`, which the existing `source =`
line already loads.

## Spikes before committing

Each is an afternoon, and each can change the design:

- **A layer surface from PySide6.** LayerShellQt has a C++ API and no Python
  bindings that ship. Candidates: run the canvas as its own process with
  LayerShellQt as its Wayland shell integration (which would make *every*
  window of that process a layer surface — fine for a process that is only the
  canvas); or WebKitGTK with gtk4-layer-shell. Confirm WebEngine renders and
  takes input on a `bottom` surface under Hyprland 0.53.
- **Noctalia's desktop widgets** — which layer, and whether they collide.
- **Next-new-window binding** against real Firefox and VS Code, with two
  launches close together.
- **Resume for the web** — the session file first, since it needs no decision
  from anybody.
- **Per-project canvases in the daemon** — what `canvasagent.ts` needs to be
  told which canvas it is drawing on.

## Order

Nothing needs the step after it to be worth having.

1. Per-project canvases in the daemon; Home is today's `canvas.json`.
2. The canvas as a `bottom` layer surface, with the overlay key.
3. Projects as workspaces: `go`, the bar widget.
4. The launcher provider: projects, blocks, cards, `new`.
5. Bookmark cards with the three adapters; snapshots; opening out of the card.
6. Floating, *place*, Recent.
7. Pruning, in the order above.
8. The daemon's MCP, and Morgan's second server.
9. The drawer.
10. Resume, once the spike says how.
