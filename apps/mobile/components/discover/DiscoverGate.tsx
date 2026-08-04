// ============================================
// WHAT THIS FILE DOES (plain English):
// The Discover intro gate — black-and-white wireframe globe on a quiet canvas.
// "Get started" turns matching on. Shown once to opt in, and again if you turn
// matching off in settings.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { ButtonPrimary, PixelHeading, useThemeColors } from '@bridger/ui';

export function DiscoverGate({ onStart }: { onStart: () => void }) {
  return (
    <View className="relative flex-1 overflow-hidden bg-surface">
      {/* static perspective hatch — gate stays calm; main screen owns the drift */}
      <View
        accessible={false}
        pointerEvents="none"
        className="absolute -bottom-4 left-[-40%] right-[-40%] h-1/2 opacity-40"
        style={{
          borderTopWidth: 1,
          borderColor: 'rgba(28,27,22,0.2)',
          transform: [{ perspective: 220 }, { rotateX: '55deg' }]
        }}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={i}
            className="absolute left-0 right-0 h-px bg-ink/25"
            style={{ top: `${10 + i * 9}%` }}
          />
        ))}
      </View>

      <View className="relative flex-1 items-center justify-center px-7">
        <Globe />
        <PixelHeading size="lg" className="mt-8 text-center">
          Making friends as an adult is hard.
        </PixelHeading>
        <Text className="mt-4 max-w-[280px] text-center font-sans-sb text-[15px] leading-snug text-ink-soft">
          Bridger introduces you to the friends of friends worth knowing.
        </Text>
      </View>

      <View className="relative px-6 pb-10">
        <ButtonPrimary full onPress={onStart} accessibilityLabel="Get started with Discover">
          Get started
        </ButtonPrimary>
        <Text className="mt-3 text-center font-sans-sb text-[12px] text-ink-mute">
          You choose what you share.
        </Text>
      </View>
    </View>
  );
}

function Globe() {
  const c = useThemeColors();
  return (
    <Svg width={128} height={128} viewBox="0 0 120 120" accessibilityLabel="Wireframe globe">
      <Circle cx="60" cy="60" r="46" fill="none" stroke={c.ink} strokeWidth="1.5" />
      {[14, 28, 40].map((r) => (
        <Ellipse
          key={r}
          cx="60"
          cy="60"
          rx={r}
          ry="46"
          fill="none"
          stroke={c.ink}
          strokeWidth="1"
        />
      ))}
      {[-30, 0, 30].map((dy) => (
        <Ellipse
          key={dy}
          cx="60"
          cy={60 + dy}
          rx="46"
          ry={dy === 0 ? 46 : 30}
          fill="none"
          stroke={c.ink}
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
      ))}
    </Svg>
  );
}
