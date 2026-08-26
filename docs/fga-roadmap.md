# Auth0 FGA + Permissions Index roadmap

This document is the architecture reference for an incremental effort to add fine-grained
authorization to SaaStart. It is delivered as a chain of small, independently useful increments;
this file describes the destination so each increment can be read in context.

**Status:** increment 1 of 9 (the AI Agents section) is implemented. Everything else below is design.

| # | Increment | Adds | State |
| --- | --- | --- | --- |
| 1 | AI Agents section | Capability detection, conditional nav, register/list/delete agents in Auth0 | **done** |
| 2 | Postgres + documents domain | `docker-compose`, migrations, folders/documents, search page, seed. Authz still RBAC | planned |
| 3 | FGA store, model, client | Model (with `agent` from day one), `fga-bootstrap.mjs`, document authz via Check/ListObjects | planned |
| 4 | Auth0 → FGA sync | `syncOrganization` reconciler, worker interval, log-stream webhook, in-app hooks | planned |
| 5 | Permissions Index consumer | NDJSON stream worker, apply, cursor, freshness tracking | planned |
| 6 | Index-backed search | The SQL JOIN, freshness gate, FGA fallback, staleness banner | planned |
| 7 | Org gates to FGA | `withServerActionAuth` + org layout stop trusting the token claim | planned |
| 8 | Agent grants + review job | Local agent registry, folder-scoped grants, token verification, review API, `agent-run.mjs` | planned |
| 9 | Ops page, Okta wiring, README | Authorization ops surface, full Okta setup docs, `verify-chain.mjs` | planned |

Two sequencing constraints that are easy to get wrong:

- **The FGA model must include the `agent` type from its first write (increment 3)**, before anything
  uses it. Adding a type later produces a new authorization model id, and the Permissions Index is
  attached to a specific model — re-attachment is a manual step in Developer Preview. Including
  `agent` up front avoids paying that cost twice.
- **Increment 7 must come after increment 4.** Enforcement cannot move to FGA until the tuples that
  grant admin already exist, or admins lock themselves out of the settings area.

## Why this work

SaaStart today has **coarse authorization**: `lib/roles.ts` reads a single role string out of a token
claim (`{CUSTOM_CLAIMS_NAMESPACE}/roles`, populated by `actions/add-role-to-tokens.js`), and
`lib/with-server-action-auth.ts` gates mutations on `getRole(session.user) !== "admin"`. There is **no
database** — all state lives in Auth0 Organization `metadata`. There are **no app-owned resources** to
authorize, and **nothing ingests events from Auth0**.

Two consequences:

1. There is nothing for fine-grained authorization to *act on*. FGA needs objects.
2. Because the role lives in a token claim, **an identity change cannot take effect until the user logs
   in again** — which breaks the exact story we want to tell.

**Goal:** change a user in Okta Workforce → SCIM into Auth0 → Auth0 state synced to Auth0 FGA as
relationship tuples → the FGA Permissions Index streams flattened expansions into local Postgres →
SaaStart authorizes against that index with a SQL JOIN, falling back to FGA when the index is stale.
Plus AI agents as first-class principals in the same model.

**It must read as a real product, not a demo.** Every surface is one a real document-collaboration SaaS
would have; the observability needed to show the pipeline working is delivered as a genuine ops page
and a genuine degraded-state banner.

## Decisions

| Decision | Choice |
| --- | --- |
| Resource domain | Documents + folders + permission-filtered full-text search |
| Database | Postgres via `docker-compose`, raw `pg` + `.sql` migrations (no ORM — the SQL *is* the point) |
| Permissions Index | Real Developer Preview stream, colocated in the app's Postgres |
| Auth0 → FGA | We write tuples ourselves (native sync beta not yet available) |
| FGA scope | New document domain **and** the existing org-settings admin gates |
| Setup automation | Auth0 + FGA scripted; Okta side documented step-by-step |
| Agents | Auth0 **Agents as Principal**, autonomous (client credentials), read-only review job, real Agents admin page |

## Demo beats

1. **Okta group → SaaStart admin.** Move a user into/out of an Okta group; their admin access to
   `/dashboard/organization/*` changes **without re-login**.
