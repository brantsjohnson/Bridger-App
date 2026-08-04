// ============================================
// WHAT THIS FILE DOES (plain English):
// A placeholder QR code block shown in the Add-friend sheet. Looks like a
// chunky pixel QR so demos feel real; live mode will render a real invite token.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { cn } from '@bridger/ui';

export function QrBlock() {
  // 8×8 fake modules — demo placeholder until real invite QR tokens ship.
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Your QR code"
      className="mx-auto h-40 w-40 flex-row flex-wrap content-start border-2 border-ink bg-white p-2"
    >
      {Array.from({ length: 64 }).map((_, i) => (
        <View
          key={i}
          style={{ width: '12.5%', height: '12.5%' }}
          className={cn(i % 3 === 0 || i % 5 === 0 ? 'bg-ink' : 'bg-transparent')}
        />
      ))}
    </View>
  );
}
