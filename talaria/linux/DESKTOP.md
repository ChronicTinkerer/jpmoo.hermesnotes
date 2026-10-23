# The desktop — Talaria as the place you work

**Status: design, not built.** Worked out in conversation on 2026-10-22 and
23. One spike has run (see *What the layer spike found*); nothing else below
exists yet except the pieces it names as already here.

**Hyprland, and nothing else on screen.** This plan assumes no desktop shell
underneath — no Noctalia, no waybar, no dock. Talaria draws everything you see
that is not an application window, and the few things it does not draw come
from small single-purpose tools named in *What Talaria borrows*. KDE keeps the
Talaria it has; see *Where it runs*.

**Morgan is part of it, not beside it.** The assistant
(`~/Documents/Scripts/heyclaude`; called Morgan here and from now on) is how
the desktop is talked to, and the desktop is what Morgan knows about. See
*Morgan*.

## The thesis

Today Talaria sits *beside* the desktop: a tray, panels you summon, a desk you
open. This is the step after that. **The canvas is the desktop**, every project
is a canvas, and everything — an app window, a block, a website — opens *from
where it lives* on a canvas, or flies in from nowhere if it lives on none. You
can ask for any of it by name, in the launcher or out loud.

It is a new shape, not a port and not a rewrite. It keeps everything Talaria
earned — the daemon as the only thing that knows Hermes exists, `canvas.json`
as the contract, the canvas fork, the compositor backend, "what the renderer
does not understand, it must not destroy" — and it reverses one decision on
purpose: `AMBIENT.md` #4, workspace binding, was skipped because "nobody here
works in workspaces." In this design workspaces are how projects run, so it is
back, and for a reason the original note did not have.

**From scratch, deliberately.** Noctalia was the first answer to "what is on
the screen," and it is a good one — but every surface it owns is one this
design wants to mean something else: the dock should be cards, the wallpaper
should be the canvas, the launcher should find projects and blocks as readily
as apps, the bar should show projects rather than workspace numbers, and
Morgan's face should not be a plugin in somebody else's shell. Building on top
of it meant a plugin API's limits at every one of those (a launcher result has
one action; a plugin cannot host a web view). So the plan does not lean on it.
It can keep running while the pieces are built; nothing below depends on it.

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
surface with a private copy of what "open" means. **Morgan is a caller like any
other** — "open the Ogham editor" is `open <card>`, reached through the
daemon's MCP, not a second implementation of opening.

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

## What is on the screen

Everything here except the canvas was Noctalia's job; all of it is Talaria's
now. **Every one of these is a layer surface in one process** — the spike
showed a Qt process under `QT_WAYLAND_SHELL_INTEGRATION=layer-shell` makes
every window a layer surface, and that is exactly what screen furniture wants.
None of it is a window rule, so none of it is dropped when Hyprland reloads its
config — the bug the current panels carry.

### The canvas

The canvas fork, one surface, two layers:

- **`bottom`** normally — below every window. An empty workspace *is* the
  canvas. **There is no wallpaper**: the canvas draws its own backdrop, so
  nothing else lives on that layer to be covered.
- **`overlay`** on a key, to see the canvas over a project's tiled windows, and
  the same key drops it back. The way back is never optional: the key is a
  compositor bind, Escape drops it, and it drops by itself after a stretch with
  no input. See the spike for why.
- Keyboard focus **on demand**, so it takes keys when clicked into and never
  steals them from a tiled app.

### The bar

A layer surface along the top with an exclusive zone, so tiled windows and the
canvas both keep clear of it (the spike's canvas already did, for Noctalia's).
What it shows:

- **Projects**, not workspace numbers: the current one's title, a switcher,
  live windows per project.
- **Morgan**: listening, thinking, speaking, idle — and one click to talk or
  open the conversation. It is the one place on screen that is always Morgan.
- **The machine**: clock, battery, volume, network, Bluetooth. Read from
  `wpctl`, `nmcli`, `bluetoothctl` and `/sys` — all already here — not drawn
  from a settings framework. Clicking one opens a small panel; the panel's
  deeper settings hand off to existing tools (`nmtui`, `bluetoothctl`) rather
  than being rebuilt, because a settings UI is a job with no end.

