# FastReader

Browser-based RSVP speed-reading app built with React + Vite.

## What it supports

FastReader accepts up to **10,000 words** and converts uploaded content into an RSVP word stream in the browser.

### Import formats

- **PDF** — extracts embedded PDF text; scanned/low-text pages are sent through OCR.
- **Word (.docx)** — converts Word documents to plain text.
- **Images** — common browser image formats such as PNG, JPG/JPEG and WEBP are OCR'd.
- **Text (.txt)** — text files and pasted text.
- Files are processed locally in the browser; there is no FastReader upload server.

> Legacy `.doc` files are not the same format as `.docx` and are not supported by the browser DOCX parser.

## Reading features

- Word-by-word RSVP display
- 100–1000 WPM control
- Play/pause and step controls
- Progress and reading statistics
- Dark/light mode
- Keyboard shortcuts
- Drag-and-drop upload
- Clear 10,000-word limit with validation
- OCR progress/status for image and scanned-PDF imports

## Local development

Requires Node.js 22+.

```bash
npm install
npm run dev
```

## End-to-end tests

The repository uses Playwright to test:

- exactly 10,000 words
- rejection of 10,001 words
- TXT import
- DOCX extraction
- PDF extraction
- image OCR

```bash
npm run build
npm run test:e2e
```

GitHub Actions runs these tests before deploying to GitHub Pages.

## Deployment

GitHub Actions builds the application, runs the end-to-end suite, and deploys to GitHub Pages only when the tests pass.

Expected URL:

https://royal4616.github.io/FastReader/
