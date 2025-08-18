import React from 'react';
import { Link } from 'react-router-dom';
import { buildHubPath } from '../../lib/hubRoutes';

type LinkProps = React.ComponentProps<typeof Link>;
type Props = Omit<LinkProps, 'to'> & {
  to?: string;
  hub?: string;
  sub?: string;
};

export default function HubLink({ hub, sub, to, children, ...rest }: Props) {
  // If caller provided an explicit `to`, prefer it. Otherwise build from hub/sub.
  const target = typeof to === 'string' && to ? to : hub ? buildHubPath(hub, sub) : '#';
  return (
    <Link to={target} {...(rest as any)}>
      {children}
    </Link>
  );
}
