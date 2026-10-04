# SmartSafar project guide

## Product vision

SmartSafar is a polished, responsive travel companion for travel across India. The long-term product includes authentication, destination discovery and detail pages, maps and location, weather, trip planning and saved trips, safety and emergency services, regional language assistance, user preferences, and an AI travel assistant. Build toward one cohesive product rather than a collection of unrelated demos.

## Current architecture

- `client/` is the active React single-page app, bootstrapped with Create React App (`react-scripts`). Its entry is `client/src/index.js`; the mounted router and protected route table are in `client/src/App.js`. `client/src/auth/AuthContext.js` owns session state and revalidates saved JWTs with `/api/auth/me`; `client/src/lib/api.js` configures Axios and the bearer header. Pages are in `client/src/pages/`, shared UI in `client/src/components/`, and HTTP/service logic in `client/src/services/`. Explore loads the curated catalogue via `destinationService.js`; destination details use a lazy-loaded React Leaflet/OpenStreetMap map and on-demand `weatherService.js` Open-Meteo requests. `/destinations/:destinationId` is protected by the same auth guard.
- Styling is a mix of global CSS, page CSS, utility-like class names, and shared components. Login and Signup currently establish the intended visual direction; inspect their source and styles before changing shared design.
- `backend/` is the canonical FastAPI service. `backend/app.py` mounts the API and configures CORS; `backend/config.py` reads environment settings; `backend/database.py` provides the reusable SQLAlchemy engine/session/base; `backend/models/`, `backend/schemas.py`, `backend/security.py`, `backend/dependencies.py`, `backend/routes/`, and `backend/services/` separate persistence, validation, password/JWT security, authorization, HTTP routes, and reusable domain logic. Auth endpoints are `/api/auth/signup`, `/api/auth/login`, and `/api/auth/me`. Destination catalogue/detail endpoints are `GET /api/destinations` and `GET /api/destinations/{id}`. Authenticated saved-place endpoints are `GET /api/saved-destinations`, `POST /api/saved-destinations/{id}`, and `DELETE /api/saved-destinations/{id}`. Trips use SQLAlchemy `Trip` records with JSON itinerary content; protected trip CRUD is under `/api/trips`, while `POST /api/trip-plans/generate` creates an unsaved preview. Profile fields are in a user-owned `UserProfile` row behind authenticated `GET/PUT /api/profile`; emergency contacts are user-owned CRUD records under `/api/safety/contacts`. `POST /api/safety/nearby` accepts explicitly requested one-shot coordinates in its validated JSON body, queries OpenStreetMap Overpass, and never persists coordinates. `backend/services/trip_planner.py` provides curated, deterministic preference-based itineraries behind a provider protocol; it is not a connected generative AI service and must be labelled honestly. Every user-specific read/write is scoped to the authenticated user. The destination catalogue is curated static data in `backend/services/destinations.py`; SQLite defaults to `backend/smartsafar.db`.
- Protected `POST /api/translation/translate` accepts only text and supported source/target language codes. `backend/services/translation.py` adapts to an optional loopback IndicTrans2 inference endpoint configured with `TRANSLATION_PROVIDER_URL`; it accepts `{text, source_language, target_language}` using IndicTrans2 codes and returns `{translation}`. Requests are limited to 500 characters with a configurable timeout. No model runtime or translation credentials are bundled; without a local provider, the API returns a clear 503 fallback. Browser speech recognition/synthesis stays client-side, requires explicit user action, and is not persisted.
- `server/` is a retired Express compatibility stub. It no longer connects to MongoDB or authenticates users; legacy `/api/auth` requests return HTTP 410. Its existing Express process is not part of the SmartSafar API. Obsolete Express auth routes, middleware, Mongoose user model, dependencies, and an unreferenced root-level Mongoose `usermodel` were removed after FastAPI API and browser flows passed. Keep this stub clearly retired; do not restore a second auth source of truth.
- Root-level `frontend/`, `models/`, and `data/` also exist; their present role is not established. Inspect a specific relevant file before relying on them. `client/build/`, `node_modules/`, Python caches, and `venv/` are generated/dependency artifacts, not source-of-truth code.
- Frontend tests are in `client/src/` and use Create React App/Jest. Backend API tests are in `backend/tests/` and use pytest with an isolated in-memory SQLite database.

## Important directories

- `client/src/pages/`: route-level screens (Login, Signup, Dashboard, Safety, Languages, Profile, TripPlanner, Trips, TripDetails).
- `client/src/components/`: reusable navigation, layout, cards, buttons, loading, and empty-state components.
- `client/public/`: static client assets and manifest.
- `backend/`: FastAPI service and Python requirements.
- `backend/models/`, `backend/routes/`, `backend/services/`, `backend/tests/`: SQLAlchemy models, modular API routes, reusable domain services, and backend tests.
- `client/src/services/`: frontend API and external-service functions; Open-Meteo requests are made only for a selected destination, never for every destination card. Phase 4 API functions are grouped in `phase4Service.js`, and the offline curated phrasebook data lives in `data/travelPhrases.js`.
- `client/src/data/travelLanguages.js` is the canonical display/native/speech/provider language metadata; `client/src/services/translationService.js` sends arbitrary text to the protected FastAPI translation route. Keep provider credentials out of the browser.
- `server/`: retired Express compatibility stub; do not add product/auth functionality here.
- `data/`, `frontend/`, `models/`: present in the repository; verify their use before extending them.

