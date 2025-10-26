# Modal Header Name Convention

Goal: show a human-readable name under the ID in every universal modal card, consistently across entities, without custom component logic.

- Source of truth: adapters provide `headerConfig.fields`.
- Rule: include a field with `label: 'Name'` containing the display name for the entity.
- Consumer: `packages/domain-widgets/src/modals/EntityModalView.tsx` extracts the first field with label `'Name'` and passes it to `EntityHeaderCard` as `name`.

Changes made (consistent with this rule):
- catalogService adapter header now adds `fields.push({ label: 'Name', value: entityData.name })`.
  - File: `apps/frontend/src/config/entityRegistry.tsx:1350`
- service adapter header now adds `fields.push({ label: 'Name', value: entityData.serviceName || entityData.name })`.
  - File: `apps/frontend/src/config/entityRegistry.tsx:861`
- user adapter already provided `Name` via profile mapping.

Guideline for future adapters:
- Always include a `'Name'` field in `getHeaderConfig` if the entity has a display name.
- Do not render custom header components; rely on `EntityHeaderCard` through `EntityModalView`.

