# The desktop — moved

The plan that grew here — Talaria as the whole desktop on Hyprland — became its
own project on 2026-10-23: **Talaris** (`jpmoo/talaris`, private for now). It
does not depend on Talaria's daemon, treats Hermes as a plugin that speaks
`pkm-interchange`, and has Morgan built in.

Its design, including everything this file said and what changed, is
`DESIGN.md` there. The layer-shell spike that ran from here stays in
`spikes/`, because it imports this shell's `scheme.py`; Talaris has a copy.

Talaria itself is unchanged by any of this.