## Local development commands

Run each command from the named directory in a PowerShell terminal.

Frontend:

```powershell
Set-Location client
npm install
npm start
```

The Create React App scripts also provide `npm run build` and `npm test` from `client/`.

FastAPI backend (activate the existing environment if appropriate, or create one first):

```powershell
Set-Location 'C:\Users\T Himadeep\smartsafar'
.\venv\Scripts\python.exe -m pip install -r backend/requirements.txt
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --port 8000
```

Replace the `JWT_SECRET` placeholder in the ignored `backend/.env` with a fresh random secret of at least 32 characters before starting. `DATABASE_URL` is optional; by default the ignored SQLite database is `backend/smartsafar.db`.

Frontend tests and production build:

```powershell
Set-Location client
npm test -- --watchAll=false --runInBand
npm run build
```

Backend tests (from repository root):

```powershell
.\venv\Scripts\python.exe -m pytest backend/tests -q
```

The optional client API base URL is `REACT_APP_API_URL`; it defaults to `http://localhost:8000/api`. Backend environment variables are `JWT_SECRET` (required), `JWT_ALGORITHM` (HS256/HS384/HS512), `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60), `DATABASE_URL` (optional), and `CORS_ORIGINS` (defaults to `http://localhost:3000`). Keep local `.env` files and SQLite files out of version control. Never print or commit secret values.

Optional local IndicTrans2 inference uses `TRANSLATION_PROVIDER_URL` (loopback HTTP(S) endpoint only) and `TRANSLATION_PROVIDER_TIMEOUT_SECONDS` (default 10; range 1–30). Do not configure a paid hosted provider without explicit approval. If no provider is configured, show the unavailable state rather than placeholder translations.

## Design rules

- Preserve the cinematic Indian travel atmosphere: midnight/navy surfaces, translucent glass panels, clear white typography, blue primary actions, restrained amber/gold accents, quality travel imagery, generous spacing, and subtle motion.
- Keep Login, Signup, Dashboard, Safety, Languages, Profile, and future screens recognizably part of the same product. Reuse existing components and established tokens/styles where practical.
- Ensure keyboard access, visible focus, semantic labels, readable contrast, reduced-motion support, and responsive behavior across phone, tablet, and desktop.
- Do not introduce visual dependencies or asset sources that require paid services or credentials.

## Coding and architecture rules

- Work inside this repository. Preserve useful code and dependencies; avoid project rewrites, replacement scaffolds, or broad refactors unrelated to the requested change.
- Before a change, inspect only the relevant route, component, service, model, styles, and configuration. Do not repeatedly crawl the whole repository or generated directories.
- Keep `AGENTS.md` current when architecture, commands, or durable engineering decisions change. Record significant choices here rather than duplicating transient implementation notes.
- Follow existing naming and component patterns unless there is a concrete reason to improve them. Keep components focused and shared behavior genuinely reusable.
- Never hardcode API keys, passwords, JWT secrets, or other credentials. Validate and normalize untrusted input at the API boundary; return useful errors without exposing internals.
- Do not claim a feature works until its actual user flow and required integrations are implemented. Mark mock/demo behavior clearly and do not present placeholder data as live results.

## Feature implementation rules

