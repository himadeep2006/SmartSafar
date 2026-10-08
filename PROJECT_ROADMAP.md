# SmartSafar implementation roadmap

This roadmap reflects the repository and Phase 5 verification as of 2026-10-04. Completed phases reflect implementation and verification; planned items are not claims that those features already work.

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

## Phase 5 — AI Travel Assistant (VERIFIED)

- Implemented protected `/assistant` UI and authenticated `/api/assistant/status` and `/api/assistant/chat` endpoints. Optional Groq provider uses a server-only key and structured output; without configuration, the API returns 503 and the UI clearly reports that no answer was generated.
- Context and navigation actions are restricted to the authenticated user's relevant trip/saved-place context and matched catalogue destinations. Assistant does not persist chat or mutate trips. A mocked-provider regression found and fixed centralized destination-action filtering.
- Backend verification: all 28 tests pass when run outside the restricted sandbox. The earlier hang was the sandbox blocking the Windows Proactor loopback socketpair, not Python 3.14 incompatibility or project pytest configuration. Frontend verification: 48 tests pass; production build passes.
- Final browser verification (2026-10-04): assistant was checked at 1440×1000, 768×1024, and 390×844 using Edge DevTools. No horizontal overflow, JavaScript exceptions, or `console.error` calls were found. The expected no-provider HTTP 503 was recorded; the unavailable state and retry worked without duplicating the user message. Authentication, refresh, logout, protected-route redirect, and all requested mobile route smoke checks passed.
- Verification: 28 backend tests, 48 frontend tests, and production build passed. Security/user-isolation coverage passed as part of the backend suite.
- The optional Groq provider remains unconfigured. Live generated responses and provider data handling are intentionally not verified; no API key is required for the application to run. Do not enable a paid tier or add a payment method without explicit approval.
- Phase 5 is **VERIFIED** with optional-provider live response listed as a limitation.

## Phase 6 — Full integration, security, performance, and final polish (IN PROGRESS)

- Initial repository audit completed 2026-10-04. React and FastAPI remain the active application architecture; SQLite remains the local development database. Secrets and optional provider credentials remain in ignored `backend/.env` and are never exposed to the client.
- Fixed shared API handling for protected-endpoint HTTP 401 responses: the auth context clears the stale JWT/user state and protected screens return to login. Added regression coverage for 401 notification/session cleanup.
- Final verification run 2026-10-05: backend 28/28 and frontend 51/51 tests passed; production build and `git diff --check` passed. The normal API base URL (`http://localhost:8000/api`) was preserved; API root and `/health` returned success. Requested routes were checked at 1440×1000, 768×1024, and 390×844 with no horizontal overflow. Tablet navigation, destination map, and assistant composer fit. Browser signup/login, refresh, logout/protected redirect, invalidated-token 401 redirect, and assistant no-provider send/503/retry without duplicate user message passed. Real API checks covered trip CRUD and regeneration, profile persistence, emergency-contact CRUD, saved-place persistence, cross-user denials, and unavailable translation/assistant providers. Captured browser console error logs were empty for the assistant, mobile assistant, and stale-auth checks. Browser automation stalled during later cross-feature UI actions, so complete browser verification of planner-to-saved-trip UI lifecycle, profile-edit UI persistence, phrasebook/translator UI interaction, safety contact UI/geolocation-denial behavior, exact mobile quick-prompt wrapping, and full network/resource errors is still outstanding.
- Phase 6 remains **IN PROGRESS / NOT VERIFIED** until the remaining browser-only integration checks are completed. IndicTrans2 remains intentionally paused; the assistant provider remains unavailable without server-side configuration.

## Completion criteria

A roadmap item is complete only when functional and UI/UX quality are both verified: its user flow, required API and persistence, validation, loading/empty/error/success states, refresh behavior, and navigation work; its interface follows SmartSafar styling, accessibility, and desktop/tablet/mobile requirements; relevant build/backend checks pass; successful and failure paths are exercised; browser/backend logs are checked; and existing routes are smoke-tested. Clearly label demo or static content and record external service limitations. Compilation alone is not completion.
