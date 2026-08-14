## Project overview

IA369 GFactor is a factoring (recebíveis/duplicatas) back-office system: a Spring Boot backend and a React frontend, talking only over HTTP REST — there is no shared code or types between them. Domain: a **cedente** (client) submits **títulos** (receivables, usually parsed from NF-e duplicatas) grouped into a **borderô**; the system prices each título (deságio, ad valorem, IOF, tarifas) and produces a PDF borderô plus persisted `Bordero`/`Titulo` rows. The **sacado** is the payer/drawee of a título and is upserted automatically from the input data.

## Commands

### Database (Postgres via Docker/WSL2 — see `Infos.txt`)
- Root `.env` (gitignored) holds `DB_POSTGRES_USER`, `DB_POSTGRES_PASSWORD`, `VITE_API_URL`.
- Start: `.\start-db-wsl.bat` (runs `docker compose up -d` inside the WSL2 Ubuntu distro). Docker isn't reachable directly from a Windows/Git-Bash shell — prefix commands with `wsl`, e.g. `wsl docker ps`, `wsl docker exec ia369_db psql -U <user> -d ia369_factoring`.
- Host-facing port is **5369** (`docker-compose.yml` maps `5369:5432` — non-default, chosen to avoid clashing with another app's Postgres on the deployment server; the container still listens on 5432 internally). `application.yml`'s datasource URL must match: `jdbc:postgresql://localhost:5369/ia369_factoring`.

### Backend (`backend/`, Java 17, Maven, Spring Boot 3.2.5)
- `FactoringApplication.main()` hand-rolls a dotenv loader that reads `.env`, falling back to `../.env` — so running `mvn spring-boot:run` from `backend/` picks up the root `.env` automatically; no need to export `DB_POSTGRES_USER`/`DB_POSTGRES_PASSWORD` by hand as long as the working directory is `backend/`.
- Run dev server (port **8369**, non-default — same reason as the DB port above): `mvn spring-boot:run`
- Compile: `mvn compile`
- All tests: `mvn test`
- Single test class: `mvn test -Dtest=PricingEngineTest`
- Single test method: `mvn test -Dtest=PricingEngineTest#floatingDeveSerAplicadoApenasDepoisDoAjusteParaDiaUtil`
- Migrations live in `backend/src/main/resources/db/migration` (Flyway, `V<n>__Description.sql`). There is no flyway-maven-plugin configured — migrations only run when the app boots (Spring Boot's Flyway autoconfiguration), not via a standalone `flyway:migrate` goal. Before adding a new `V<n>`, check the live DB's `flyway_schema_history` against the files actually committed — this repo's local dev DB has drifted before (a migration applied locally that was never committed), which surfaces as a Flyway checksum/"not resolved locally" error on next boot.

### Frontend (`frontend/`, React 18 + Vite + Tailwind)
- `npm install`, `npm run dev` (port 3000), `npm run build`, `npm run preview`.
- No lint or test script is configured.
- Talks to the backend at `VITE_API_URL` (default `http://localhost:8369/api`); `vite.config.js` sets `envDir: '../'` so it also reads the root `.env`.

### Production deploy (single `docker compose up`, e.g. the OCI server)
`docker-compose.yml` now builds and runs all three services — `db`, `backend`, `frontend` — so `docker compose up -d --build` from repo root is the entire deploy. No local Maven/Node install needed on the server, only Docker.
- `backend/Dockerfile`: multi-stage Maven build → `eclipse-temurin:17-jre-alpine` runtime. Talks to `db` over the internal compose network (`SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/...`, set as an env var in `docker-compose.yml` — this overrides `application.yml`'s `localhost:5369` value since Spring env vars win over yml). Published on host port 8369 mainly for debugging (e.g. `curl`/Postman); the browser never talks to it directly.
- `frontend/Dockerfile`: multi-stage `npm run build` (with `VITE_API_URL=/api` baked in as a **relative** path, not the server's IP) → served by `nginx:alpine`. `frontend/nginx.conf` reverse-proxies `location /api/` to `http://backend:8369/api/` over the internal network, so the whole app is reachable through **one public port**: host `3369` → container `80`.
- Because `VITE_API_URL` is relative, the built frontend image is portable across hosts/IPs/domains without a rebuild — only port 3369 needs to be opened in the OCI security list/firewall; 8369 and 5369 can stay internal-only.
- Host port **3369**, not 3000: on the shared OCI instance this project deploys to, 3000 is already taken by another app (`qr369-frontend`), and that other app's project also owns the box's only system-level nginx vhost (`default_server` on port 80 for the bare IP) — so this project is reached as `http://<host>:3369` directly, with no nginx involved on the host side at all. Check `docker ps`/`ss -tlnp` on the target host before assuming any port is free.
- `db`'s healthcheck (`pg_isready`) gates `backend`'s startup (`depends_on: condition: service_healthy`) so Flyway never races an unready Postgres.
- Root `.env` (same one used for local dev) still supplies `DB_POSTGRES_USER`/`DB_POSTGRES_PASSWORD` — compose auto-loads it for `${...}` substitution. Copy/create that `.env` on the server (it's gitignored, so it doesn't come with `git clone`).

## Architecture

### Pricing pipeline (read this before touching any money math)
The calculation core is `PricingEngine`, used two different ways depending on how many títulos are being priced at once:
- `PricingController` (`POST /api/pricing/simulate`, backs `SimuladorForm.jsx`) prices exactly **one** título per call.
- `BorderoService` prices **all títulos of a borderô** in a loop, one `PricingEngine.calculate()` call per título.

`PricingEngine.calculate()` has two overloads and they are **not interchangeable**:
- One takes a pre-allocated `BigDecimal` tarifa share — this is the one `BorderoService` must use.
- One takes the raw `List<TarifaCustomizada>` and sums it directly — safe **only** for a single-título simulation.

Passing the raw list into the multi-título loop applies the full tarifa sum to *every* título instead of once per borderô — a real bug that was fixed here. `BorderoService` now rateia `TarifaCustomizada` by its `tipoCobranca` before calling the engine: `TITULO` charges the full value on every título, `BORDERÔ` is charged once and split pro-rata by valor de face across all títulos in the borderô, `NOTA_FISCAL` is charged once per distinct nota (grouped by `chaveNfe`, falling back to sacado+dataEmissao when absent) and split pro-rata within that nota.

Other rules baked into `PricingEngine`/`CalendarService`, don't casually change them:
- Vencimento is resolved in three steps, in order: `nextBusinessDay(vencimento bruto)` (data-base) → `+ floatBancario` dias → `nextBusinessDay` again. Collapsing this into a single adjustment silently shifts prazo/deságio/IOF by up to a few days.
- Money rounding is `HALF_UP` everywhere (Brazilian commercial convention), not `HALF_EVEN`.
- `contagemDiasUteis` (on `ParametrosTaxas`, per operation) toggles day counting between dias corridos (`ChronoUnit.DAYS`) and dias úteis (`CalendarService.calculateBusinessDays`); default is dias corridos.
- `CalendarService` hardcodes national holidays for a single specific year in Java code — it needs a code change (not just config) to remain correct in a following year.

### Settings are effectively global, not per-cedente
`ConfiguracoesController` persists a single `ParametrosTaxas` row (`cedenteId` hardcoded to `"DEFAULT"`) and a flat list of `TarifaCustomizada`. `EmpresaCedente.taxaPadraoDesagio` exists on the client record but the pricing flow does not read it — rates come from the global `ParametrosTaxas`/simulate-request payload, not from the cedente being operated on.

### Frontend has no router and no component library
`App.jsx` is a single page that swaps between feature screens (`SimuladorForm`, `GerarBordero`, `Configuracoes`, `Clientes`) via local `useState`, driven by `Sidebar`. Each file under `frontend/src/components/` is a full feature screen with its own `axios`/`fetch` calls inlined — there's no reusable UI kit, just a thin Tailwind layer (the `matrix-*` color palette in `tailwind.config.js` plus `.brutalist-card`/`.brutalist-input`/`.brutalist-button` utility classes in `index.css`).

`GerarBordero` (the "Operações" tab) unifies all input methods from `docs/SistemaFactoring.pdf`'s ESCOPO DO SISTEMA that are currently implemented — XML de NF-e (parsed client-side via `DOMParser`), CSV (`papaparse`), Excel (`exceljs`) and manual entry — into one flat item list with a shared "Processar e Gerar o Borderô" action. Items from different sources can be mixed in the same borderô. PDF/JPG/PNG (vision-AI extraction) are not implemented yet. POSTs the items plus the current settings to `/api/bordero/generate`, which returns the borderô PDF and persists `Bordero` + `Titulo` rows in the same call.

### Known rough edges
- `Titulo.chaveNfe` has a `UNIQUE` DB constraint, but one NF-e can produce multiple duplicatas/títulos sharing the same chave. `BorderoService` deliberately does **not** persist `chaveNfe` on `Titulo` (it would violate the constraint); it only uses it in memory to group `NOTA_FISCAL`-scoped tarifas.
- `AuditoriaSistema` is a JPA entity with no repository, service, or controller wired to it — audit logging is modeled but not implemented.
