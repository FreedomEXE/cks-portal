import type { ActionDescriptor } from '@cks/ui';
import { buildOrderActions, type OrderActionContext } from '../shared/utils/buildOrderActions';

export type ServiceStatus = 'created' | 'in_progress' | 'completed' | 'cancelled' | string;

export interface ServiceActionOptions {
  status?: ServiceStatus;
  onStart?: () => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onRequestProducts?: () => void | Promise<void>;
}

export function buildServiceActions(opts: ServiceActionOptions): ActionDescriptor[] {
  const actions: ActionDescriptor[] = [];
  const status = String(opts.status || '').toLowerCase().replace(/\s+/g, '_');

  if (status === 'created' && opts.onStart) {
    actions.push({ label: 'Start Service', onClick: () => opts.onStart!(), variant: 'primary' });
  }
  if ((status === 'in_progress' || status === 'active') && opts.onComplete) {
    actions.push({ label: 'Complete Service', onClick: () => opts.onComplete!(), variant: 'primary' });
  }
  if ((status === 'created' || status === 'in_progress' || status === 'active') && opts.onCancel) {
    actions.push({ label: 'Cancel Service', onClick: () => opts.onCancel!(), variant: 'danger' });
  }
  if (opts.onRequestProducts) {
    actions.push({ label: 'Request Products', onClick: () => opts.onRequestProducts!(), variant: 'secondary' });
  }
  return actions;
}

export function buildOrderActionBar(ctx: OrderActionContext): ActionDescriptor[] {
  const orderButtons = buildOrderActions(ctx);
  return orderButtons.map((b) => ({ label: b.label, onClick: b.onClick, variant: b.variant, disabled: b.disabled }));
}

export interface CatalogActionsOptions {
  onAddToCart?: () => void | Promise<void>;
  onConfigure?: () => void | Promise<void>;
  onEdit?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export function buildCatalogActions(opts: CatalogActionsOptions): ActionDescriptor[] {
  const actions: ActionDescriptor[] = [];
  if (opts.onAddToCart) actions.push({ label: 'Add to Cart', onClick: () => opts.onAddToCart!(), variant: 'primary' });
  if (opts.onConfigure) actions.push({ label: 'Configure', onClick: () => opts.onConfigure!(), variant: 'secondary' });
  if (opts.onEdit) actions.push({ label: 'Edit', onClick: () => opts.onEdit!(), variant: 'secondary' });
  if (opts.onDelete) actions.push({ label: 'Delete', onClick: () => opts.onDelete!(), variant: 'danger' });
  return actions;
}