**No tray.** A StatusNotifierItem host plus DBusMenu is the most fiddly thing a
shell does, and Qt offers no host for either. Talaria's own tray item goes away
— the bar *is* Talaria. Which other applications here actually need a tray is
the question to answer before building one; if the answer is "BlueBubbles,"
the answer may be no tray at all.

### The launcher

An overlay surface with exclusive keyboard while it is up, summoned by a
compositor bind. One box, everything:

- **Projects** (ranked high), **cards** ("Ogham › VS Code on `~/ogham`"),
  **blocks** from the local mirror, **files** in the current project's folder,
  **live windows**, the **`new`** verbs — and **applications**, read from the
  XDG `.desktop` files, which Noctalia did before and nobody does now.
- **Morgan, as the fallthrough.** Text that matches nothing is a question, and
  Enter on it asks Morgan. The launcher is where you type to the desktop; the
  bar's mic is where you speak to it. Same assistant either way.
- Owning it removes the limits a plugin had: a **modifier** takes the second
  action ("place it here" rather than "go there"), and a result can be
  **dragged** onto a canvas.

Current project and recency raise the rank. `krunner.py` already decided two
things worth keeping: an unprefixed query matches **titles only**, and **forty
are fetched to keep ten**. An application launch lands on the active
workspace — the current project — and the daemon sees the window appear and
offers to make it a card.

### The drawer

The current project's folder as a tree, on the canvas's side. Dragging a file
onto the canvas has to work, and inside one process that is the process talking
to itself. A dropped file is a card that opens it. Dropped onto a *note*, it can
be a path; it cannot be the file's contents, which is the attachment entry
still open in `pkm-interchange/LIMITS.md`.

### Notifications

Talaria is the notification daemon — `org.freedesktop.Notifications` on the
session bus — with popups as layer surfaces. Owned rather than borrowed for two
reasons this design has and a generic notifier does not: **a notification can
be placed** on a canvas like any floating thing (it becomes a card, or a task,
with one key), and **Morgan can say it** — a reminder Morgan set arrives as
Morgan, spoken or shown, not as a toast from nowhere. Pruning's "closed three
windows in Ogham" notices come through here too.

The spec is not small — actions, replacement by id, urgency, images, expiry —
so until it is done, `mako` holds the bus. Nothing else has to change when
Talaria takes it over; the bus name is the whole interface.

### The small ones

- **The on-screen display** for volume and brightness keys — the keys stay
  compositor binds calling `wpctl` and `brightnessctl`, and the bind also tells
  the surface to show the level.
- **The power menu** — lock, log out, suspend, restart, shut down.
- **The theme.** Talaria owns the palette: one file of colors every surface
  reads, which is what `panel.css`'s four variables were waiting for. It used to
  be Noctalia's template output. Writing the same palette out for Ghostty and
  GTK is a later nicety.

### What Talaria borrows

Single-purpose tools, each one a thing that is hard to get right and is not
what this design is about:

| | |
|---|---|
| Lock screen | **`hyprlock`**, installed. Never build a lock screen — a crash in one must keep the session locked, and that is the whole job. |
| Idle | **`hypridle`**, installed and already in `hyprland.conf`. It calls the lock. |
| Polkit agent | **`hyprpolkitagent`**, not installed. **Install it before removing Noctalia**, or system password prompts quietly stop appearing. |
| Notifications, for now | **`mako`**, not installed, until Talaria's own holds the bus. |
| Network and Bluetooth settings | `nmtui`, `bluetoothctl`, opened from the bar's panels. |

## Morgan

Morgan is a voice-and-chat assistant: wake word, speech in and out, a local
model for the talking, Claude ("the Oracle") when that is not enough, memory,
reminders, MCP tools. Its daemon is `heyclaude.service`, it answers on
`$XDG_RUNTIME_DIR/heyclaude.sock`, and today its face is a Noctalia plugin
(voice popup, chat, settings, bar icon) plus `window/window.py`, a PySide6 web
view around `index.html` — Talaria's own pattern already.

