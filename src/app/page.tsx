/**
 * Home page — Splitwise Lite
 *
 * A server-rendered landing page that presents the API surface
 * and architecture overview of the application.
 *
 * Layer: Interfaces (Next.js page — presentation only, no business logic)
 */

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <h1>💸 Splitwise Lite</h1>
          <p>Lightweight expense-splitting — built with Next.js &amp; Clean Architecture</p>
        </div>
      </header>

      <main className="container" style={{ padding: '2rem 1.25rem' }}>

        {/* ── Introduction ─────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">What is this?</h2>
          <p style={{ maxWidth: '640px' }}>
            Splitwise Lite lets groups of friends track shared expenses and instantly
            see who owes whom — with a minimal debt-settlement algorithm to reduce the
            number of payments required.
          </p>
        </section>

        {/* ── API Reference ────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">REST API</h2>
          <p className="muted" style={{ marginBottom: '1rem' }}>
            All endpoints return <code>{'{ success, data }'}</code> on success or{' '}
            <code>{'{ success: false, error }'}</code> on failure.
          </p>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '.5rem .75rem' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '.5rem .75rem' }}>Endpoint</th>
                  <th style={{ textAlign: 'left', padding: '.5rem .75rem' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {API_ROUTES.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '.5rem .75rem' }}>
                      <span className={`badge badge-${methodColor(r.method)}`}>{r.method}</span>
                    </td>
                    <td style={{ padding: '.5rem .75rem' }}>
                      <code>{r.path}</code>
                    </td>
                    <td style={{ padding: '.5rem .75rem', color: 'var(--color-muted)' }}>
                      {r.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Quick-start ──────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">Quick-start example</h2>
          <pre>{QUICK_START}</pre>
        </section>

        {/* ── Architecture ─────────────────────────────────────── */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">Clean Architecture layers</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {LAYERS.map((layer) => (
              <div className="card" key={layer.name}>
                <p style={{ fontWeight: 700, marginBottom: '.25rem' }}>{layer.emoji} {layer.name}</p>
                <p className="muted">{layer.description}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '1.5rem 0', marginTop: '2rem' }}>
        <div className="container muted" style={{ fontSize: '.8rem' }}>
          Splitwise Lite · TypeScript · Next.js 14 · Clean Architecture
        </div>
      </footer>
    </>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────

const API_ROUTES = [
  { method: 'GET',  path: '/api/users',                            description: 'List all users' },
  { method: 'POST', path: '/api/users',                            description: 'Register a new user' },
  { method: 'GET',  path: '/api/users/:id',                        description: 'Get a user by ID' },
  { method: 'POST', path: '/api/groups',                           description: 'Create a new group' },
  { method: 'GET',  path: '/api/groups/:groupId',                  description: 'Get a group by ID' },
  { method: 'GET',  path: '/api/groups/:groupId/expenses',         description: 'List expenses in a group' },
  { method: 'POST', path: '/api/groups/:groupId/expenses',         description: 'Add an expense to a group' },
  { method: 'GET',  path: '/api/groups/:groupId/balances',         description: 'Get balances & settlements' },
];

const LAYERS = [
  { emoji: '🔵', name: 'domain/',         description: 'Entities, Value Objects, Domain Services, Repository Interfaces. Zero external dependencies.' },
  { emoji: '🟢', name: 'application/',    description: 'Use Cases, DTOs, Mappers, Application Ports. Orchestrates the domain.' },
  { emoji: '🟠', name: 'infrastructure/', description: 'Repositories, ID generators, DB/HTTP clients. Implements application ports.' },
  { emoji: '🟣', name: 'interfaces/',     description: 'Next.js route handlers, pages. Thin translators between HTTP and use cases.' },
];

const QUICK_START = `# 1. Create two users
curl -X POST /api/users -d '{"name":"Alice","email":"alice@example.com"}'
curl -X POST /api/users -d '{"name":"Bob","email":"bob@example.com"}'

# 2. Create a group (replace IDs)
curl -X POST /api/groups \\
  -d '{"name":"Road Trip","memberIds":["<alice-id>","<bob-id>"]}'

# 3. Alice pays $60 for dinner, split evenly
curl -X POST /api/groups/<group-id>/expenses \\
  -d '{
    "payerId": "<alice-id>",
    "amountInCents": 6000,
    "currency": "USD",
    "description": "Dinner",
    "splits": [
      {"userId":"<alice-id>","amountInCents":3000},
      {"userId":"<bob-id>","amountInCents":3000}
    ]
  }'

# 4. See who owes whom
curl /api/groups/<group-id>/balances`;

function methodColor(method: string): string {
  const map: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    DELETE: 'red',
    PATCH: 'blue',
    PUT: 'blue',
  };
  return map[method] ?? 'blue';
}
