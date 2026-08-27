# Delight effects (reusable)

Put **shared motions and playful visuals** here so feature screens can import them instead of copying code.

## Rule

- New reusable delighter motion → `apps/mobile/delight/effects/<slug>/`
- Export from `index.ts`
- Transform/opacity only; respect Reduce Motion
- Feature screens import; they do not own a private copy

## Recipe: burst emojis on a control

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { EmojiRain } from '../../delight/effects/emoji-rain';

function ExampleButton() {
  const [rain, setRain] = useState(false);
  return (
    <View>
      <Pressable onPress={() => setRain(true)} accessibilityLabel="Celebrate">
        {/* your button */}
      </Pressable>
      <EmojiRain active={rain} onDone={() => setRain(false)} />
    </View>
  );
}
```

See `../CATALOG.md` and `guide-docs/DELIGHT.md`.
