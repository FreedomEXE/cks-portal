import { describe, it, expect } from 'vitest';
import managerTabsConfig from '../components/profiles/managerTabs.config';

describe('Manager tabs config', () => {
  it('includes required tab labels', () => {
    const labels = managerTabsConfig.map(t => t.label);
    for (const label of ['Profile','Centers','Crew','Services','Jobs','Training','Performance','Supplies/Equipment']) {
      expect(labels).toContain(label);
    }
  });
});
