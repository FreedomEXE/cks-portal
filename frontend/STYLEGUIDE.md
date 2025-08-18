# CKS Frontend Styling Guide (Tailwind)

This project uses TailwindCSS with a minimal design system.

- Base colors: brand blue (brand-500), neutral ink scale, success/warn/danger accents.
- Components: .card, .btn, .btn-primary, .btn-ghost, .input, .select, .badge, .alert, .alert-error, .alert-warn, .table.

Examples:

Buttons
- Primary: <button class="btn-primary">Save</button>
- Ghost: <button class="btn-ghost">Cancel</button>

Cards
- <div class="card p-4">Content</div>

Form
- <input class="input" placeholder="Search" />
- <select class="select"><option>One</option></select>

Alerts
- <div class="alert-error">Something went wrong</div>

Table
- <table class="table"><thead>...</thead><tbody>...</tbody></table>

See src/components/ui for typed React wrappers.
