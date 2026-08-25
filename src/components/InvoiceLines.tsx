import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { InvoiceLine } from '../lib/entries';
import { formatDuration, INCREMENTS } from '../lib/time';
import { radius, space, TAP, usePalette } from '../theme';

type Props = {
  lines: InvoiceLine[];
  increment: number;
  onIncrement: (seconds: number) => void;
  unroundedSeconds: number;
};

/**
 * What the week bills as.
 *
 * The unrounded total is shown beside the billed one whenever they differ.
 * Rounding up is normal practice, but the person sending the invoice should
 * see the size of what it added rather than discover it when a client asks.
 */
export function InvoiceLines({ lines, increment, onIncrement, unroundedSeconds }: Props) {
  const palette = usePalette();
  const billed = lines.reduce((sum, line) => sum + line.seconds, 0);
  const added = billed - unroundedSeconds;

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.increments}>
        {INCREMENTS.map((option) => {
          const selected = option.seconds === increment;
          return (
            <Pressable
              key={option.seconds}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onIncrement(option.seconds)}
              style={[
                styles.increment,
                {
                  backgroundColor: selected ? palette.accent : 'transparent',
                  borderColor: selected ? palette.accent : palette.rule,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? palette.onAccent : palette.muted,
                  fontWeight: selected ? '600' : '400',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {lines.length === 0 ? (
        <Text style={[styles.empty, { color: palette.muted }]}>
          Nothing tracked yet this week.
        </Text>
      ) : (
        <ScrollView style={{ maxHeight: 320 }}>
          {lines.map((line) => (
            <View
              key={`${line.client}-${line.task}`}
              style={[styles.row, { borderBottomColor: palette.rule }]}
            >
              <View style={{ flex: 1, paddingRight: space.md }}>
                <Text style={{ color: palette.ink, fontWeight: '500' }}>{line.task}</Text>
                <Text style={{ color: palette.muted, fontSize: 13 }}>{line.client}</Text>
              </View>
              <Text style={[styles.hours, { color: palette.ink }]}>
                {line.hours.toFixed(2)} h
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.total, { borderTopColor: palette.rule }]}>
        <View>
          <Text style={{ color: palette.muted, fontSize: 13 }}>Billable</Text>
          {added > 0 ? (
            <Text style={{ color: palette.muted, fontSize: 12 }}>
              {formatDuration(unroundedSeconds)} worked, rounding added{' '}
              {formatDuration(added)}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.totalHours, { color: palette.ink }]}>
          {(billed / 3600).toFixed(2)} h
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  increments: { flexDirection: 'row', gap: space.sm },
  increment: {
    flex: 1,
    height: TAP,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hours: { fontVariant: ['tabular-nums'], fontSize: 16, fontWeight: '500' },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: space.md,
  },
  totalHours: { fontVariant: ['tabular-nums'], fontSize: 26, fontWeight: '600' },
  empty: { paddingVertical: space.xl, textAlign: 'center' },
});
