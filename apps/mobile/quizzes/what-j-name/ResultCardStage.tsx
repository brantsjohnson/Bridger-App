// ============================================
// WHAT THIS FILE DOES (plain English):
// A little stage that shows the result poster on screen at whatever width the
// phone has, while the poster itself stays drawn at its true 430-point size.
//
// Why bother: the poster is a collage laid out at exact sizes, so we never want
// to re-flow it. Instead we shrink the whole thing visually (like zooming out
// on a photo) to fit the screen. The picture we save to your photos is taken
// from the real, unshrunk poster underneath, so the saved PNG is always full
// quality and always identical, no matter what phone made it.
// ============================================

import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { ResultCard } from './ResultCard';
import { CARD_W } from './result-theme';

export type ResultCardStageProps = {
  jName: string;
  percent: number;
  /**
   * Handed the real (unshrunk) poster View so the share tools can snapshot it.
   * SNAPSHOT: this is the exact view "Download PNG" turns into an image.
   */
  captureRef?: React.RefObject<View | null>;
};

export function ResultCardStage({ jName, percent, captureRef }: ResultCardStageProps) {
  // THIS SECTION DOES: measure how much room we actually got, then work out how
  // much to shrink the poster by. We never enlarge it past its true size.
  const [available, setAvailable] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setAvailable(e.nativeEvent.layout.width);
  const scale = available > 0 ? Math.min(1, available / CARD_W) : 1;

  // THIS SECTION DOES: measure the poster's real height so the shrunken version
  // reserves the right amount of space (a scaled view still claims its full
  // height unless we tell the layout otherwise).
  const [cardH, setCardH] = useState(0);

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      <View style={{ height: cardH ? cardH * scale : undefined, overflow: 'hidden' }}>
        {/* The shrinking happens on THIS wrapper... */}
        <View style={{ width: CARD_W, transform: [{ scale }], transformOrigin: 'top left' }}>
          {/* ...so the poster inside stays its true size. That is the view we
              snapshot. collapsable=false keeps it real on Android so it can be
              captured at all. */}
          <View
            ref={captureRef}
            collapsable={false}
            onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
          >
            <ResultCard jName={jName} percent={percent} />
          </View>
        </View>
      </View>
    </View>
  );
}
