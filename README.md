# GraceMed Previews

Static HTML preview sites for small medical practices, deployed under:

```text
https://preview.gracemed.us/<practice-slug>
```

Example:

```text
https://preview.gracemed.us/northhillspsychiatry
```

## Repository Structure

Each practice preview lives in its own top-level folder. The folder name is the deployed URL slug.

```text
gracemed-previews/
  AGENTS.md
  README.md
  northhillspsychiatry/
    index.html
    images/
  shared/
```

## Stack

- Static HTML
- Tailwind CSS via CDN
- Minimal JavaScript
- Static assets only
- Hosted on Cloudflare Pages

There is no backend, database, framework build step, or authenticated application code in this repository.

## Cloudflare Pages Deployment

Use the build script so repository-only files such as `AGENTS.md` are not published.

- Build command: `./scripts/build.sh`
- Build output directory: `dist`

The build compiles local Tailwind CSS and avoids shipping the Tailwind CDN script in production.

## Image Optimization

Generate WebP copies of raster images and update HTML references with:

```bash
python3 scripts/convert_images_to_webp.py --update-html
```

The script scans source `images/` folders, skips SVG/WebP files, and ignores generated folders like `dist/`.

## Development Notes

- Use relative asset paths, because previews are served from subpaths.
- Keep previews mobile-first and accessible.
- Prefer optimized JPG/WebP images and SVG logos.
- Avoid production healthcare portal behavior or HIPAA-sensitive workflows in these previews.

See `AGENTS.md` for repository-specific implementation guidelines.
