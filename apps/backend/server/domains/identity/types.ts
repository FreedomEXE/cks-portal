export type IdentityEntity =
  | 'manager'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew'
  | 'warehouse';

export interface IdentityDescriptor {
  prefix: string;
  sequence: string;
}
