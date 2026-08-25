import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Entry } from './entries';

const KEY = 'tally.entries.v1';

/**
 * Persistence, kept behind two functions.
 *
 * The whole set is written on every change. That is the wrong shape for
 * thousands of rows and exactly right for a freelancer's week, and it makes a
 * partial write impossible to observe: either the new JSON is there or the old
 * one is.
 *
 * A read that cannot be parsed returns an empty list rather than throwing.
 * Losing the log is bad; refusing to open the app at all so that nothing new
 * can be recorded either is worse.
 */
export async function loadEntries(): Promise<Entry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

export async function saveEntries(entries: Entry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

/**
 * Checked field by field rather than cast.
 *
 * The stored JSON was written by an older build of this app, which is a
 * different program. Trusting its shape is how a rename three versions ago
 * becomes a crash on launch that no amount of reinstalling fixes.
 */
function isEntry(value: unknown): value is Entry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === 'string' &&
    typeof entry.client === 'string' &&
    typeof entry.task === 'string' &&
    typeof entry.seconds === 'number' &&
    Number.isFinite(entry.seconds) &&
    typeof entry.day === 'string' &&
    typeof entry.startedAt === 'string'
  );
}
