# The Build Journey

This document explains the technical implementation of the Lost Pulse release architecture, detailing how the application is built, packaged, and how Portable mode operates. Future developers should refer to this document before upgrading dependencies or altering the build pipeline.

## 1. Why `electron-builder`?

To align with the **Release Architecture** guidelines—specifically creating an Installer (`Lost Pulse Setup.exe`) and a Portable executable (`Lost Pulse.exe`) from the same codebase—we implemented `electron-builder`.

`electron-builder` provides a highly configurable pipeline that reads from our Vite frontend build (`dist/`) and Electron backend (`electron/`) to produce standardized output targets.

## 2. Configuration (`package.json`)

The `package.json` contains a specific `"build"` object:

```json
"build": {
  "appId": "com.lostpulse.app",
  "productName": "Lost Pulse",
  "directories": {
    "output": "dist-electron"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "icon": "public/assets/icon.ico",
    "target": ["nsis", "portable"]
  }
}
```

- **NSIS Target**: Generates the standard Windows installer.
- **Portable Target**: Generates a self-contained `.exe` that does not require installation.
- **Icon**: Tied directly to the `public/assets/icon.ico`.

### How to Build
Simply run:
```bash
npm run electron:build
```
This script first runs `npm run build` (compiling the React/Vite front-end via TypeScript) and then hands off the packaging to `electron-builder`.

## 3. The Portable Mode Intercept

The architecture strictly mandates that the Portable version must store data *beside* the executable and never leak into `%APPDATA%`.

To achieve this cleanly, we added a very early intercept in `electron/main.cjs`, immediately after importing modules but *before* `app.whenReady()` triggers:

```javascript
// --- PORTABLE MODE CHECK ---
const exeDir = path.dirname(app.getPath('exe'));
const portableFlagPath = path.join(exeDir, 'portable.flag');
const isPortable = app.isPackaged && fs.existsSync(portableFlagPath);

if (isPortable) {
  app.setPath('userData', path.join(exeDir, 'Data'));
}
// ---------------------------
```

### How it Works:
1. `app.getPath('exe')` finds the exact path of the running executable.
2. We check if a file named `portable.flag` exists in that exact same folder.
3. If true (and the app is actually packaged), we call `app.setPath('userData', ...)` and forcefully route all `app.getPath('userData')` requests to a local `Data` folder.
4. Because the IPC handlers (e.g., `getDataPath`) rely on `app.getPath('userData')`, the rest of the application seamlessly inherits this path without any frontend awareness.

## 4. Upgrading in the Future

If we upgrade Vite, React, or Electron, ensure the following remain intact:
1. **The Build Scripts**: Ensure Vite still outputs to `dist/`.
2. **The Intercept**: The portable intercept must remain the very first logic block in `main.cjs`.
3. **Paths**: If the folder structure changes, update the `files` array in `electron-builder` to match.
