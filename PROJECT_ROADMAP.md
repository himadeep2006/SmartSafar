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

## Phase 4 — Safety, languages, and profile (implementation complete; verification pending)

- Protected profile APIs persist display name, optional phone/home city, supported preferred language, and travel notes/preferences in a user-owned profile row. Account email/username are read-only; password hashes are never returned.
- Safety contacts are protected CRUD records scoped to the JWT user. The SOS UI is explicit and honest: SmartSafar does not dispatch alerts or transmit location; the user confirms before choosing `tel:112`.
- Nearby emergency lookup requests browser location only after the user's action, sends coordinates in a validated authenticated POST body (not logged in the URL), makes a one-shot free OpenStreetMap Overpass query, displays returned records on Leaflet, and clearly marks coverage/availability as unverified with retrieval time. Coordinates are not persisted. Static travel guidance and the Government of India ERSS source are presented separately from live lookup.
- Languages provides a curated starter phrasebook for English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, and Marathi across seven categories. Language preference shares persistent profile storage; search, category filtering, copy, and clear static-data/no-machine-translation disclosure are included.
- Verification is in progress; only mark Phase 4 complete after the feature flows, existing phases, backend/frontend tests, production build, browser and responsive checks pass. No Phase 5 work is in scope.

## Phase 5 — Travel assistant and product polish

- Add an assistant grounded in the user's trip and destination context, with explicit provider configuration and graceful unavailable states.
- Finish responsive/accessibility review, coherent navigation, empty/loading/error states, security/privacy review, and focused automated checks for critical flows.
- Continue broader app-wide polish, accessibility, and responsive review after Phase 4 verification.

## Completion criteria

A roadmap item is complete only when functional and UI/UX quality are both verified: its user flow, required API and persistence, validation, loading/empty/error/success states, refresh behavior, and navigation work; its interface follows SmartSafar styling, accessibility, and desktop/tablet/mobile requirements; relevant build/backend checks pass; successful and failure paths are exercised; browser/backend logs are checked; and existing routes are smoke-tested. Clearly label demo or static content and record external service limitations. Compilation alone is not completion.