2. **Deactivate / unassign in Okta.** SCIM sets the user inactive in Auth0; every FGA tuple for them is
   revoked; their document list and search results go empty.
3. **In-app share.** Sharing a document writes a tuple directly; it appears in the recipient's index
   within seconds.
4. **Agent as a first-class principal.** Grant the demo agent (registered through the SaaStart AI Agents
   page, so its `agt_…` id is whatever that registration returned) viewer access to one folder; the
   agent authenticates as itself, and its review pass covers exactly those documents — resolved through
   the same Permissions Index, and denied on every write it attempts. Revoke the grant and the next run
   sees nothing.

## Architecture

```
Okta Workforce
  │  app profile mapping:  isMemberOfGroupName("SaaStart Admins") ? "admin" : "member"  →  title
  │  SCIM 2.0 push (/Users only)
  ▼
Auth0  ─ Enterprise connection (SCIM enabled) ─ Organization membership + user profile
  │
  │  lib/fga/sync.ts · syncOrganization(orgId) · read desired ← Auth0, read actual ← FGA, write delta
  │  triggers: (a) POST /api/sync/auth0 log-stream webhook  (b) worker interval  (c) in-app mutations
  ▼
Auth0 FGA store  ── relationship tuples
  │
  │  Permissions Index expansion stream (INSERT / DELETE / freshness / heartbeat)
  ▼
Postgres  ·  permissions_index (flattened)  +  documents / folders (app data)  +  index_state
  │
  │  single SQL JOIN, tenant-scoped by documents.org_id
  ▼
SaaStart  ·  search & lists ← index (fast path)   ·  open & sensitive actions ← FGA Check (truth)
  ▲
  │  Authorization: Bearer  (sub = agt_…, sub_profile = ai_agent)
  │
Agent  ──  client credentials against the SaaStart API  ──  subject `agent:agt_…` in FGA
```

Human and agent principals converge on one authorization layer: `permissions_index.subject_type` is a
generic column, so `agent:` expansions land in the same table and the same SQL JOIN serves both. No
parallel agent authorization path exists — that is the point of modeling agents as principals.

### Why a reconciler rather than event-to-tuple translation

Auth0's inbound SCIM writes users through internal Management API operations; deriving precise tuple
deltas from log-stream event bodies is brittle and unverifiable. `syncOrganization(orgId)` is instead
**idempotent and self-healing**: read desired state from Auth0 (members, org roles, role/team profile
attributes, `blocked` status), read actual tuples from FGA, diff, write only the delta. The webhook
makes it fast; the interval makes it correct; in-app mutations make it instant. When the native
Auth0↔FGA sync beta lands, this one module is deleted and everything downstream is unchanged.

### Why Okta group membership travels as a profile attribute

Auth0's inbound SCIM centres on `/Users`, so Okta **Push Groups** is not a dependency we can rely on.
Okta app profile mappings support Okta Expression Language, so group membership is projected into a
standard SCIM Core User attribute that Auth0 maps:

```
isMemberOfGroupName("SaaStart Admins") ? "admin" : "member"   →   title
user.department                                                →   department
```

The Auth0 field the sync reads is **configurable** (`OKTA_ROLE_ATTRIBUTE`, default `title`;
`OKTA_TEAM_ATTRIBUTE`, default `department`), so a different SCIM mapping is an env change, not a code
change. **Verify the actual mapping in the Auth0 SCIM config before relying on a specific field** —
this is the least-verified assumption in the design.

### Agent identity chain

Agents as Principal separates identity from credentials: the agent is registered as its own object but
authenticates through an associated M2M client. That maps onto four Auth0 objects SaaStart does not
have today — notably, the repo defines **no resource server at all**, so there is currently no audience
an agent could even request a token for:

| Object | How created | Why |
| --- | --- | --- |
| `SaaStart API` resource server | `POST /api/v2/resource-servers` with `agent_subject_claims: 'auth0-v1'` | Gives the agent an audience, and opts the API into `sub_profile` / `client_profile` claims |
| `SaaStart Agent Runtime` M2M client | `auth0 apps create --type m2m` | The credentials the agent actually authenticates with |
| Agent object | `POST /api/v2/agents` (`name`, optional `external_agent_id`, `metadata`) | Yields the stable `agt_…` identifier |
| Client association | `PATCH /api/v2/clients/{id}` with `{ "agent_id": … }` | Binds the agent identity to those credentials |

