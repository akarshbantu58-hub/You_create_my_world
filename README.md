# You Create My World

A mobile-friendly community virtual-world website.

## Website features
- Home, Explore, My Home and Community sections
- Visitor display name and world username
- Optional Instagram ID, shown only with explicit permission
- Google sign-in when Firebase is configured
- One free virtual home plot per signed-in account
- Shared street-name suggestions and one vote per account per suggestion
- Firestore security rules in `firestore.rules`

## Connect Firebase (required for shared features)
The code is committed, but shared accounts, plots and votes will stay disabled until you connect your own Firebase project.

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a Web App in Project settings and copy its Firebase web configuration.
3. Replace the example values in `firebase-config.js` with the Web App values. These web config values identify your project; never paste a service-account private key or admin credentials into this public repository.
4. In Firebase Authentication → Sign-in method, enable **Google**.
5. In Authentication → Settings → Authorized domains, add your GitHub Pages domain (for example, `YOUR-USERNAME.github.io`).
6. Create a Cloud Firestore database.
7. Publish the rules from `firestore.rules` in Firestore → Rules.
8. Commit `firebase-config.js`. GitHub Pages will rebuild the site.

The app uses Google sign-in, so visitors do not create or share a separate password with this website. Firestore rules enforce ownership of each home document and one vote per signed-in account for each street suggestion.

## Privacy and safety
- Use a nickname, not a legal name.
- Instagram ID is optional and is hidden unless the owner gives permission.
- Do not collect gender, date of birth, phone number, home address or live location.
- Public street suggestions should be moderated before they become official world locations.
- This prototype does not show a live population counter yet. Do not treat demo values as real users.

## Publish with GitHub Pages
1. Open repository Settings → Pages.
2. Under Build and deployment, choose **GitHub Actions** as the source.
3. The workflow in `.github/workflows/pages.yml` deploys the site on pushes to `main`.
4. Open the Pages URL shown in Settings → Pages after the workflow succeeds.

The website entry point is `index.html`.
