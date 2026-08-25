import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatClock } from '../lib/time';
import { radius, space, TAP, usePalette } from '../theme';

type Props = {
  client: string;
  task: string;
  onClient: (value: string) => void;
  onTask: (value: string) => void;
  onStop: (seconds: number) => void;
};

/**
 * The running clock.
 *
 * The elapsed time is derived from a start timestamp rather than counted up by
 * the interval. A ticking counter loses time whenever the OS suspends the app
 * or throttles timers in the background - which is most of a working day - and
 * would quietly under-bill. The interval here only decides how often the
 * screen redraws; the number itself is always the difference between two
 * clock readings.
 */
export function Timer({ client, task, onClient, onTask, onStop }: Props) {
  const palette = usePalette();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedAt === null) return;

    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    tick.current = setInterval(update, 1000);

    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [startedAt]);

  const running = startedAt !== null;
  const ready = client.trim().length > 0 && task.trim().length > 0;

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.rule }]}>
      <TextInput
        value={client}
        onChangeText={onClient}
        editable={!running}
        placeholder="Client"
        placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.ink, borderColor: palette.rule }]}
      />
      <TextInput
        value={task}
        onChangeText={onTask}
        editable={!running}
        placeholder="What are you working on"
        placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.ink, borderColor: palette.rule }]}
      />

      <Text
        accessibilityLabel={running ? `Running, ${formatClock(elapsed)}` : 'Not running'}
        style={[styles.clock, { color: running ? palette.running : palette.muted }]}
      >
        {formatClock(elapsed)}
      </Text>

      <Pressable
        accessibilityRole="button"
        disabled={!running && !ready}
        onPress={() => {
          if (running) {
            onStop(elapsed);
            setStartedAt(null);
            setElapsed(0);
          } else {
            setStartedAt(Date.now());
          }
        }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: running ? palette.runningWash : palette.accent,
            borderColor: running ? palette.running : palette.accent,
            opacity: pressed ? 0.85 : !running && !ready ? 0.4 : 1,
          },
        ]}
      >
        <Text
          style={[styles.buttonText, { color: running ? palette.running : palette.onAccent }]}
        >
          {running ? 'Stop' : 'Start'}
        </Text>
      </Pressable>

      {!running && !ready ? (
        <Text style={[styles.hint, { color: palette.muted }]}>
          Name the client and the task first.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: TAP,
    fontSize: 16,
  },
  clock: {
    fontSize: 44,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    paddingVertical: space.sm,
    letterSpacing: -1,
  },
  button: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
  hint: { fontSize: 13, textAlign: 'center' },
});