The association is stored **on the client object**, not the agent, and one agent may be associated with
many clients (per-environment or per-region credentials sharing one logical identity). Dissociate by
setting `agent_id: null`; already-issued tokens stay valid until expiry. Auth0 does **not** support the
`jwt_bearer` grant for agent-linked clients, which rules out private-key-JWT for the agent runtime.

Autonomous client-credentials issuance produces a token with `sub_profile = ai_agent` and
`client_profile = service ai_agent`, and Auth0 writes the agent id to tenant logs on every issuance —
the audit trail is Auth0's, not something SaaStart invents.

**The FGA subject is the token subject, not the `agent_id`.** When `external_agent_id` is set it
replaces `agent_id` in `sub` and `act.sub`, while `agent_id` remains the Management API key — so the two
can differ. `lib/agents/subject.ts` maps to `agent:{tokenSubject}` (the `tokenSubject` derived in
`lib/auth0-agents.ts`, increment 1), and every tuple write, `check`, and `permissions_index.subject_id`
comparison uses that same value. Keying FGA off `agent_id` instead would yield an agent that
authenticates successfully and matches no tuple — a silent, total denial that looks like a grant bug.
The local `agents` table therefore stores both columns.

**Verification order matters.** `lib/agents/verify-token.ts` treats *our own registry as authoritative*:
the token's `sub` must match an `agents.token_subject` row for the current org, on top of standard JWKS /
`iss` / `aud` / `exp` checks. `sub_profile === "ai_agent"` is asserted as defense-in-depth **when
present**, and its absence is logged, not rejected. Agents as Principal is Early Access and
`agent_subject_claims` is opt-in per resource server, so keying authorization off a claim that may not
be configured would fail closed for a config reason rather than a security one. Equally, `sub_profile`
is documented as taking any of `user` / `ai_agent` / `service` / `browser_app` / `native_app`, so no
code may assume `sub` denotes a user — `client_profile` is also multi-valued and space-separated
(`service ai_agent`), so it must be tokenized, not compared with `===`.

**Early Access degradation.** `POST /api/v2/agents` 403/404s on a tenant without the feature. Increment
1 detects this and reports it distinctly from a missing Management API scope (see
`lib/auth0-agents.ts`). Later increments accept a pre-existing id via `DEMO_AGENT_ID` — so FGA tuples,
the review job, and the admin page all work before the registration API is reachable. Only `sub_profile`
and the tenant-log audit trail depend on EA being on.

### Agents and organizations

SaaStart puts every user in an Auth0 Organization, but **an agent cannot be an organization member**.
Agents are tenant-level objects: `GET /api/v2/agents` returns every agent in the tenant with no org
dimension. Increment 1 therefore carries org assignment in the agent's `metadata.org_id` and enforces
scoping in application code (`lib/auth0-agents.ts`). From increment 8, the local `agents.org_id` column
and an FGA `agent:… member organization:…` tuple become authoritative — the model below already declares
`organization.member: [user, agent]` for exactly this — and the metadata survives as a human-readable
label in the Auth0 dashboard rather than as an access-control input.

## Permissions Index stream contract

`ReadExpansions` is a long-lived **NDJSON** GET through the SDK's escape hatch:

```ts
const resp = await fgaClient.executeStreamedApiRequest({
  operationName: "ReadExpansions",
  method: "GET",
  path: "/stores/{store_id}/indexes/{index_id}/expansions",
  pathParams: { store_id: FGA_STORE_ID, index_id: FGA_INDEX_ID },
  queryParams: { authorization_model_id: FGA_MODEL_ID, ...(cursor && { from: cursor }) },
})
```

Three properties drive the consumer's design:

1. **The server closes every connection at 5 minutes** with
   `result.closed.reason = STREAM_CLOSED_REASON_CONNECTION_LIFETIME_EXCEEDED`. Reconnection is the
   *normal* steady state, ~288×/day — not an error path. A `closed` event reconnects immediately from
   the saved cursor with no backoff and no error logging; only a failed *reconnect attempt* enters
   backoff or flips `connected = false`. Getting this wrong either spams errors every 5 minutes or
   makes the ops page flap red.
