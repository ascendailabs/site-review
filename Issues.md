# Future Features

## Sitemap Upload & Multi-Project Support
- Upload a sitemap XML/CSV with URLs and purposes to auto-populate a review tracker
- Each upload creates a nested project, allowing multiple site reviews to coexist
- Pre-fills page names, URLs, and purpose fields from the sitemap data

## Screenshot Annotation (Markup.io Replacement)
- Lightweight commenting overlay on page screenshots, replacing Markup.io dependency
- **Screenshot capture**: Serverless function with headless Chromium (`@sparticuz/chromium` + Puppeteer), or use an external screenshot API (ScreenshotOne, ~$10/mo) to avoid Vercel's 50MB function size limit
- **Annotation layer**: Click anywhere on the screenshot to drop a pin at (x, y) coordinates and attach a comment. Store as `{ x, y, text, author, resolved, timestamp }` in existing KV state per page
- **Threading & resolution**: Reply to pins, mark as resolved, filter open vs resolved comments
- **Re-screenshot**: "Recapture" button to refresh the screenshot after site changes; store images in Vercel Blob or S3
- **Manual upload alternative**: Allow users to upload their own screenshots instead of auto-capture, cutting the build to just the annotation layer (~1-2 days)
- Estimated effort: 3-5 days for full MVP, or 1-2 days for annotation-only (manual screenshots)