- Implement a feature across the layers it needs: responsive UI, loading/empty/error states, validation, API contract, persistence, and authorization as applicable. Keep frontend and backend behavior consistent.
- Keep destination catalogue facts and destination schemas reusable; never fetch weather for a whole card grid. Request Open-Meteo only when a destination detail is opened, and keep the detail/map usable if weather or map tiles fail.
- Trip previews must be explicitly saved to persist. Regeneration replaces an existing itinerary only after explicit user confirmation; preference edits preserve the itinerary and mark it stale. Do not call the deterministic preference-based itinerary provider AI. Curated stop suggestions are not live opening, routing, weather, or availability data.
- Persist saved destinations against the authenticated user ID. Every list/create/delete query must be scoped to that user; do not use browser storage as the source of truth.
- Use the established SQLite/SQLAlchemy persistence and FastAPI session dependency for durable data. Do not add another database or API server without a documented need.
- Authentication uses backend-backed accounts, Argon2 password hashes via `pwdlib`, JWT signed with an environment-provided secret, and a reusable bearer-token dependency. The client stores only the JWT in localStorage for this development architecture; the safe user profile remains in memory and is reloaded from `/api/auth/me`. Do not store passwords or duplicate cached user data. Do not add Google OAuth unless explicitly requested. Never restore mock tokens.
- Use free/open-source services where practical: OpenStreetMap and Leaflet for maps, Open-Meteo for weather, and browser location APIs with clear permission handling. Respect external-service limits and attribution requirements. Avoid paid APIs unless explicitly approved.
- For safety and emergency information, distinguish verified/live data from static guidance, show data freshness/source where relevant, and never imply an SOS was dispatched unless an actual dispatch integration exists.
- Do not call a feature complete because it compiles. Functional quality and UI/UX quality are both required for every feature.
- Functional quality: make the frontend call the real backend when required; verify API requests, persistence, auth, validation, and navigation as applicable. Provide working loading, error, empty, and success states. Confirm refresh behavior and avoid regressions to existing routes. Clearly label any permitted fallback; never present fake data as live. Handle free/external API outages without exposing credentials or claiming success.
- UI/UX quality: make each feature feel like SmartSafar, following the established Login/Signup direction: cinematic Indian travel atmosphere, midnight/navy backgrounds, glass surfaces, white typography, restrained blue and amber accents, considered spacing, and premium imagery where appropriate. Keep navigation, controls, forms, cards, typography, icons, and state treatments consistent. Avoid generic admin dashboards and unfinished/dead controls.
- Responsive quality: verify the feature at desktop, tablet, and mobile sizes. Check for horizontal overflow, overlap, readable text, usable buttons/forms/navigation, and appropriately sized cards/maps.
- Accessibility: use semantic elements, keyboard-operable controls, visible focus, adequate contrast, meaningful labels, and accessible names for icon-only controls where applicable.
- Before marking a feature complete, run the relevant frontend build and backend as applicable; exercise a successful flow and at least one validation/failure flow; check loading/empty states where applicable; inspect browser and backend logs; verify desktop and mobile layouts; and smoke-check existing routes. Fix issues introduced by the change before reporting completion. Do not claim an integration works unless it was actually exercised. Report checks performed and any remaining limitation.
- Add or update focused automated tests for changed behavior, run the smallest relevant checks, and supplement automation with the real-flow and responsive verification above. Test tooling must not substitute for actually verifying required integrations.

## Testing rules

- Frontend test/build commands are the Create React App scripts documented above; inspect existing test setup and available dependencies before adding test tooling. For a feature, run the relevant frontend build and tests, then manually exercise its browser flow at desktop, tablet, and mobile sizes.
- Backend tests use pytest and FastAPI/httpx test clients; run `python -m pytest backend/tests -q` from the repository root. Keep API tests isolated from production data and avoid paid services or real credentials. Start the backend when applicable and inspect its logs while exercising the feature.
- Exercise at least one successful request and one validation/failure case, plus loading/empty states where applicable. Check the browser console and smoke-test existing routes. Prefer focused checks for changed code, but do not treat a successful compile/build as proof that external services, authentication, persistence, or browser behavior works.

## Phase 5 — AI Travel Assistant architecture

- `/assistant` is a protected React route in `client/src/pages/Assistant.jsx`; the page calls `client/src/services/assistantService.js` and uses the existing Axios bearer-token client. Navbar links to the route. Conversation history is session-only in browser memory and is sent with a strict eight-message limit; it is not persisted by SmartSafar.
- FastAPI mounts protected `GET /api/assistant/status` and `POST /api/assistant/chat` from `backend/routes/assistant.py`. `backend/services/assistant.py` defines the provider protocol and optional Groq adapter. Context is selected from the curated catalogue, authenticated user's saved destinations, optional/latest relevant user-owned trip, and preferred language only. Never send email, phone, password hashes, or unrelated profile data. Trip links/actions must be checked against the authenticated user's context; destination actions must use supplied catalogue IDs.
- Configure the optional adapter only in ignored `backend/.env`: `AI_PROVIDER=groq`, `AI_API_KEY`, `AI_MODEL=openai/gpt-oss-20b`, and `AI_TIMEOUT_SECONDS`. The key is server-side only. Without a key, status reports unavailable and chat returns a clear 503; do not fabricate answers. The Groq service may change its availability, free limits, retention, and pricing. Review its current terms before enabling it; do not enable a paid tier or add a payment method without the user's explicit approval. Messages/context leave SmartSafar when the provider is configured, so keep the UI privacy notice accurate.
- Tests: `backend/tests/test_assistant.py` covers auth, validation, scoped context/action filtering, provider errors, and privacy. `client/src/pages/Assistant.test.js` covers unavailable/loading/send/error/retry/actions/navigation. Provider unit tests mock the network; they do not verify a real Groq credential or generated response.
- Windows QA note: the restricted sandbox can block the loopback socketpair Windows Proactor asyncio creates at startup; `asyncio.run(asyncio.sleep(0))` then stalls even outside pytest. Run backend pytest and local-server checks in an approved environment with loopback sockets instead of downgrading Python or removing async tests. The repository has no pytest-asyncio/event-loop fixture configuration.