2. **No `from` means replay from the beginning of the index.** The cursor must be persisted in the same
   transaction as the rows it produced, or a crash re-replays (harmless — `ON CONFLICT` is idempotent)
   or skips (not harmless). Every event carries its own `from`.
3. **NDJSON needs a real line splitter.** Chunk boundaries fall mid-line, so the reader buffers partial
   lines across chunks — the single most likely source of a silently-dropped permission.

Event shapes: `result.event` (`operation` is `EXPANSION_OPERATION_INSERT` | `..._DELETE`),
`result.freshness.as_fresh_as`, `result.heartbeat` (keepalive), `result.closed` (reconnect),
`result.error` (log + backoff). `subject_relation` is **absent** on direct-user expansions and present
on set-relation ones (e.g. `team#member`) — hence the `''` default on that primary-key column rather
than allowing NULL, which would break the upsert.

Freshness uses `now() - max(latest_tuple_written_at, latest_as_fresh_as)` rather than `as_fresh_as`
alone, so an active write burst is reflected between freshness events.

Model features the Permissions Index does not support, and which the model below therefore avoids
entirely: conditions, contextual tuples, and wildcards on the left side of `but not`.

## FGA authorization model

`fga/model.fga` — deliberately free of every construct the Permissions Index does not yet support, so
the whole model sits on the indexable path. **Written with `agent` included from the first write.**

```
model
  schema 1.1

type user

type agent

type organization
  relations
    define member: [user, agent]
    define admin: [user]
    define can_view_organization: admin or member
    define can_manage_organization: admin

type team
  relations
    define organization: [organization]
    define member: [user, agent]

type folder
  relations
    define organization: [organization]
    define parent: [folder]
    define owner: [user]
    define editor: [user, agent, team#member] or owner or admin from organization or editor from parent
    define viewer: [user, agent, team#member] or editor or viewer from parent
    define can_view: viewer
    define can_edit: editor
    define can_create_document: editor

type document
  relations
    define organization: [organization]
    define folder: [folder]
    define owner: [user]
    define editor: [user, agent, team#member] or owner or admin from organization or editor from folder
    define viewer: [user, agent, team#member] or editor or viewer from folder
    define can_view: viewer
    define can_edit: editor
    define can_share: editor
    define can_delete: owner or admin from organization
```

`organization#member` grants **no** document access. Access comes only from team membership, direct
shares, folder inheritance, and org admin — otherwise every member sees every document, the index has
nothing interesting in it, and the revocation beats show nothing. `organization` is set on every folder
and document (not just roots) so org-admin reach doesn't depend on walking to a root.

Following Auth0's agent modeling guidance, `agent` is added as an allowed subject exactly where `user`
already appears **for the relations an agent should hold**, and nowhere else:

- `admin` and `owner` stay `[user]`-only, so `can_delete` (= `owner or admin from organization`) admits
  no agent. **No tuple exists that could let an agent delete a document** — the denial is a property of
  the model, not of a grant we remembered to withhold.
- The demo agent gets only `viewer` on a single folder — narrowest useful scope. The model permits
  editor agents; the grant doesn't use it.
- No `agent:*` wildcards.

Tuples the sync maintains per org member: `member`/`admin` on `organization:{orgId}` (unless blocked),
and `member` on `team:{orgId}__{slug(department)}` when the team attribute is present.

## Database schema

`001_init.sql`

```sql
create table folders (
  id          text primary key,
  org_id      text not null,
  parent_id   text references folders(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index folders_org_idx on folders (org_id, parent_id);

create table documents (
  id          text primary key,
  org_id      text not null,
  folder_id   text not null references folders(id) on delete cascade,
  title       text not null,
  body        text not null default '',
  owner_sub   text not null,
  updated_at  timestamptz not null default now(),
  search_tsv  tsvector generated always as (
                to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
              ) stored
);
create index documents_search_idx on documents using gin (search_tsv);
create index documents_org_idx    on documents (org_id, folder_id);
```

`002_permissions_index.sql`

