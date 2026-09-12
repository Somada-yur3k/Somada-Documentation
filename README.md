# A Web-Based Physics and Circuits Laboratory Management System with AI Capabilities for NU Fairview

Documentation for the NU Fairview Physics and Circuits Laboratory project. Open `Docs.html` for the current paper and `index.html` for navigation.

Current AI scope: an authenticated, informational Q&A chatbot for Class Representatives and Faculty. It answers item availability, schedule availability, operating hours, and the requester's own reservation status from authorized records. Forecasting, AI-written report summaries, and AI-driven reservation actions are outside the current consultation scope.

CSS filenames, storage keys, and the internal diagram editor API retain their legacy names for compatibility; these are not the project name. The Apps Script legacy cover-title matcher is also retained to update existing Google Doc copies safely.

The embedded ERD is a legacy source image pending schema revision; its forecast entity is explicitly excluded from the current scope. See the notice in the ERD section before submission.

## Navigation and publication checks

The primary menu links directly to Documentation, Use Case, DFD Levels 0–2 and the Google Doc copy. Traceable views are retired; old URLs redirect to the canonical compact pages. The Google Docs link only opens the document; the separate Update Google Docs action performs a sync.

Run `node integrations/google-docs/check-navigation.cjs` with Playwright available to check all seven menus, mobile return links, redirects and clean exports. The diagram and A4 checks in the same directory are read-only unless passed `--render` to regenerate local PNGs.
