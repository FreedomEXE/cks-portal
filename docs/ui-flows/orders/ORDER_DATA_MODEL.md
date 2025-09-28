# Order Data Model & Workflow Reference

## Core Roles
- **Creator** – entity initiating the order (any hub role: customer, center, crew, manager, warehouse)
- **Destination** – entity receiving / hosting fulfillment; may equal creator for self-service scenarios
- **Actors** – roles that must take workflow actions (warehouse for product orders; manager/contractor/crew for service orders)
- **Watchers** – observers monitoring progress (leadership, account owners) without direct actions

## Participants & Ownership
- `orders` records the primary creator and destination identifiers/roles
- `order_participants` captures the complete cast (creator, destination, actors, watchers) with `participation_type`
- Workflow logic derives required participants from `(order_type, creator_role)`
  - Product orders always include the warehouse as an `actor`
  - Service orders add manager ? contractor ? crew expectations
- Viewer permissions and allowed actions come from current status + participant role (never by overloading legacy fields)

## Status Lifecycles

### Product Orders
| Status | Description | Next actor |
| --- | --- | --- |
| `pending_warehouse` | Order submitted; waiting for warehouse triage | warehouse |
| `awaiting_delivery` | Warehouse accepted; delivery or pick-up pending | warehouse |
| `delivered` | Product fulfilled and confirmed | none |
| `cancelled` | Requester cancelled before fulfillment | none |
| `rejected` | Warehouse rejected the request (with notes) | none |

### Service Orders
| Status | Description | Next actor |
| --- | --- | --- |
| `pending_manager` | New request awaiting manager review | manager |
| `pending_contractor` | Manager approved; contractor assignment required | contractor |
| `pending_crew` | Contractor assigned; crew scheduling required | crew |
| `service_in_progress` | Crew acknowledged / performing work | crew |
| `service_completed` | Work completed | none |
| `cancelled` | Request cancelled before fulfillment | none |
| `rejected` | Any actor declined the request | none |

*Statuses encode who must act next. Viewer status is derived per role (actors see `pending`, requesters see `in-progress`, everyone else reads the canonical status).* 

## Database Schema (Working Draft)

```sql
CREATE TABLE orders (
  order_id VARCHAR(64) PRIMARY KEY DEFAULT gen_order_id(),
  order_type TEXT NOT NULL CHECK (order_type IN ('product', 'service')),

  status TEXT NOT NULL,
  next_actor_role TEXT,
  next_actor_id TEXT,

  creator_id TEXT NOT NULL,
  creator_role TEXT NOT NULL,
  destination_id TEXT,
  destination_role TEXT,

  requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_date TIMESTAMPTZ,
  service_start_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,

  total_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type_status ON orders(order_type, status);
CREATE INDEX idx_orders_creator ON orders(creator_id);
CREATE INDEX idx_orders_destination ON orders(destination_id);

CREATE TABLE order_participants (
  order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  participant_role TEXT NOT NULL,
  participation_type TEXT NOT NULL CHECK (participation_type IN ('creator', 'destination', 'actor', 'watcher')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, participant_id, participant_role)
);
```

### Notes
- `customer_id` is intentionally absent; real customer involvement is captured through `order_participants`
- Cancellation or rejection transitions set terminal statuses and clear `next_actor_*`
- Additional history tables (status transitions, actions) remain unchanged from prior design docs
