# SmartSafar implementation roadmap

This roadmap reflects the repository as inspected on 2026-10-01. Completed phases reflect implementation and verification; planned items are not claims that those features already work.

## Phase 1 — Backend foundation and real authentication (complete)

- FastAPI is the canonical API, with modular SQLAlchemy/SQLite persistence, constrained CORS, and environment-configured JWT settings.
- Signup, login, and `/me` use Argon2 password hashes, safe user responses, validated inputs, bearer auth, and a reusable database/session architecture.
- React signup/login use real API calls; saved sessions are revalidated on refresh; `/dashboard`, `/languages`, `/safety`, and `/profile` are guarded; logout clears the token. The retired Express auth endpoints return HTTP 410.
- Focused backend/client tests, live API requests, browser auth flows, and desktop/tablet/mobile auth layouts were exercised. See `AGENTS.md` for setup and commands.

## Phase 2 — Explore, destinations, maps, and weather (complete)

- The protected Explore/Dashboard presents a curated Indian catalogue with live API-backed search, category filters, detail navigation, and useful loading/error/empty states.
- Destination schemas and catalogue/detail endpoints are in FastAPI; saved destinations use authenticated, user-scoped SQLAlchemy/SQLite persistence and survive refresh and a new login.
- Destination details show curated travel information, an interactive React Leaflet map using OpenStreetMap tiles, and on-demand Open-Meteo current conditions plus a three-day forecast. Map/weather outages do not block the rest of the detail view.
- Focused backend tests cover catalogue filters, validation, detail 404, auth, save/remove, persistence, re-login, and user isolation. Weather normalization/error handling has frontend unit tests; API, map, save/refresh, and responsive browser flows were exercised. See `AGENTS.md` for commands and architecture.

## Phase 3 — Trips and itinerary planning

- Complete: `Trip` SQLAlchemy/SQLite persistence, protected preview/create/list/detail/update/regenerate/delete APIs, validated preferences, and user-scoped authorization. The draft generation API does not save; trip creation generates the saved plan server-side.
- Complete: `/planner`, `/trips`, and `/trips/:tripId` are protected React routes. Destination details preselect into the planner; Dashboard, Navbar, and My Trips provide planner navigation. The detail view reuses destination catalogue data, Leaflet/OpenStreetMap, and on-demand Open-Meteo weather.
- Complete: review-before-save flow, trip categories, empty/loading/error states, edit and stale-itinerary handling, explicit regeneration/deletion dialogs, and responsive SmartSafar styling.
- Planner limitation: no generative AI provider or paid API is configured. The current provider protocol uses a deterministic, credential-free planner with curated destination stops and traveler-editable preferences. It is clearly identified as preference-based; stop access, hours, route estimates, and actual costs are not live or guaranteed.
- Verification: focused frontend/backend tests, frontend production build, backend API tests, and the protected browser route plus live generation preview were exercised. See `AGENTS.md` for commands and current architecture.

## Phase 4 — Safety, languages, and profile (complete)

- Protected profile APIs persist display name, optional phone/home city, supported preferred language, and travel notes/preferences in a user-owned profile row. Account email/username are read-only; password hashes are never returned.
- Safety contacts are protected CRUD records scoped to the JWT user. The SOS UI is explicit and honest: SmartSafar does not dispatch alerts or transmit location; the user confirms before choosing `tel:112`.
- Nearby emergency lookup requests browser location only after the user's action, sends coordinates in a validated authenticated POST body (not logged in the URL), makes a one-shot free OpenStreetMap Overpass query, displays returned records on Leaflet, and clearly marks coverage/availability as unverified with retrieval time. Coordinates are not persisted. Static travel guidance and the Government of India ERSS source are presented separately from live lookup.
- Languages keeps the curated seven-category phrasebook and profile-backed preferred phrase language, and adds arbitrary translation controls, session-only two-way conversation, one-shot browser speech input, speech synthesis, swap, and copy for English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, and Marathi. Translation uses protected `POST /api/translation/translate`; the optional self-hosted IndicTrans2 adapter is loopback-only, capped at 500 characters, and returns an explicit unavailable response until a compatible local model server is configured. Speech input/output remain browser-native and are not persisted.
- Verified complete before Phase 5 work began. The optional self-hosted IndicTrans2 runtime remains paused and unavailable unless a compatible loopback model service is configured.

## Phase 5 — AI Travel Assistant (IMPLEMENTED; verification incomplete)

- Implemented protected `/assistant` UI and authenticated `/api/assistant/status` and `/api/assistant/chat` endpoints. Optional Groq provider uses a server-only key and structured output; without configuration, the API returns 503 and the UI clearly reports that no answer was generated.
- Context and navigation actions are restricted to the authenticated user's relevant trip/saved-place context and matched catalogue destinations. Assistant does not persist chat or mutate trips. A mocked-provider regression found and fixed centralized destination-action filtering.
- Backend verification: all 28 tests pass when run outside the restricted sandbox. The earlier hang was the sandbox blocking the Windows Proactor loopback socketpair, not Python 3.14 incompatibility or project pytest configuration. Frontend verification: 48 tests pass; production build passes.
- Browser verification: signup/login, session restoration, major routes, and the no-provider assistant send/retry flow were exercised locally. The available browser viewport was about 740 CSS pixels and exposes no viewport override; exact 1440/768/390 responsive checks remain incomplete. Browser console logs were not available through the selected CUA API.
- No Groq key is configured, so live generated responses and provider data handling remain unverified. Do not enable a paid tier or add a payment method without explicit user approval; review current provider terms before configuration.
- Phase 5 remains **UNVERIFIED** until exact responsive checks and browser console review are completed; real-provider verification remains pending unless a key is configured.

## Completion criteria

A roadmap item is complete only when functional and UI/UX quality are both verified: its user flow, required API and persistence, validation, loading/empty/error/success states, refresh behavior, and navigation work; its interface follows SmartSafar styling, accessibility, and desktop/tablet/mobile requirements; relevant build/backend checks pass; successful and failure paths are exercised; browser/backend logs are checked; and existing routes are smoke-tested. Clearly label demo or static content and record external service limitations. Compilation alone is not completion.
