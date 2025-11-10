import { describe, it, expect } from 'vitest';
import React from 'react';
import ProfileSkeleton from '../components/ProfileSkeleton';

describe('ProfileSkeleton', () => {
  it('returns a valid React element', () => {
    const el = React.createElement(ProfileSkeleton);
    expect(React.isValidElement(el)).toBe(true);
  });
});
