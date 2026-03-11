export type IdentityEntity =
  | 'manager'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew'
  | 'warehouse'
  | 'scheduleBlock'
  // Extended entities for system records
  | 'report'
  | 'feedback';

export interface IdentityDescriptor {
  prefix: string;
  sequence: string;
}
