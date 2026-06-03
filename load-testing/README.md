# MoneyGence — Load Testing & QC Test Suite

This directory contains Artillery load tests targeting `https://moneygence.com`.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| Artillery | ≥ 2.x | `npm install -g artillery` |
| Jest / Supertest | already in `backend/package.json` | `cd backend && npm install` |

---

## 1. Unit & Integration Tests (Jest + Supertest)

These tests run against a live backend instance (local or staging).

### Setup

```bash
cd backend
npm install
```

Set environment variables (create a `.env.test` or export directly):

```bash
# Minimum required
export TEST_BASE_URL=http://localhost:5000      # or https://moneygence.com
export TEST_EMAIL=test@moneygence.com
export TEST_PASSWORD=Test@1234

# Only needed when SMTP is active and OTP emails are being sent
export TEST_OTP=123456
```

### Run all tests

```bash
cd backend
npm test
```

### Run with coverage report

```bash
cd backend
npm test -- --coverage
```

Coverage HTML report is written to `backend/coverage/index.html`.

### Run a single test file

```bash
cd backend
npx jest tests/auth.test.js
npx jest tests/api.test.js
```

### Run tests matching a name pattern

```bash
cd backend
npx jest --testNamePattern "health"
npx jest --testNamePattern "401"
```

---

## 2. Load Testing (Artillery)

### Install Artillery globally

```bash
npm install -g artillery
```

Verify installation:

```bash
artillery version
```

### Run the load test

```bash
# From the project root
TEST_EMAIL=admin@moneygence.com \
TEST_PASSWORD=YourSecurePass123! \
artillery run load-testing/artillery.yml
```

On Windows PowerShell:

```powershell
$env:TEST_EMAIL    = "admin@moneygence.com"
$env:TEST_PASSWORD = "YourSecurePass123!"
artillery run load-testing/artillery.yml
```

### Generate an HTML report

```bash
# Step 1: Run and capture raw JSON output
TEST_EMAIL=admin@moneygence.com \
TEST_PASSWORD=YourSecurePass123! \
artillery run --output load-testing/report.json load-testing/artillery.yml

# Step 2: Convert JSON → HTML
artillery report load-testing/report.json
# Opens (or writes) load-testing/report.json.html
```

### Run against localhost (staging before prod)

```bash
# Edit artillery.yml config.target OR pass as override:
TEST_EMAIL=test@moneygence.com \
TEST_PASSWORD=Test@1234 \
artillery run --target http://localhost:5000 load-testing/artillery.yml
```

---

## 3. Load Test Phases

| Phase | Duration | Arrival Rate | Description |
|-------|----------|-------------|-------------|
| Warm-up | 10 s | 10 users/s | Pre-heat connection pool and caches |
| Ramp-up | 60 s | 0 → 50 users/s | Gradually increase load |
| Sustained | 120 s | 50 users/s | Steady-state stress test |

**Total virtual users generated:** ~6,100 across all phases.

---

## 4. Key Metrics to Monitor

After the run completes, Artillery prints a summary. Focus on:

| Metric | Target | Description |
|--------|--------|-------------|
| `http.response_time.p50` | < 500 ms | Median response time |
| `http.response_time.p95` | < 2 000 ms | 95th percentile — your SLA budget |
| `http.response_time.p99` | < 5 000 ms | Tail latency — worst-case user experience |
| `http.request_rate` | ≥ 40 RPS | Requests per second at peak |
| `errors` / `http.codes.5xx` | 0 | Any 5xx means a server-side failure |
| `http.codes.429` | 0 in load | Rate limiter firing — back off or whitelist test IP |
| `vusers.completed` | ≈ vusers.created | Virtual users that finished without error |

### What a healthy run looks like

```
Summary report @ ...
  Scenarios launched:  6120
  Scenarios completed: 6118
  Requests completed:  30590
  Mean response/sec:   48.3
  Response time (ms):
    min: ......................................... 42
    max: ......................................... 1847
    median: ...................................... 210
    95th: ........................................ 890
    99th: ........................................ 1410
  Scenario counts:
    Full API flow: 4284 (70%)
    Health check ping: 1836 (30%)
  Codes:
    200: 30590
```

### Red flags

- `p95 > 2 000 ms` — database slow queries or missing indexes.
- `http.codes.5xx > 0` — uncaught errors; check PM2 / server logs.
- `http.codes.429` — rate limiter is too aggressive for the test account; whitelist the load-test IP or increase `RATE_LIMIT_MAX_REQUESTS`.
- `vusers.failed > 1%` — connection errors or auth failures.

---

## 5. Debugging Failed Tests

### Jest test fails with "Login failed [401]"

The `TEST_EMAIL` / `TEST_PASSWORD` do not match an active account. Create a dedicated test user in the DB:

```sql
-- Run in psql
INSERT INTO users (full_name, email, password_hash, role, status)
VALUES (
  'Test Automation',
  'test@moneygence.com',
  '$2b$12$...bcrypt-hash-of-Test@1234...',
  'Admin',
  'active'
);
```

Or use the seed script:

```bash
cd backend
node database/runSeeds.js
```

### Artillery returns 429 Too Many Requests

The login rate limiter allows 5 attempts per 15 minutes. For load tests, either:
1. Disable the limiter in a staging environment (`RATE_LIMIT_MAX_REQUESTS=10000`).
2. Whitelist the load-test machine IP in `rateLimiter.js`.
3. Use the Artillery `processor` hook to re-use a single token across virtual users.

### OTP required in staging

If your staging server has SMTP enabled, login returns `otpRequired: true`.
For load testing, disable SMTP in staging by unsetting `SMTP_HOST` in the `.env` file — the controller will fall back to direct login automatically.

---

## 6. CI Integration (GitHub Actions example)

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  schedule:
    - cron: "0 2 * * 1"   # every Monday at 02:00 UTC
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g artillery
      - run: |
          artillery run \
            --output load-testing/report.json \
            load-testing/artillery.yml
        env:
          TEST_EMAIL:    ${{ secrets.LOAD_TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.LOAD_TEST_PASSWORD }}
      - run: artillery report load-testing/report.json
      - uses: actions/upload-artifact@v4
        with:
          name: artillery-report
          path: load-testing/report.json.html
```