```sql
create table permissions_index (
  subject_type      text not null,
  subject_id        text not null,
  subject_relation  text not null default '',
  object_type       text not null,
  object_id         text not null,
  relation          text not null,
  tuple_written_at  timestamptz not null,
  primary key (subject_type, subject_id, subject_relation, object_type, object_id, relation)
);
create index pi_subject_lookup on permissions_index (subject_type, subject_id, relation, object_type);
create index pi_object_lookup  on permissions_index (object_type, object_id, relation);

create table index_state (
  id                      int primary key default 1 check (id = 1),
  cursor                  text,
  latest_tuple_written_at timestamptz,
  latest_as_fresh_as      timestamptz,
  last_event_at           timestamptz,
  connected               boolean not null default false,
  updated_at              timestamptz not null default now()
);
insert into index_state (id) values (1) on conflict do nothing;
```

`003_agents.sql`

```sql
-- Local registry of Auth0 agent principals. Authoritative for token verification:
-- a bearer token's `sub` must match a row here for the org it is acting in.
-- Agents cannot be Auth0 organization members, so org assignment lives here (and, from increment 8,
-- as an FGA `agent:… member organization:…` tuple). Before that it is carried in Auth0 metadata.org_id.
create table agents (
  id            text primary key,        -- Auth0 agent_id, e.g. agt_j4diXk4FeAB39mYczM3NmS
  token_subject text not null unique,    -- external_agent_id ?? agent_id — matches the token `sub`
  org_id        text not null,
  name          text not null,
  description   text,
  created_at    timestamptz not null default now(),
  last_run_at   timestamptz
);
create index agents_org_idx   on agents (org_id);
create index agents_token_idx on agents (token_subject);
-- Token verification looks up by token_subject; the Management API is addressed by id. Keep both.

create table agent_runs (
  id                bigserial primary key,
  agent_id          text not null references agents(id) on delete cascade,
  org_id            text not null,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  documents_scanned int not null default 0,
  findings_count    int not null default 0,
  authz_source      text,                -- 'index' | 'fga'
  error             text
);

create table agent_findings (
  id          bigserial primary key,
  run_id      bigint not null references agent_runs(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  kind        text not null,             -- 'missing_owner' | 'stale' | 'empty_body'
  detail      text,
  created_at  timestamptz not null default now()
);
create index agent_findings_run_idx on agent_findings (run_id);
```

**Tenant isolation:** expansion events carry no org, so `permissions_index` is not tenant-scoped on its
own. Every read **must** JOIN to `documents`/`folders` and filter on `org_id` from the session (or, for
agent requests, the org of the verified `agents` row). Hard rule, asserted in the query module's doc
comment.

## Modules

**Infrastructure** — `docker-compose.yml` (Postgres 17 only); `db/migrations/*.sql` +
`scripts/migrate.mjs` (ordered-file runner, `_migrations` table, no ORM); `lib/db.ts` (single `pg.Pool`
cached across dev HMR via a `globalThis` singleton, or you leak pools on every reload).

**FGA** — `fga/model.fga`; `lib/fga/client.ts` (`@openfga/sdk` `OpenFgaClient` with
`CredentialsMethod.ClientCredentials`, module singleton mirroring how `lib/auth0.ts` exports
`managementClient`; the same instance serves `check`/`listObjects`/`write` and the stream call);
`lib/fga/tuples.ts` (typed constructors so tuple strings are never hand-built);
`lib/fga/sync.ts` (`syncOrganization` / `syncUser`, diffing Auth0 against `fga.read` into one batched
`fga.write`).

**Permissions Index** — `types.ts` (discriminated union over the five `result.*` payloads, so the
consumer's switch is exhaustive at the type level); `stream.ts` (`openExpansionStream(cursor, signal)`
as an `AsyncIterable`, plus the NDJSON line reader); `apply.ts` (upsert/delete batched per transaction,
cursor advanced in the same transaction); `freshness.ts` (`readFreshness()` computing freshness **at
read time** — a dead worker stops advancing its own stored number, so a precomputed value would lie —
returning `{ usable, freshnessSeconds, state: "fresh" | "backfilling" | "lagging" | "disconnected" }`,
where `backfilling` is distinguished by `as_fresh_as` advancing while `tuple_written_at` stays far
behind, the cold-start signature).

