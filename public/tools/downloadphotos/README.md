# ChildFirst Photo Export

A single-file, client-side tool that lets a parent download their own child's
photos from the ChildFirst / Taidii childcare app.

Served at **`/tools/downloadphotos/`**.

## How it works

- 100% static. `index.html` runs entirely in the visitor's browser and talks
  directly to ChildFirst's servers over HTTPS — the same endpoints the official
  app uses. **This site never receives, stores, or logs any password, token, or
  photo.** There is no backend.
- The parent signs in with their own ChildFirst credentials, picks a folder,
  and the tool downloads the photos their child is tagged in straight to disk
  (Chrome/Edge via the File System Access API; other browsers get ZIPs by month).
- Downloads are deliberately rate-limited to be gentle on ChildFirst's servers.

## Scope & disclaimer

- Exports **your own child's** photos only — it uses your account, which only
  has access to your own data.
- Independent tool. **Not affiliated with, endorsed by, or connected to
  ChildFirst or Taidii.** Provided as-is, use at your own risk.
- It relies on the app's current API; if ChildFirst changes it, the tool may
  stop working.

No dependencies to build — the page loads CryptoJS and JSZip from cdnjs with
subresource-integrity hashes.
