import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { InvoiceLines } from './src/components/InvoiceLines';
import { Timer } from './src/components/Timer';
import {
  clientsByRecency,
  type Entry,
  today,
  toInvoiceLines,
  totalSeconds,
} from './src/lib/entries';
import { loadEntries, saveEntries } from './src/lib/store';
import { formatDuration, MINUTE } from './src/lib/time';
import { space, TAP, usePalette } from './src/theme';

export default function App() {
  const palette = usePalette();

  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [client, setClient] = useState('');
  const [task, setTask] = useState('');
  const [increment, setIncrement] = useState<number>(15 * MINUTE);

  useEffect(() => {
    void loadEntries().then(setEntries);
  }, []);

  const stop = useCallback(
    (seconds: number) => {
      // Anything under a minute is a mis-tap, not work. Recording it clutters
      // the log and, once rounded up, bills for it.
      if (seconds < MINUTE) return;

      const entry: Entry = {
        id: `${Date.now()}`,
        client: client.trim(),
        task: task.trim(),
        seconds,
        day: today(),
        startedAt: new Date().toISOString(),
      };

      setEntries((current) => {
        const next = [...(current ?? []), entry];
        void saveEntries(next);
        return next;
      });
      setTask('');
    },
    [client, task],
  );

  const lines = useMemo(
    () => toInvoiceLines(entries ?? [], increment),
    [entries, increment],
  );
  const worked = useMemo(() => totalSeconds(entries ?? []), [entries]);
  const recent = useMemo(() => clientsByRecency(entries ?? []).slice(0, 4), [entries]);

  if (entries === null) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.bg }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar barStyle={palette.bg === '#131311' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={[styles.title, { color: palette.ink }]}>Tally</Text>
            <Text style={{ color: palette.muted }}>
              {worked === 0 ? 'Nothing tracked yet' : `${formatDuration(worked)} tracked`}
            </Text>
          </View>

          <Timer
            client={client}
            task={task}
            onClient={setClient}
            onTask={setTask}
            onStop={stop}
          />

          {recent.length > 0 ? (
            <View style={styles.recent}>
              {recent.map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={`Track for ${name}`}
                  onPress={() => setClient(name)}
                  style={[styles.chip, { borderColor: palette.rule }]}
                >
                  <Text style={{ color: palette.muted }}>{name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={{ gap: space.md }}>
            <Text style={[styles.heading, { color: palette.ink }]}>To invoice</Text>
            <InvoiceLines
              lines={lines}
              increment={increment}
              onIncrement={setIncrement}
              unroundedSeconds={worked}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 17, fontWeight: '600' },
  recent: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1,
    borderRadius: TAP / 2,
    paddingHorizontal: space.lg,
    height: 40,
    justifyContent: 'center',
  },
});
