# pkgcheck

a tool that uses ai to give you an idea if an aur package is safe to install

## background

i recently started using arch and i think the aur is cool, but obv downloading random packages can be a bad idea

so i thought it would be a fun project to make a chrome extension that uses ai to do the manual "checking" that we are all supposed to do (but probably don't) before installing an aur package

## how it works

pkgcheck is a browser extension that analyzes AUR packages using AI to determine their safety. When you navigate to an AUR package page, the extension:

1. extracts the package name from the URL
2. fetches the PKGBUILD, metadata, and comments from the AUR
3. sends this data to a serverless API that analyzes the package using AI (Gemini and OpenAI models)
4. generates a comprehensive security report and a user-friendly summary
5. displays the results in the extension popup, highlighting risk level, recommendations, and key concerns

the extension caches analysis results locally, so you don't need to re-analyze packages you've already checked.

## tech stack

### extension
- wxt (chrome extension framework)
- react
- tailwindcss
- dexie (indexedDB wrapper for local caching)

### api
- cloudflare workers (serverless)
- hono (lightweight web framework)
- ai-sdk (for working with OpenAI and Google models)
- cheerio (for HTML parsing)

## usage

1. set up the API:
   - clone the repo and navigate to the `api` directory
   - add your API keys in environment variables
   - deploy to cloudflare workers or run locally

2. install the extension:
   - navigate to the `extension` directory
   - build the extension with `npm run build`
   - load the extension in your browser from the `dist` folder

3. using pkgcheck:
   - navigate to any AUR package page (e.g., https://aur.archlinux.org/packages/package-name)
   - click on the pkgcheck extension icon
   - enter your API password/token when prompted
   - click "Analyze Package" to get a security assessment

the extension will show a color-coded risk level, recommendation, key points, and any top concerns about the package.