### Baked in, and what that means

**Morgan's face is Talaria's.** The bar's Morgan, the voice popup, the
conversation and Morgan's settings are Talaria surfaces. The plugin goes with
Noctalia. `window/index.html` comes across nearly as it is — it is already a
page talking to the daemon through its host — and is the conversation surface,
able to be a floating panel *or* an ordinary window you tile and keep open
beside work, which is why `window.py` exists in the first place. Settings joins
Talaria's settings rather than being a second settings app.

**Morgan's brain stays its own process.** It talks to Talaria over its socket,
the event stream it already has (`watch`) and the commands it already takes
(`toggle`, `ask`, `say`, `stop`…). Two reasons, and the second decides it:
Morgan crashing should not take the desktop with it, and
`docs/server-and-satellites.md` moves the brain to the home server so one
Morgan serves the laptop, the kitchen and wherever else. In that plan this
laptop is a satellite — microphone, speaker, wake word — and **Talaria is the
satellite's face.** Baking Morgan in means the face, the knowledge of the
desktop and the ability to act on it; it does not mean Morgan lives in
Talaria's process or repository.

**The desktop is what Morgan knows.** Talaria's daemon serves an MCP —
projects, canvases, cards, the drawer, the verbs, and *what is current* — and
Morgan connects to it as one of its servers:

- *What am I looking at?* is answered from the daemon: Ogham, its canvas, block
  `b_123` selected, VS Code focused. **No screenshot.** Morgan's sight today is
  `grim` — a photograph of the screen — and that is the problem its own test
  notes record. Structured context is the better answer and the private one;
  sight stays for when it is asked for in so many words.
- *Open my editor*, *put this on the Ogham canvas*, *close what I'm not using*
  are verbs — the same `open`, `place` and `close` a click calls.
- What is current is **state, not a record**: no history of windows is kept,
  which is the line the Linux context record was removed for and still holds.

**Hermes, through Hermes.** Morgan keeps reaching the library through Hermes'
own MCP — it runs on machines with no Talaria daemon, and that MCP is the
richer surface. What joins the two is **the block id**: the desktop says which
block, Hermes says what it is, and a change Morgan writes there reaches a canvas
when the mirror syncs. `AMBIENT.md`'s "only the daemon knows Hermes exists" was
about the desktop's sensors and surfaces; Morgan is a peer client of Hermes, not
one of those.

### Open questions this raises

- **Canvas Chat and Morgan are two chats.** `canvasagent.ts` is Talaria's own
  chat, deliberately able to do nothing but build and edit a canvas. With Morgan
  central, two conversational surfaces on one desktop is one too many. The
  likely answer: canvas editing becomes **tools** on the daemon's MCP, Morgan
  calls them, and Canvas Chat's panel retires — but Canvas Chat is a feature the
  owner asked for specifically, so this is the owner's call, not a refactor to
  slip in.
- **Glance and Morgan overlap.** Glance reads the focused window and finds
  related blocks; Morgan answers "what am I looking at." They may want to be one
  gesture with two halves — the reading and the conversation about it.
- **The repository is still `heyclaude`**, its command `heyclaude`, its unit
  `heyclaude.service`. Renaming them to Morgan is its own change in its own
  repository.

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
this machine. **Morgan does not get them** as a way of seeing — they are the
card's face, not a camera.

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

1. **`close <project>`**, asked for — by click, launcher or Morgan. Snapshot,
   close, remove the workspace. Floating windows in it get one prompt: place,
   send to Recent, or close.
2. **Projects left alone** for a while — configurable, a few hours — have their
   safe windows closed quietly. Last visit comes from Hyprland's focus events.
3. **Memory pressure**, read from `/proc/pressure/memory` rather than free
   memory: close the least recently used safe windows until it eases, never in
   the current project, never anything focused in the last few minutes.

SIGSTOP is not an answer — it frees the CPU and keeps every byte. Firefox's own
unload-tabs-on-low-memory setting is a useful second layer inside each window.

**Always visible:** cards show live or asleep, a notification says what was
closed and that it is on the canvas, and the bar counts live windows per
project.

