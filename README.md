# You Create My World

A community-built virtual world website preview.

## Current preview
- Responsive home page with a glowing planet illustration
- Visitor profile with display name and world username
- Optional Instagram ID with a separate permission checkbox
- Remember profile on this browser/device
- Explore, My Home and Community preview sections

## Important limitations
This is a front-end prototype, not a secure account system. The profile is stored in this browser only. It does not create shared accounts, reserve shared plots, save houses to a database, run real votes, or calculate live population. Those features need a secure backend such as Firebase Authentication and Firestore, plus server-side rules and moderation.

For privacy, the form does not ask for gender, legal name, date of birth, phone number, address or live location. Do not put private information in a public profile.

## Publish with GitHub Pages
1. Open the repository **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. The workflow in `.github/workflows/pages.yml` will publish the site.
5. When the workflow succeeds, open the Pages URL shown in Settings → Pages.

The site entry point is `index.html`.
