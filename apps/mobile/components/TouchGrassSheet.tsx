// ============================================
// WHAT THIS FILE DOES (plain English):
// The sheet that opens from Touch Grass: who to tell, when, optional note,
// then Send signal. Concentric groups only — no view counts.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ButtonSecondary, Sheet, TextField, cn } from '@bridger/ui';

const WHO = ['Close', 'Friends', 'Everyone'];
const WHEN = ['Now', 'Tonight', 'Weekend'];

export function TouchGrassSheet({
  open,
  onClose,
  onSend
}: {
  open: boolean;
  onClose: () => void;
  onSend: (input: { who: string; when: string; note?: string }) => void;
}) {
  const [who, setWho] = useState('Friends');
  const [when, setWhen] = useState('Now');
  const [note, setNote] = useState('');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Who's free?"
      footer={
        <ButtonSecondary
          full
          size="lg"
          tone="positive"
          onPress={() => onSend({ who, when, note: note.trim() || undefined })}
        >
          Send signal
        </ButtonSecondary>
      }
    >
      <View className="gap-4">
        <Segment label="Who to tell" options={WHO} value={who} onChange={setWho} tone="ink" />
        <Segment label="When" options={WHEN} value={when} onChange={setWhen} tone="green" />
        <TextField
          label="Note"
          value={note}
          onChange={setNote}
          placeholder="anything outside"
        />
      </View>
    </Sheet>
  );
}

function Segment({
  label,
  options,
  value,
  onChange,
  tone
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  tone: 'ink' | 'green';
}) {
  return (
    <View>
      <Text className="mb-2 font-sans-b text-[12px] text-ink-soft">{label}</Text>
      <View className="flex-row gap-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={o}
              className={cn(
                'flex-1 items-center rounded-full px-3 py-2.5',
                active
                  ? tone === 'ink'
                    ? 'bg-ink'
                    : 'bg-success'
                  : 'border border-ink-line bg-surface'
              )}
            >
              <Text
                className={cn(
                  'font-sans-b text-[13px]',
                  active ? 'text-white' : 'text-ink'
                )}
              >
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
