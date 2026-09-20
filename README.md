# BAR-Startbox-Compressor

Compress BAR (Beyond All Reason) startbox definitions into a single zlib + base64url string
for the `mapmetadata_startbox_override` setting. The tool runs fully in the browser: load a
minimap image, click to place 2×2 startbox squares per team, and it generates the
`!bset …` chat command to paste into the lobby.

## Usage (for humans)

1. Open `index.html` in a browser (no build step, no server required).
2. Optional: load a minimap image (`public/maps/` has samples) and click to place squares.
3. Edit the JSON directly, or click **Compress & Copy** to produce the string and copy it.

Structure:

```
config files        .prettierrc, .editorconfig, .vscode/, opencode.json, package.json
app                 index.html, script.js, style.css
assets              public/maps/*.png
```

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
