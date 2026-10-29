# Teachable Machine Browser Studio

A browser-based workspace for creating image and text classification projects, collecting labeled examples, training TensorFlow.js models, and reviewing their results. It also includes AI-assisted tools for exploring datasets, analyzing images, and managing model experiments.

## Features

- Create image or text classification projects from scratch or from project templates.
- Collect and organize labeled samples in the browser.
- Train and evaluate TensorFlow.js models, with training progress and classification metrics.
- Save projects and trained models locally in IndexedDB.
- Optionally sign in with Firebase and sync project data with Firestore.
- Explore additional AI tools for insights, dataset analysis, model comparison, deployment, and image analysis.
- Use optional AI provider APIs through the included Express server.

## Requirements

- Node.js (LTS recommended)
- npm
- A modern browser; webcam features require camera permission and a secure context (localhost is supported).

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The development server runs Express and Vite together.

## AI provider configuration

The app's AI-backed server routes can run in demo mode without provider credentials. To enable live Gemini responses, set `GEMINI_API_KEY` in the environment before starting the server. For example, in PowerShell:

```powershell
$env:GEMINI_API_KEY = "your-key"
npm run dev
```

Other integrations can use provider keys such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, and `OPENROUTER_API_KEY`. Image and video generation routes may also use provider-specific keys; see `server.ts` for supported environment variable names.

Keep API keys private. Do not commit keys to the repository. Some AI functionality sends prompts or selected media to the configured external provider; check that provider's terms and privacy policy before use.

## Firebase (optional)

Firebase is used for authentication and optional Firestore sync. The app reads its Firebase client configuration from `firebase-applet-config.json`. This local config file is ignored by Git so project-specific values are not published. To configure Firebase:

1. Copy `firebase-applet-config.example.json` to `firebase-applet-config.json`.
2. Replace the example values with values from your Firebase project.
3. Enable the authentication methods you want to use (email/password and Google are supported).
4. Configure Firestore and suitable security rules for the user-scoped data used by the app.

The Firebase web configuration is client-side configuration, not a place to put server API secrets. Firestore security rules should enforce access control.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express/Vite development server on port 3000. |
| `npm run lint` | Run the TypeScript compiler without emitting files. |
| `npm run build` | Build the frontend and bundle the production server to `dist/server.cjs`. |
| `npm start` | Start the production server; run `npm run build` first. |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl` + `Shift` + `D` | Open the dashboard |
| `Ctrl` + `Shift` + `S` | Open settings and diagnostics |
| `Ctrl` + `Shift` + `P` | Open the profile |

## Data and privacy

Projects, labels, samples, models, and logs are stored locally in the browser's IndexedDB. If Firebase is configured and a user is signed in, supported project data is also synchronized to Firestore. TensorFlow.js training runs in the browser; separate AI features that call the Express API may send the requested content to an external provider.

## Project layout

```text
.
├── server.ts                     # Express API and Vite development middleware
├── src/
│   ├── App.tsx                   # Application state and navigation
│   ├── main.tsx                  # React entry point
│   ├── types.ts                  # Shared TypeScript types
│   ├── components/               # Workspace, dashboard, and AI tools
│   └── services/
│       ├── db.ts                 # IndexedDB persistence and sync integration
│       ├── firebase.ts           # Firebase authentication and Firestore
│       └── ml.ts                 # TensorFlow.js training and inference
├── firebase-applet-config.json   # Firebase client configuration
├── firebase-applet-config.example.json # Safe template for local Firebase setup
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and npm scripts
└── vite.config.ts                # Vite configuration
```
