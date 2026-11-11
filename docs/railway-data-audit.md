# Rail Explorer railway data audit

Audit date: 11 November 2026

## Architecture found

- Next.js 16.4.5 App Router with React 19. API handlers under `src/app/api` proxy railway requests; the browser does not call the Railway Engine directly.
- Railway data currently comes through `src/lib/railway-api.ts`, configured by server environment variables. It has a bounded process-local cache and process-local rate limiter.
- Production provider health reported `whereismytrain` healthy for running status, station boards, and platforms, while `railradar` was rate-limited. PNR capability was only reported for RailRadar. That explains the PNR error: the only configured PNR-capable provider was rejecting requests with a rate limit.
- A curated local train directory supplies a limited reference set of search, route, schedule, and coach data when a matching entry exists. It intentionally does not make up unknown routes. Production returned route-unavailable for 04092 and a curated route for 18403.
- Supabase is already used for authenticated shared seat-swap data. Passenger PNR responses are not stored there.

## Changes in this release

- Added a server-only RailKit REST client using the documented `x-api-key` header and API paths.
- Provider health now reports only whether RailKit is configured (never its value) and labels it unverified until a live provider call succeeds.
- PNR requests try RailKit first when `RAILKIT_API_KEY` is configured, validate the returned PNR, train number, and source/destination, normalize passenger booking/current state and berth details, then fall back to the existing Railway Engine provider.
- PNR data is not cached or logged. The key is read only by server code.
- Route requests try RailKit's documented train-info endpoint when configured. Returned route stops are validated and carry `RAILKIT` source metadata; malformed or incomplete route responses fall through to the existing provider.
- Added automated fixtures for RailKit PNR normalization, mismatch rejection, and route validation. Fixtures use synthetic PNR values and never call a railway API.

## Provider and source review

| Source | Findings | Decision |
| --- | --- | --- |
| RailKit | Official docs describe PNR, train info, V1 NTES-backed live tracking, V2 WIMT tracking, station boards, timetable, train search, seat availability, and fare endpoints. | Integrated the documented PNR and train-info endpoints server-side. Other endpoints remain future work. |
| Railway Engine | Existing aggregator/proxy. Production health showed the RailRadar provider rate-limited and WhereIsMyTrain healthy for a smaller capability set. | Kept as fallback and for existing features. Rate limits are upstream and cannot be fixed by retries from this app. |
| `x64vbhv/ntes-client` | The repository describes itself as unofficial, uses `requests` and `pycryptodome`, and advertises PNR auto-CAPTCHA solving plus IRCTC reservation-chart lookups. The repository lists an MIT license. | Not installed or integrated. CAPTCHA solving and use of unofficial upstream access are not appropriate production fallbacks; no independent permission/reliability guarantee was found. |
| Curated train directory | Local, limited set of reference routes/compositions. | Retained as explicitly non-live fallback; unknown trains remain unavailable rather than being fabricated. |

## Configuration

Set `RAILKIT_API_KEY` as a server-only Vercel environment variable for Production (and Preview if desired), then redeploy. It is not present in this workspace's `.env.local`, so the RailKit path could not be exercised against a live key here. The code falls back to Railway Engine if the variable is absent or RailKit is unavailable. Do not prefix it with `NEXT_PUBLIC_`.

## Remaining production work

- Confirm the RailKit key name and availability in Vercel without exposing its value, then run authorized live PNR and route checks. No real PNR was queried during this audit.
- Implement and verify RailKit live status, train/station search, station boards, seat availability, fares, and cancellations; existing capability and provider limitations remain.
- Add shared cross-instance cache, request deduplication, distributed rate limiting, bounded retries/circuit breakers, and cache/source/freshness metrics. The current cache and limiter are in-memory per serverless instance, not fleet-wide.
- Build an authenticated administrator provider dashboard. Existing health/coverage API responses are diagnostic endpoints, not a protected operations console.
- Establish a verified broad route/composition dataset. Unsupported trains such as 04092 have no verified local fallback today.
- Run production-like concurrency/load tests before making any high-traffic capacity claim. No 100,000-visitor load test has been performed.
- The unofficial NTES client, 3D coach mapping from returned PNR berth data, and exact live GPS mapping still require separate review/implementation and provider-supported data.

## Verification

- `npm test`: 54 passing.
- `npx tsc --noEmit`: passed.
- Targeted ESLint for `src/lib/railkit-api.ts` and `src/lib/railway-api.ts`: passed.
- `npm run build`: passed with Next.js 16.4.5.
- Production endpoints checked without passenger data: provider health, coverage, train search, and routes for 04092 and 18403.
