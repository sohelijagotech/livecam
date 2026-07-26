# LiveConnect Backend — Phase 1 MVP

NestJS + TypeORM (PostgreSQL) + Socket.IO scaffold implementing the **Phase 1 MVP** feature set
from the LiveConnect blueprint: Auth (Register/Login/OTP), Profile, Follow/Unfollow, Go Live,
Live Chat, Wallet (Coin/Diamond), Gifts, and Withdrawal Requests.

## Deployment (Supabase + Render/Railway)

**Do not deploy this backend to Vercel** — it uses Socket.IO for live chat, which needs a
persistent connection. Vercel's serverless functions can't hold one open; Render and Railway
can.

1. Push this folder to a GitHub repo.
2. In Supabase: Project Settings → Database → copy the **direct connection** string (port
   `5432`, not the `6543` pooler one — this is a long-running server, not serverless, so the
   direct connection is the right fit for TypeORM's own connection pool).
3. On Render or Railway: create a new Web Service from that repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - Environment variables: everything in `.env.example`, with `DB_HOST` / `DB_PASSWORD` / etc.
     from the Supabase connection string, plus `DB_SSL=true`. Leave `DB_SYNCHRONIZE=true` for
     the first deploy so the tables get created — see the note in `app.module.ts`.
4. Deploy, then hit `POST /auth/register` on the resulting URL to confirm the database
   connection works end to end.
5. Point the Flutter app's `API_BASE_URL` / `SOCKET_URL` (in `lib/config/app_config.dart`) at
   that URL instead of `localhost`.

## What's implemented

| Feature | Status |
|---|---|
| Register / Login / OTP verify (JWT) | ✅ working logic, OTP is console-logged (plug in SMS provider) |
| **Google / Facebook Sign-In** | ✅ auto-creates an account on first login; links to an existing password account by matching email |
| Profile (get/update) | ✅ |
| Follow / Unfollow | ✅ |
| Go Live / End Live / List Live | ✅ (streaming provider token generation is a TODO stub) |
| Live Chat (Socket.IO) | ✅ join/leave room, send/receive messages, gift broadcast |
| Wallet (balance, buy-coins, history) | ✅ (payment gateway verification is a TODO stub) |
| Gifts (list, send — full coin→diamond economy with commission) | ✅ |
| Withdrawal (create, history, status) | ✅ |
| Admin Panel — dashboard, user mgmt, live monitoring, gift manager, coin packages, finance | ✅ |
| **Payment Gateway (Stripe)** — checkout session + webhook-verified coin crediting | ✅ |
| **Streaming tokens (Agora)** — real RTC token generation for host & viewers | ✅ |
| **Push Notifications (FCM)** + in-app notification history | ✅ |
| **User Reporting** — report users/lives + admin moderation queue | ✅ |
| **VIP Membership** — 10 tiers, purchase with coins, 30-day duration | ✅ |
| **Daily Tasks** — login/watch/gift/share, XP rewards | ✅ |
| **Lucky Wheel** — 1 free spin/day + paid spins, weighted coin prizes | ✅ |
| **Rankings** — top hosts (diamonds) & top spenders (coins), daily/weekly/all-time | ✅ |
| **Referral System** — unique referral code per user, coin reward on referred signup | ✅ |
| **PK Battle** — invite/accept/decline, live score tracking, winner determination | ✅ |
| **Multi-Guest Live** — invite/accept/leave/remove co-broadcasters on a host's channel | ✅ |
| **Chat Moderation** — keyword filtering + per-user rate limiting | ✅ |
| **Family System** — create/invite/accept/leave, member leaderboard by diamonds | ✅ |
| **Agency Dashboard** — manage hosts, per-host commission breakdown | ✅ |
| **Private / Paid Live** — entry-fee-gated lives, paid once per session | ✅ |
| **Live Replay** — attach/serve a playback URL + view count | ⚠️ storage/serving only — see note below |
| **Creator Analytics** — session count, avg viewers, followers, diamonds earned | ✅ |

### Google / Facebook Sign-In
`POST /auth/google` — body `{ idToken }`, the ID token from Google Sign-In on the client (not
an access token). `POST /auth/facebook` — body `{ accessToken }` from the Facebook SDK.

The server verifies the token with the provider (`google-auth-library` for Google, a Graph API
call for Facebook), then:
- If a user already has that `googleId`/`facebookId`, logs them in.
- Else if a user exists with the same email (e.g. they registered with phone+password before),
  links the social account to it.
- Else creates a new account (`phone` and `passwordHash` are both nullable now to support this).

`POST /auth/login` (phone+password) now explicitly rejects accounts with no password set,
pointing the client back to social sign-in instead of a confusing bcrypt error.

Set `GOOGLE_CLIENT_ID` (OAuth 2.0 client ID from Google Cloud Console — used as the token
audience) in `.env`. Facebook needs no server-side app secret for this flow since the Graph API
call itself validates the token; `FACEBOOK_APP_ID` is there for future use.

### Private / Paid Live
`POST /live/start` now accepts `isPrivate` and `entryFeeCoins`. Private lives are excluded from
the public `GET /live/list` feed (but still visible to admins via `GET /admin/live/active`).
Viewers should call **`POST /live/:id/join`** instead of `POST /streaming/join-token` directly —
it charges `entryFeeCoins` once per viewer per session (idempotent, same coin→diamond pattern as
gifts) and returns the same audience-role token. Free lives (`entryFeeCoins: 0`) skip the charge
entirely, so this endpoint is safe to use as the one join path for all lives, private or not.

### Live Replay
`POST /live/:liveSessionId/replay` (host-only) attaches a video URL; `GET
/live/:liveSessionId/replay` serves it and increments the view counter. **This does not record
video itself** — it's storage/serving only. Wiring real recording needs Agora's Cloud Recording
REST API (start alongside `live/start`, stop + fetch the file alongside `live/end`) with
credentials beyond `STREAMING_APP_ID` — that integration is still open; in the meantime any
external pipeline (or a recording webhook) can call the attach endpoint directly.

### Creator Analytics
`GET /analytics/creator/summary?since=<ISO date>` — total completed live sessions, average
peak viewers, follower count, total diamonds earned, total gifts received. `GET
/analytics/creator/history` — the host's own past live sessions.

### Payments (Stripe)
1. Client calls `POST /payments/checkout-session` with a `coinPackageId` → gets back a Stripe
   Checkout URL.
2. User pays on Stripe's hosted page.
3. Stripe calls `POST /payments/stripe/webhook` → server verifies the signature and credits
   coins via `WalletService.creditCoins`, which is **idempotent** on the Stripe session id (safe
   against webhook retries).
4. `wallet/admin/credit-coins` still exists for admin-only manual credits (refunds, goodwill).

You must register this exact webhook URL in your Stripe dashboard and set `STRIPE_WEBHOOK_SECRET`.

### Streaming (Agora)
`POST /live/start` now returns a real `streamToken` + `streamAppId` generated from
`STREAMING_APP_ID` / `STREAMING_APP_CERTIFICATE`. Viewers call `POST /streaming/join-token`
with the live session's `streamChannelName` to get their own (subscriber-role) token.
Swapping to ZEGOCLOUD/100ms later just means replacing `StreamingService` — nothing else
in the codebase needs to change.

### Push Notifications
Set the `FIREBASE_*` env vars to enable real pushes; without them, notifications are still
recorded in-app (`GET /notifications`) but no push is sent — useful for local dev.
Wired-up triggers: new follower, coins purchased, withdrawal approved, live started
(fanned out to all followers). VIP-expiring and PK-invitation notification types exist on the
enum, ready for Phase 2 features to call.

### Reports
`POST /reports` lets any authenticated user report a user, live session, or chat message.
Admins review via `GET /reports/admin/pending` and close out with
`PATCH /reports/admin/:id/resolve`.

### Phase 2 endpoints
| Area | Endpoints |
|---|---|
| VIP | `GET /vip/tiers`, `GET /vip/status`, `POST /vip/purchase` |
| Daily Tasks | `GET /tasks/today`, `POST /tasks/claim` — `daily_login` auto-claims on login/OTP verify, `send_any_gift` auto-claims on gift send |
| Lucky Wheel | `GET /lucky-wheel/prizes`, `GET /lucky-wheel/status`, `POST /lucky-wheel/spin` |
| Rankings | `GET /rankings/hosts?period=daily\|weekly\|all_time`, `GET /rankings/spenders?period=...` |
| Referrals | `GET /referrals/my-code`, `GET /referrals/my-referrals`. Pass `referredByCode` in `POST /auth/register` to attribute a signup. |
| PK Battle | `POST /pk/invite`, `POST /pk/:id/accept`, `/decline`, `GET /pk/:id/status` (live score), `POST /pk/:id/end` |
| Multi-Guest Live | `POST /live/:liveSessionId/guests/invite`, `/accept/:inviteId`, `/leave`, `DELETE /live/:liveSessionId/guests/:guestUserId`, `GET /live/:liveSessionId/guests` |

### PK Battle
Score is computed live by summing `GiftTransaction.diamondsCredited` per live session between
`startedAt` and now — no separate score counter to keep in sync. Winner is whoever has more
diamonds when `POST /pk/:id/end` is called (tie = no winner). Battle length is host-controlled
in Phase 1; a scheduled auto-timeout job is a natural Phase 3 addition.

### Multi-Guest Live
Guests join the **same Agora channel** as the host as an additional broadcaster/publisher —
`POST /live/:liveSessionId/guests/accept/:inviteId` returns a fresh host-role token for that
channel. Capped at 8 concurrent guests (`MAX_GUESTS_PER_SESSION` in `live-guest.entity.ts`).

### Chat Moderation
`ChatGateway` now rate-limits to 8 messages / 10s per user (`message_rejected` event with
`reason: 'rate_limited'`) and masks a configurable keyword list (`BLOCKED_KEYWORDS` in
`chat.gateway.ts` — swap for an admin-editable table or a moderation API before production).

### Family System
| Endpoints |
|---|
| `POST /family` (create, you become leader), `GET /family/:id` |
| `POST /family/:id/invite`, `/accept`, `/leave`, `DELETE /family/:id/members/:userId` |
| `GET /family/:id/members`, `GET /family/:id/leaderboard` (ranked by diamonds earned) |

A user can only belong to one active family at a time. The leader can't leave without
transferring leadership or disbanding first (not yet built — Phase 3).

### Agency Dashboard
| Endpoints |
|---|
| `POST /agency` (create, you become owner, default 10% commission) |
| `POST /agency/:id/invite-host`, `/accept`, `/leave`, `DELETE /agency/:id/hosts/:hostUserId` |
| `GET /agency/:id/hosts`, `GET /agency/:id/dashboard?since=<ISO date>` (owner-only) |

The dashboard sums each managed host's diamonds earned and applies the agency's
`commissionRate` — no separate ledger to keep in sync, same pattern as PK Battle scoring.
A host can only be actively managed by one agency at a time.

### Admin Panel endpoints (require JWT with `role: admin`)
| Area | Endpoints |
|---|---|
| Dashboard | `GET /admin/dashboard/overview` — total users, active lives, pending withdrawals, today's coin sales |
| User Management | `GET /admin/users/search?q=`, `PATCH /admin/users/:id/suspend`, `/ban`, `/reactivate`, `/verify` |
| Live Monitoring | `GET /admin/live/active`, `POST /admin/live/:id/emergency-stop` |
| Gift Manager | `GET/POST /admin/gifts`, `PATCH /admin/gifts/:id` |
| Coin Packages | `GET/POST /admin/coin-packages`, `PATCH/DELETE /admin/coin-packages/:id` |
| Finance | `GET /admin/finance/withdrawals`, `PATCH .../approve`, `/reject`, `/paid`, `GET /admin/finance/coin-sales` |
| Moderation | `GET /reports/admin/pending`, `PATCH /reports/admin/:id/resolve` |

To create your first admin: register normally, then manually set that user's `role` column
to `admin` in the database (`UPDATE users SET role = 'admin' WHERE phone = '...';`) — there's
no self-service admin signup by design.

## Not yet built (next steps)
- Actual video recording for Live Replay (Agora Cloud Recording integration — see note above)
- AI Translation, AI Caption, AI Moderation (all need a third-party AI/speech API + credentials
  not available in this environment — architecturally these would be additional services
  called from `ChatGateway` (captions/translation) and `LiveGuestsService`/`ChatGateway`
  (moderation), following the same pattern as `StreamingService` for Agora)
- Paid Video Call, Paid Voice Call (1:1, separate from group Live — not yet started)
- Flutter UI for Private/Paid Live, Live Replay, Creator Analytics (backend ready, UI is not)
- Migrations (currently using `synchronize: true` for fast Phase 1 iteration — switch to
  proper TypeORM migrations before production)

## Setup

Requires Node.js 20+, Docker (for local Postgres/Redis).

```bash
cp .env.example .env
docker compose up -d          # starts Postgres + Redis
npm install
npm run start:dev
```

The API will run on `http://localhost:3000`.

### Seed initial gift catalog
```bash
npx ts-node src/seed/seed-gifts.ts
```

## Example flow (curl)

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+8801700000000","password":"secretpass"}'

# 2. Check server console for the OTP code, then verify
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+8801700000000","code":"1234"}'
# -> returns accessToken + refreshToken

# 3. Use accessToken as Bearer token for authenticated routes
curl http://localhost:3000/me -H "Authorization: Bearer <accessToken>"

# 4. When accessToken expires, get a new pair without re-logging in
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## Project structure
```
src/
  auth/          register, login, OTP verify, JWT strategy
  users/         profile
  follow/        follow/unfollow
  wallet/        coin & diamond balance, buy coins, transaction history
  live/          go live / end live / list / multi-guest invite-accept-leave-remove
  chat/          Socket.IO gateway (namespace: /chat) — messages, gifts, moderation, PK/guest events
  gifts/         gift catalog + send-gift economy logic
  withdrawal/    withdrawal requests
  coin-packages/ public + admin-managed coin purchase packages
  payments/      Stripe checkout session + webhook (coin crediting)
  streaming/     Agora RTC token generation
  notifications/ in-app notification history + FCM push
  reports/       user/live reporting + admin moderation queue
  admin/         admin-only controllers (dashboard, users, live, gifts, coin packages, finance)
  vip/           VIP tiers config + purchase/status
  tasks/         daily tasks (login/watch/gift/share) + XP rewards
  lucky-wheel/   free + paid spins, weighted prize draw
  rankings/      top hosts / top spenders leaderboards
  referrals/     referral code generation + signup reward
  pk-battle/     PK battle invite/accept/decline/status/end
  family/        family create/invite/accept/leave + member leaderboard
  agency/        agency create/invite-host/accept/leave + commission dashboard
  replay/        live replay URL attach/serve + view count
  analytics/     creator dashboard summary + live session history
  config/        TypeORM datasource config
  common/        shared guards & decorators (JwtAuthGuard, RolesGuard, @Roles, @CurrentUser)
```

## Next session plan
1. Agora Cloud Recording integration for real Live Replay video
2. Flutter screens for Private/Paid Live, Live Replay, Creator Analytics
3. Paid Video Call / Paid Voice Call (1:1)
4. AI Translation / Caption / Moderation (needs a chosen third-party API)
5. Switch `synchronize: true` to proper TypeORM migrations before any production deploy
