# BAR-Startbox-Compressor

Create polygon starting boxes for BAR (Beyond All Reason), the tool runs fully in the browser: load a minimap image, click to place 6×6 startbox squares per team (default; size is adjustable 1–100), and it generates the `!bset …` chat command to paste into the lobby. Sets a startbox definitions into a single zlib + base64url string for the `mapmetadata_startbox_override` setting.

Hosted on **GitHub Pages**: <https://acquati.github.io/BAR-Startbox-Compressor/>

## Usage

1. Open the [GitHub Pages link](https://acquati.github.io/BAR-Startbox-Compressor/) or `index.html` in a browser (no build step, no server required).
2. Load a minimap image (`public/maps/` has samples) and click to place starting positions (squares). Drag any placed square or imported chain to move it (any team, without switching).
3. Edit the JSON directly if needed.
4. Click **Compress & Copy** to produce the string and copy it.
5. Paste it in BAR text message in lobby.

## Minimum files to host

```
index.html            entry point (links style.css + script.js)
style.css             styles
script.js             app logic
public/maps/          minimap images (Krakatoa.png is loaded as the default map)
```

Everything else not required to run, is editor/tooling config — `package.json`, `.prettierrc`, `.editorconfig`, `.vscode/`, `opencode.json`, `.gitignore`, `.gitattributes`. Keep it in the repository for contributors, but it is not deployed and not required to run.

Notes when reusing this setup in other projects:

- `public/maps/Krakatoa.png` is only needed because `script.js` loads it on startup
  (`loadMapImage('public/maps/Krakatoa.png')`). Delete that line and the folder can go.
- The app is a zero-build static site: host it on any static file server or GitHub
  Pages by publishing the repository root of a branch — no server, API, or build step.
- Keep asset paths relative (as above) so the site works from a subpath like
  `https://user.github.io/repo/`.

## Development

Requires Node.js 22+. Run once after cloning:

```sh
npm install
```

Available scripts:

```sh
npm run format        # rewrite all files with Prettier
npm run format:check  # verify formatting (CI-friendly)
```

Formatting is enforced by **Prettier 3** via `.prettierrc`, backed up by `.editorconfig`.
EditorConfig keeps non-Prettier editors on the same 2-space, LF style.

### VS Code

Install the recommended extensions (auto-suggested via `.vscode/extensions.json`):
**EditorConfig for VS Code** and **Prettier – Code formatter**. Format on save is already
enabled in `.vscode/settings.json`.

### opencode

`opencode.json` sets `"formatter": true`, so opencode runs Prettier through its built-in
support whenever it edits a matching file. Restart opencode after changing config files.

## License

[MIT](LICENSE)

## Agent / LLM instructions

Apply these rules when editing this repository:

- **Formatting:** match the existing Prettier config (`.prettierrc`). After any edit run
  `npm run format` on the files you touched, or `npm run format:check` and fix warnings.
- **Style:** 2-space indentation, single-quoted strings in JavaScript, double-quoted
  attributes in HTML, semicolons, trailing commas, lines up to 100 columns.
- **Structure:** keep the app a zero-build static site. `index.html` links
  `style.css` and `script.js`; do not inline CSS or JS, and do not introduce a framework,
  bundler, or server dependency.
- **Comments:** do not add code comments unless the user asks for them.
- **Verification:** this is a hand-rolled vanilla JS app with no test suite. Verify changes
  manually in a browser and confirm formatting passes `npm run format:check`.