## Where it runs

| | |
|---|---|
| **Talaria daemon** | `packages/daemon`, extended. Projects, canvases, cards, the verbs, the launcher query, the MCP. **Shared with the Mac**, so everything new is additive routes, and `canvas.json` stays where it is — it becomes Home — so the Mac app sees no change. Per-project canvases are new files beside it; `canvas.ts` and `canvasagent.ts` assume one path today and are the first thing that changes. |
| **Surfaces** | **New.** One PySide6 process under `layer-shell`: canvas, bar, launcher, drawer, notification popups, OSD, power menu, Morgan's voice popup. The canvas fork and the pages are WebEngine views through the shell's own `scheme.py`. |
| **Shell** | `linux/shell`, as now, for what are ordinary windows: settings, board, New Block, Glance, the Hermes window — and Morgan's conversation when it is kept open as a window. Hyprland work goes through `wm/hypr.py`; KDE's backend answers "no desktop" and nothing else changes there — the one-shell rule stands. |
| **Morgan** | `heyclaude.service`, unchanged in kind — locally now, as a satellite of the home server later. |
| **Borrowed** | `hypridle` → `hyprlock`, `hyprpolkitagent`, and `mako` until Talaria holds the notification bus. |
| **Hyprland config** | `talaria.conf`, written by `install.sh`: the binds (launcher, overlay, volume, brightness, Morgan's talk key), workspace rules, and the `exec-once` lines. `hyprland.conf` stays the user's. |

**The surfaces process is the desktop, so it is a service.** A crashed panel is
a panel that does not open; a crashed surfaces process is no bar, no launcher
and a blank screen. So it runs as a systemd user service that restarts, not a
scope. If one surface proves crash-prone, *that* is the reason to split it into
a process of its own — not before.

**One process for the furniture was the spike's lesson, not just a preference:**
layer-shell is chosen per process, so the surfaces live together and the
ordinary windows live in the shell.

### Starting it

| | started by |
|---|---|
| Talaria daemon | `talaria.service`, as now |
| Morgan | `heyclaude.service`, as now |
| Surfaces | **new:** `talaria-surfaces.service`, started from `talaria.conf` once the compositor is up |
| Shell | `exec-once` in `talaria.conf` through `systemd-run --scope`, as now |
| `hypridle`, `hyprpolkitagent`, `mako` | `exec-once`, in `talaria.conf` |

Taking Noctalia out is then deleting one line from `hyprland.conf` — the
`exec-once` that starts it — and is the user's to delete.

## Spikes before committing

Each is an afternoon, and each can change the design:

- ~~**A layer surface from PySide6.**~~ **Run** — see *What the layer spike
  found* below.
- **Several layer surfaces in one process**: the canvas on `bottom` and the bar
  on `top` with an exclusive zone, and the launcher on `overlay` with exclusive
  keyboard, all at once.
- **Morgan's page in the surfaces process**: `window/index.html` on a layer
  surface, talking to `heyclaude.sock` through the host — and a voice turn,
  start to finish, driven from the bar.
- **Next-new-window binding** against real Firefox and VS Code, with two
  launches close together.
- **Resume for the web** — the session file first, since it needs no decision
  from anybody.
- **Per-project canvases in the daemon** — what `canvasagent.ts` needs to be
  told which canvas it is drawing on.

### What the layer spike found

`spikes/layer_canvas.py`, run with `spikes/run.sh` on Hyprland 0.53.3, Qt 6.10.2
and LayerShellQt 6.6.4 (Ubuntu's `layer-shell-qt`, unpacked rather than
installed — **the real thing will need it as a dependency**). The canvas fork,
loaded through the shell's own `scheme.py`, on a full-screen `bottom` surface
named `talaria-canvas`, clear of the bar's exclusive zone. **The Qt route
holds; nothing has to be ported to WebKit.**

- **The canvas is its own process, and has to be.** Attaching one `QWidget`
  window of an ordinary process falls back, silently, to an xdg toplevel — one
  tiled onto a workspace during the spike. With
  `QT_WAYLAND_SHELL_INTEGRATION=layer-shell` the whole process is layer
  surfaces, which the design wanted anyway.
- **The order is: show, then `Window::get()`, then set, then hide and show.**
  A `get()` before the first show builds an orphaned `Window` the surface never
  reads. Through ctypes for that one call; everything else is Qt properties.
- **A layer change needs a new surface.** `set_layer` on the live one did
  nothing; a hide and show moves it, and the page keeps its state — one load
  across every swap. It costs one frame at 640×480 before the real size
  arrives, which the real thing will have to hide.
- **Clicks and typing work.** A click gives it the keyboard (on-demand), notes
  were made and typed into, and Escape reached the page. Taking the overlay
  takes the keyboard at once; leaving it gives it back. The Super key of a
  compositor bind arrives as a stray `Meta` keydown — harmless, worth ignoring.
- **Scrolling works, on both layers.** Two-finger pan and pinch arrive as
  wheel events: 476 reached the page on `bottom` in one short session, and the
  overlay took them as readily. The first run's zero was not the layer — most
  likely the scrolling happened over a window. Settled in three steps worth
  keeping: a synthetic `QWheelEvent` to the view's focus proxy proved the page
  listens; filters on the window and the focus proxy showed real events
  arriving from Hyprland; then a run on `bottom` alone. **Do not install a
  Python event filter on the whole application** to find out — PySide was
  asked to wrap a `QWebEngineUrlRequestJob` mid-construction and segfaulted.
  Filter the objects you hold.
- **The first run had no way back, and ended in a restart.** The overlay
  covered the terminal the only escape was typed in. So: a compositor bind
  swaps (Super+Alt+C — it fires whatever covers the screen), Escape in the
  page drops it, it drops by itself after twenty seconds, and SIGUSR2 forces
  it down. **The real canvas ships with the bind and the timeout, not without
  them.** And the timeout is **idle**, not a deadline: the first version
  fired twenty seconds after the swap, in the middle of a scroll deep in a
  zoom, and took the canvas out from under the hand using it.
- **Signal it by pid.** `pkill -f layer_canvas.py` also matches the shell that
  runs it — it killed the agent's own shell, and a bind's `sh -c` would be next.
- **It is the real Home canvas.** The spike reads and writes
  `~/.local/share/talaria/canvas.json`, so notes made while testing are there.
- **Scale looks like every other Qt window here**: the page reports 1.5625,
  because the session sets `QT_SCALE_FACTOR=1.25` over a 1.25 monitor.
- **Whatever shares `bottom` is covered.** Noctalia's desktop widgets did, and
  the canvas, mapped after them, hid the clock and battery. In this plan nothing
  else is on that layer — the bar is on `top` — so it stops mattering; it is
  recorded because anything put on `bottom` later meets it.

## Order

Two milestones. The first is a desktop with nothing but Talaria on it; the
second is the design. Nothing needs the step after it to be worth having.

**Milestone one — Talaria is the whole screen.** Noctalia can run through all
of it and comes out at the end.

1. Install the borrowed pieces: `layer-shell-qt`, `hyprpolkitagent`, `mako`.
   Check `hyprlock` is what `hypridle` calls.
2. The surfaces process as a service, with the canvas on `bottom` — Home is
   today's `canvas.json` — the overlay key, and its way back.
3. The bar: Morgan's state, clock, battery, volume, network, Bluetooth, the
   power menu, and the OSD.
4. The launcher: applications, blocks, the `new` verbs, and Morgan as the
   fallthrough.
5. Morgan's face: the voice popup and the conversation, from `index.html`;
   Morgan's settings in Talaria's.
6. The palette, Talaria's own.
7. Remove Noctalia's `exec-once`.

**Milestone two — the desktop as projects.**

8. Per-project canvases in the daemon.
9. Projects as workspaces: `go`, and projects in the bar and the launcher.
10. The daemon's MCP — context and the verbs — and Morgan connected to it.
11. Bookmark cards with the three adapters; snapshots; opening out of the card.
12. Floating, *place*, Recent.
13. Pruning, in the order above.
14. Talaria's own notifications, replacing `mako`.
15. The drawer.
16. Resume, once the spike says how.
