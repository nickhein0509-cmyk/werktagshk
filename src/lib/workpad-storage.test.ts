import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadWorkpad, saveWorkpad } from './workpad-storage';

describe('separate calculation drafts', () => {
  const records = new Map<string, string>();
  beforeEach(() => {
    records.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => records.set(key, value),
    });
  });

  it('preserves an own workpad without creating learning events or crossing accounts', () => {
    const draft = {
      ...loadWorkpad('a:task').draft,
      working: '120 × 4,18 × 40',
      notes: 'Einheit prüfen',
    };
    expect(records.size).toBe(0);
    expect(saveWorkpad('a:task', draft)).toBe(true);
    expect(loadWorkpad('a:task').draft).toEqual(draft);
    expect(loadWorkpad('b:task').draft.notes).toBe('');
    expect(records.has('werktag-learning-v1')).toBe(false);
  });

  it.each(['{broken', '{"version":2,"draft":{"future":"keep"}}'])(
    'preserves unreadable or newer drafts verbatim',
    (raw) => {
      records.set('task', raw);
      expect(loadWorkpad('task').writable).toBe(false);
      expect(saveWorkpad('task', { ...loadWorkpad('missing').draft, notes: 'new' })).toBe(false);
      expect(records.get('task')).toBe(raw);
    },
  );
});