**Worker** — `workers/main.ts`: the index consumer (immediate reconnect on the routine 5-minute
`closed`, exponential backoff only on genuine failure, always resuming from the persisted cursor) plus
the Auth0→FGA reconcile interval, with graceful shutdown.

**Authorization** — `lib/authz/check.ts` (`can(subject, relation, object)` → FGA `check`, where
`subject` is `{ type: "user" | "agent", id }`; plus `canAll` over `batchCheck`);
`lib/authz/list.ts` (`listAccessible` → `listObjects`, the fallback path);
`lib/with-server-action-auth.ts` gains an `orgPermission?: string` option ("`user:{sub}` must have
`{orgPermission}` on `organization:{org_id}`") with the existing `role` option left working so the
change is additive; the org layout and the `actions.ts` files under `app/dashboard/organization/**`
switch `{ role: "admin" }` → `{ orgPermission: "can_manage_organization" }`; `members/actions.ts` also
calls `syncUser` after `updateRole`/`removeMember` so in-app changes hit FGA immediately.

`lib/roles.ts` and the post-login Actions **stay**. Auth0 remains where roles are *assigned*; FGA
becomes where access is *decided*. That split is the point, and it keeps the SaaStart features people
fork this repo for.

**Documents** — `lib/documents/queries.ts` is the centrepiece:

```sql
-- fast path: business data and permissions in one query
select d.id, d.title, d.updated_at,
       ts_headline('english', d.body, websearch_to_tsquery('english', $4)) as snippet
  from documents d
  join permissions_index p
    on p.object_type = 'document' and p.object_id = d.id
   and p.relation = 'can_view'
   and p.subject_type = $2                 -- 'user' or 'agent' — one path for both principals
   and p.subject_id = $3
   and p.subject_relation = ''
 where d.org_id = $1                       -- tenant scope: never omit
   and d.search_tsv @@ websearch_to_tsquery('english', $4)
 order by ts_rank(d.search_tsv, websearch_to_tsquery('english', $4)) desc, d.updated_at desc
 limit $5 offset $6
```

When `readFreshness()` reports unusable, the same function falls back to `listAccessible` + a
`where d.id = any($ids)` variant. Both paths return an identical shape plus
`{ authzSource: "index" | "fga", freshnessSeconds }`. `searchDocuments` and `listVisibleDocuments` take
the subject as `{ type, id }` rather than a bare user id — the `subject_type` parameter is already in
the SQL, so agent visibility costs one argument and zero extra query paths, which is what lets the
agent review job reuse the human read path verbatim.

`lib/documents/mutations.ts` writes app rows **and** the corresponding FGA tuples.
`app/dashboard/documents/` holds the list, `search/`, and `[documentId]/` (FGA `check` on open;
404-shaped "not found" rather than a leaky 403), plus colocated actions and components. All new UI
reuses `PageHeader`, `SidebarNav`, `SubmitButton`, `Card`, `Table`, `Dialog`/`AlertDialog`, `Select`,
`sonner`, and the established server-action convention.

**Agents** — `lib/agents/verify-token.ts` (JWKS via `jose`, registry-authoritative `sub` resolution);
`lib/agents/subject.ts` (the single place mapping a verified agent to `agent:{tokenSubject}`);
`lib/agents/review.ts` (the review job, calling `listVisibleDocuments` with an `agent:` subject rather
than a bespoke query; scans for `missing_owner`, `stale` >90 days, `empty_body`; writes `agent_runs` +
`agent_findings` and records which path resolved visibility);
`app/api/agent/review/route.ts` (bearer-authenticated `POST`; 401 for an unverifiable token, 403 when
the agent holds no grants — "not who you claim" vs "nothing you may see"); the AI Agents page gains
folder-scoped grants writing FGA tuples, revoke, and run history; `scripts/agent-run.mjs` (stands in for
the agent: client-credentials grant, prints decoded token claims so `sub`/`sub_profile` are visible,
calls the review route, then attempts one `DELETE` to show FGA refusing a write no tuple could grant).

**Ops page** — `app/dashboard/organization/authorization/page.tsx`, a tab in the org settings nav:
index freshness (live), consumer connection state, indexed-row and tuple counts, last reconcile result,
and an access explorer showing index results beside FGA `listObjects` — the drift view that makes
eventual consistency legible. The staleness banner renders **only when degraded** ("Results may not
reflect recent permission changes") — correct product behaviour, and demonstrable by pausing the worker.

**Sync endpoint** — `app/api/sync/auth0/route.ts`: verifies a shared secret against
`AUTH0_LOG_STREAM_SECRET`, extracts affected org/user ids from the log-stream batch, calls
`syncOrganization`/`syncUser`, and always returns 200 quickly so Auth0 doesn't retry-storm. Errors are
logged; the interval reconcile is the backstop.

**Setup** — `scripts/fga-bootstrap.mjs` (create store, transform `model.fga` via
`@openfga/syntax-transformer`, write model, append env, print the index-creation request, verify the
stream opens); `scripts/bootstrap.mjs` extended with the resource server
(`agent_subject_claims: 'auth0-v1'`), the agent-linked M2M client, and agent association;
`scripts/seed.mjs`; `scripts/update-client-grant.mjs` (already added in increment 1, and reused by every
later increment that needs new Management API scopes).

The scope list the Management client needs lives in `scripts/management-api-scopes.mjs`, shared by
`bootstrap.mjs` and `update-client-grant.mjs`. **Later increments add scopes there and nowhere else** —
two copies of that list would silently disagree about what a bootstrapped tenant is missing.

New dependencies: `pg`, `@types/pg`, `@openfga/sdk`, `@openfga/syntax-transformer`, `jose`, `tsx`,
`concurrently`. New scripts: `worker`, `dev:all`, `db:migrate`, `db:seed`, `fga:bootstrap`,
`agent:run`, `verify:chain`.

New env vars: `DATABASE_URL`, `FGA_API_URL`, `FGA_STORE_ID`, `FGA_MODEL_ID`, `FGA_INDEX_ID`,
`FGA_API_TOKEN_ISSUER`, `FGA_API_AUDIENCE`, `FGA_CLIENT_ID`, `FGA_CLIENT_SECRET`,
`MAX_ACCEPTABLE_FRESHNESS_SECONDS` (10), `AUTH0_FGA_SYNC_INTERVAL_SECONDS` (10),
`AUTH0_LOG_STREAM_SECRET`, `OKTA_ROLE_ATTRIBUTE` (`title`), `OKTA_TEAM_ATTRIBUTE` (`department`),
`AUTH0_API_IDENTIFIER`, `AGENT_CLIENT_ID`, `AGENT_CLIENT_SECRET` (used by `agent-run.mjs`, never the
app), `DEMO_AGENT_ID`. `AUTH0_AGENTS_ENABLED` already exists from increment 1.

`FGA_INDEX_ID` is the one value no script can produce — index creation is manual in Developer Preview.

## Verification (whole chain)

`scripts/verify-chain.mjs` is the single command that proves the pipeline: write a tuple via FGA, poll
`permissions_index` until the expansion lands, print observed end-to-end latency, delete it, confirm
removal.

Manual walkthrough: baseline list/search; the four demo beats; agent-cannot-escalate (`check(agent,
can_delete, doc)` is `false` and no tuple could change it; a token for a different audience is
rejected); freshness fallback (stop the worker → banner appears, results served via `listObjects`, still
**correct**); new-enemy check (worker stopped, revoke a share, click the document — the list may still
show it, the `check` on open denies); tenant isolation for both user and agent subjects; stream
lifecycle (run past 10 minutes across two server-initiated closes with no error noise and no gap, then
`kill -9` and confirm cursor resume rather than replay from zero).

The repo has **no test framework**, and the chain does not add one. Three places are pure enough to test
properly and are where a silent bug would be expensive: `lib/fga/sync.ts` (diff logic),
`lib/permissions-index/apply.ts` (event → SQL), and `lib/agents/verify-token.ts` (a bug here is a
security bug, not a correctness bug).

**Cold-start caveat:** a newly created index replays the store's full history, so `tuple_written_at`
starts far behind and computed freshness looks enormous. Documented backfill behaviour, not a bug — the
ops page reports `backfilling` rather than `lagging`, and the index should be allowed to catch up before
the first walkthrough, or the very first thing anyone sees is a staleness banner and an FGA fallback.
