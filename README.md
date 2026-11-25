# YouTube Auto Dark

Makes YouTube's own "Use device theme" setting live. When your system flips between light and dark, open
`www.youtube.com` tabs re-theme in place, with no reload. If you picked Dark or Light in YouTube's appearance menu, the
extension leaves the page alone. There is no popup and there are no settings.

It collects no data and talks to no server other than YouTube itself.

## How it works

YouTube only records a device-theme change for the next page load. This extension runs in the page's own context and
re-themes the open page the way YouTube would if it didn't reload: its theme attributes, the values its components
cached from them, its own theme action, live chat, palettes, and the text and panel content the server colored for the
old theme. The step-by-step reverse-engineering notes are in [CLAUDE.md](CLAUDE.md).

## Development

Requires Node.js and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev           # Chrome, with live reload of the extension and open YouTube tabs
pnpm dev:firefox   # Firefox
pnpm build         # production build in build/
pnpm zip           # store package and source archive
```

Before sending a change, `pnpm lint`, `pnpm compile`, `pnpm test` and `pnpm exec fallow dead-code --root .` must all
report no findings.

## License

Copyright (C) 2026 Avi

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [LICENSE](LICENSE) file for the full text.
