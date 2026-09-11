// ============================================
// WHAT THIS FILE DOES (plain English):
// The big "here's your J" result poster. It is a torn-paper collage on warm
// off-white paper: the headline "WHAT J-NAME ARE YOU?", your J-name printed
// huge on a ripped pink banner, your match percentage with a chunky segmented
// bar, your picture taped down next to your one redeeming quality, the roast
// paragraph, your red flags stuck on as paper stickers, and two little 90s
// desktop windows at the bottom (the thing you always say, and a text thread).
//
// This is the exact block we snapshot into a PNG when someone taps "Download
// PNG", so it is one self-contained View with explicit colors and a FIXED
// 430-point width. The screen scales it down to fit the phone, but the picture
// that lands in your photos is always drawn at this size, so everyone's saved
// card looks the same.
//
// The content (name, percent, quality, flags, quote, texts) all comes from the
// quiz result, so the same layout serves all seven J-names and any percentage.
// ============================================

import React from 'react';
import { Image, ImageBackground, Text, View } from 'react-native';
import { resultCard } from './engine';
import { JNAME_IMAGES } from './images';
import { StrokeText } from './StrokeText';
import { CARD_W, POSTER, POSTER_ART, POSTER_FONT, STICKERS } from './result-theme';

// THIS SECTION DOES: the margins the whole poster is laid out against.
const PAD = 20;
const CONTENT_W = CARD_W - PAD * 2; // 390

// THIS SECTION DOES: how many blocks the match bar is chopped into. The design
// uses 26; the number of filled blocks is just the percentage of 26.
const BAR_SEGMENTS = 26;

// THIS SECTION DOES: pick a type size for the giant J-name so long names
// (JUSTIN) and short names (JOSH) both fill the banner without spilling.
function nameSize(name: string): number {
  if (name.length <= 4) return 112;
  if (name.length === 5) return 104;
  return 97;
}

// THIS SECTION DOES: same idea for the quote in the little QUOTE window, which
// has a fixed box but wildly different sentence lengths.
function quoteSize(quote: string): number {
  if (quote.length <= 26) return 26;
  if (quote.length <= 40) return 22;
  return 18;
}

export function ResultCard({ jName, percent }: { jName: string; percent: number }) {
  const card = resultCard(jName);
  if (!card) return null;

  // Clamp the percentage so a bad number can never draw a broken bar.
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const filled = Math.round((pct / 100) * BAR_SEGMENTS);

  return (
    // --- THE PAPER: everything is printed on this one off-white page ---
    <View
      accessible
      accessibilityLabel={`You are ${jName}, ${pct} percent match`}
      style={{ width: CARD_W, backgroundColor: POSTER.paper, paddingBottom: 22 }}
    >
      {/* ================= HEADER: headline + the giant name on ripped pink ========= */}
      <View style={{ height: 196 }}>
        {/* The scratchy hand-drawn rule across the very top. */}
        <Image
          source={POSTER_ART.lineTop}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', left: 14, top: 14, width: 402, height: 5 }}
          resizeMode="stretch"
        />

        {/* The ripped pink banner the name is printed on. */}
        <Image
          source={POSTER_ART.paperPink}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', left: PAD, top: 40, width: CONTENT_W, height: 146 }}
          resizeMode="stretch"
        />

        {/* THE GIANT NAME: big block letters on the pink banner. */}
        <View
          style={{
            position: 'absolute',
            left: PAD + 10,
            top: 58,
            width: CONTENT_W - 20,
            height: 108,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <StrokeText
            stroke={5}
            strokeColor={POSTER.navy}
            center
            style={{
              fontFamily: POSTER_FONT.display,
              fontSize: nameSize(jName),
              lineHeight: nameSize(jName) * 0.82,
              letterSpacing: 2,
              color: POSTER.cream,
              textAlign: 'center',
              textTransform: 'uppercase'
            }}
          >
            {jName.toUpperCase()}
          </StrokeText>
        </View>

        {/* THE HEADLINE: three outlined words that sit on top of the banner.
            "ARE YOU?" is tilted, like it was stamped on afterwards. */}
        <View
          style={{
            position: 'absolute',
            left: 26,
            top: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 7
          }}
        >
          <StrokeText
            stroke={4.2}
            strokeColor={POSTER.white}
            style={{
              fontFamily: POSTER_FONT.display,
              fontSize: 42,
              lineHeight: 44,
              letterSpacing: -2.2,
              color: POSTER.navy
            }}
          >
            WHAT
          </StrokeText>
          <StrokeText
            stroke={4.2}
            strokeColor={POSTER.white}
            style={{
              fontFamily: POSTER_FONT.display,
              fontSize: 42,
              lineHeight: 44,
              letterSpacing: -1.7,
              color: POSTER.pink
            }}
          >
            J-NAME
          </StrokeText>
          <View style={{ transform: [{ rotate: '-9deg' }], marginTop: 4 }}>
            <StrokeText
              stroke={4.2}
              strokeColor={POSTER.white}
              style={{
                fontFamily: POSTER_FONT.display,
                fontSize: 42,
                lineHeight: 44,
                letterSpacing: -1.7,
                color: POSTER.navy
              }}
            >
              ARE YOU?
            </StrokeText>
          </View>
        </View>

        {/* Two more scratchy rules that break up the block, exactly as designed. */}
        <Image
          source={POSTER_ART.lineShort}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', left: 16, top: 122, width: 96, height: 4 }}
          resizeMode="stretch"
        />
        <Image
          source={POSTER_ART.lineMid}
          accessibilityIgnoresInvertColors
          style={{ position: 'absolute', left: 206, top: 188, width: 208, height: 5 }}
          resizeMode="stretch"
        />
      </View>

      {/* ================= MATCH: the percentage and its blocky bar ================ */}
      <View style={{ paddingHorizontal: PAD }}>
        {/* The tiny typewriter caption above the number. */}
        <Text
          style={{
            fontFamily: POSTER_FONT.mono,
            fontSize: 9,
            letterSpacing: 1.6,
            color: POSTER.pink
          }}
        >
          MATCH PERCENTAGE
        </Text>

        {/* The number itself, with the word MATCH sitting on its baseline. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 9, marginTop: 2 }}>
          <Text
            style={{
              fontFamily: POSTER_FONT.pixelBig,
              fontSize: 70,
              lineHeight: 74,
              color: POSTER.navy
            }}
          >
            {pct}%
          </Text>
          <Text
            style={{
              fontFamily: POSTER_FONT.pixel,
              fontSize: 28,
              lineHeight: 30,
              paddingBottom: 10,
              color: POSTER.navy
            }}
          >
            MATCH
          </Text>
        </View>

        {/* THE BAR: a boxed track chopped into 26 blocks; the filled ones are
            the percentage, so the bar always agrees with the number above it. */}
        <View
          style={{
            marginTop: 8,
            height: 28,
            borderWidth: 3,
            borderColor: POSTER.rule,
            paddingHorizontal: 5,
            justifyContent: 'center'
          }}
        >
          <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            {Array.from({ length: BAR_SEGMENTS }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 16,
                  backgroundColor: i < filled ? POSTER.pink : 'transparent'
                }}
              />
            ))}
          </View>
        </View>

        {/* ============ PICTURE + REDEEMING QUALITY, side by side ============ */}
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          {/* The photo, taped down on a scrap of paper. */}
          <View style={{ width: 182, height: 182 }}>
            <ImageBackground
              source={POSTER_ART.paperPhoto}
              resizeMode="cover"
              style={{ width: 182, height: 182, borderWidth: 1, borderColor: 'rgba(0,0,0,0.55)' }}
            >
              <Image
                source={JNAME_IMAGES[jName]}
                accessibilityIgnoresInvertColors
                accessibilityLabel={`${jName} picture`}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </ImageBackground>
            {/* The strip of yellow tape over the top-left corner. */}
            <View
              style={{
                position: 'absolute',
                left: -12,
                top: 4,
                width: 62,
                height: 22,
                backgroundColor: POSTER.tape,
                opacity: 0.85,
                transform: [{ rotate: '-38deg' }]
              }}
            />
          </View>

          {/* The blue paper note with the one nice thing we could find. */}
          <View style={{ flex: 1, height: 182 }}>
            <Image
              source={POSTER_ART.paperBlue}
              accessibilityIgnoresInvertColors
              style={{ position: 'absolute', left: 0, top: 4, width: 192, height: 174 }}
              resizeMode="stretch"
            />
            {/* The black label bar, painted on with a rough brush. */}
            <View style={{ marginTop: 48, alignItems: 'center' }}>
              <View style={{ width: 154, height: 22, justifyContent: 'center' }}>
                <Image
                  source={POSTER_ART.lineLabel}
                  accessibilityIgnoresInvertColors
                  style={{ position: 'absolute', left: 0, top: 0, width: 154, height: 22 }}
                  resizeMode="stretch"
                />
                <Text
                  style={{
                    fontFamily: POSTER_FONT.mono,
                    fontSize: 11,
                    textAlign: 'center',
                    color: POSTER.white
                  }}
                >
                  REDEEMING QUALITY
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={{
                  marginTop: 12,
                  width: 168,
                  textAlign: 'center',
                  fontFamily: POSTER_FONT.mono,
                  fontSize: 17,
                  lineHeight: 21,
                  color: POSTER.ink
                }}
              >
                {`\u201C${card.redeeming_quality}\u201D`}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ THE ROAST: the paragraph about you ============ */}
        <Text
          style={{
            marginTop: 18,
            fontFamily: POSTER_FONT.body,
            fontSize: 15,
            lineHeight: 22,
            color: POSTER.ink
          }}
        >
          {card.description}
        </Text>
      </View>

      {/* ================= RED FLAGS: stickers on a torn pink panel ============== */}
      <View style={{ marginTop: 18, paddingHorizontal: PAD }}>
        <ImageBackground
          source={POSTER_ART.paperRedFlags}
          resizeMode="stretch"
          style={{ width: CONTENT_W, paddingBottom: 18 }}
        >
          {/* The title, outlined in cream so it pops off the pink. */}
          <View style={{ paddingLeft: 18, paddingTop: 14 }}>
            <StrokeText
              stroke={5}
              strokeColor={POSTER.cream}
              style={{
                fontFamily: POSTER_FONT.display,
                fontSize: 30,
                lineHeight: 34,
                letterSpacing: 2.2,
                color: POSTER.pink
              }}
            >
              RED FLAGS
            </StrokeText>
          </View>

          {/* The little paper flag pinned in the corner. */}
          <Image
            source={POSTER_ART.flag}
            accessibilityIgnoresInvertColors
            style={{ position: 'absolute', right: 14, top: 16, width: 42, height: 43 }}
            resizeMode="contain"
          />

          {/* THE FLAGS THEMSELVES: each one is dealt onto the next sticker in the
              set and tilted a little, so any number of flags still looks like a
              hand-made collage instead of a list. */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingTop: 4
            }}
          >
            {card.red_flags.map((flag, i) => {
              const sticker = STICKERS[i % STICKERS.length];
              return (
                <View
                  key={i}
                  style={{
                    margin: 5,
                    maxWidth: CONTENT_W - 40,
                    transform: [{ rotate: `${sticker.tilt}deg` }]
                  }}
                >
                  <ImageBackground
                    source={sticker.art}
                    resizeMode="stretch"
                    style={{ paddingVertical: 11, paddingHorizontal: 15 }}
                  >
                    <Text
                      style={{
                        fontFamily: POSTER_FONT.sticker,
                        fontSize: 12,
                        lineHeight: 13.5,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        color: sticker.onColor
                      }}
                    >
                      {flag}
                    </Text>
                  </ImageBackground>
                </View>
              );
            })}
          </View>
        </ImageBackground>
      </View>

      {/* ================= THE TWO LITTLE WINDOWS AT THE BOTTOM ================== */}
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 16, paddingHorizontal: PAD }}>
        <QuoteWindow quote={card.quote} />
        <ChatWindow lines={card.text_thread} />
      </View>
    </View>
  );
}

// ============================================
// THE QUOTE WINDOW: a fake 90s desktop window holding the sentence this person
// says constantly, with a blinking-cursor block after it.
// ============================================
function QuoteWindow({ quote }: { quote: string }) {
  return (
    <OffsetShadowBox width={186} height={172} background={POSTER.white}>
      {/* The title bar: the word QUOTE and the minimise / maximise / close marks. */}
      <Text
        style={{
          position: 'absolute',
          left: 14,
          top: 6,
          fontFamily: POSTER_FONT.pixel,
          fontSize: 18,
          color: POSTER.ink
        }}
      >
        QUOTE
      </Text>
      <View
        style={{
          position: 'absolute',
          right: 10,
          top: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6
        }}
      >
        <View style={{ width: 11, height: 2, backgroundColor: POSTER.ink, marginTop: 8 }} />
        <View style={{ width: 10, height: 10, borderWidth: 1.5, borderColor: POSTER.ink }} />
        <Text style={{ fontFamily: POSTER_FONT.mono, fontSize: 12, color: POSTER.ink }}>
          {'\u2715'}
        </Text>
      </View>

      {/* The periwinkle panel with the quote inside it. */}
      <View
        style={{
          position: 'absolute',
          left: 11,
          top: 30,
          right: 11,
          bottom: 12,
          backgroundColor: POSTER.shadow,
          borderWidth: 3,
          borderColor: POSTER.ink,
          paddingHorizontal: 12,
          paddingTop: 14
        }}
      >
        <Text
          style={{
            fontFamily: POSTER_FONT.pixel,
            fontSize: quoteSize(quote),
            lineHeight: quoteSize(quote) * 1.15,
            color: POSTER.ink
          }}
        >
          {`\u201C${quote}\u201D`}
          <Text style={{ color: POSTER.ink }}>{' \u2588'}</Text>
        </Text>
      </View>
    </OffsetShadowBox>
  );
}

// ============================================
// THE CHAT WINDOW: a pretend text thread, drawn like an old chat client with
// glossy blue "you" bubbles and green "them" bubbles over a desktop wallpaper.
// A line marked as an action (for example "never texts again") is narration,
// so it is printed plainly in the middle instead of in a bubble.
// ============================================
function ChatWindow({
  lines
}: {
  lines: Array<{ from: 'me' | 'them'; text: string; action?: boolean }>;
}) {
  return (
    <OffsetShadowBox width={190} height={172} background={POSTER.ink}>
      <ImageBackground
        source={POSTER_ART.chatBg}
        resizeMode="cover"
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 8, gap: 5 }}
      >
        {lines.map((line, i) => {
          // THIS SECTION DOES: narration like "sends nudes" sits in a cream
          // chip so it stays readable on the busy chat wallpaper.
          if (line.action) {
            return (
              <View
                key={i}
                style={{
                  alignSelf: 'center',
                  maxWidth: '100%',
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: POSTER.ink,
                  backgroundColor: POSTER.cream,
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: POSTER_FONT.pixel,
                    fontSize: 9,
                    lineHeight: 11,
                    textAlign: 'center',
                    color: POSTER.ink
                  }}
                >
                  {`*${line.text}*`}
                </Text>
              </View>
            );
          }
          const mine = line.from === 'me';
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              {/* The little buddy-icon square next to each message. */}
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  backgroundColor: mine ? 'rgb(116,166,240)' : 'rgb(129,235,91)'
                }}
              >
                <Image
                  source={mine ? POSTER_ART.avatarMe : POSTER_ART.avatarThem}
                  accessibilityIgnoresInvertColors
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              {/* The bubble. */}
              <View
                style={{
                  flex: 1,
                  borderRadius: 5,
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  backgroundColor: mine ? 'rgb(29,111,232)' : 'rgb(53,168,18)'
                }}
              >
                <Text
                  style={{
                    fontFamily: POSTER_FONT.pixel,
                    fontSize: 8,
                    lineHeight: 9,
                    color: mine ? 'rgb(180,205,250)' : 'rgb(255,190,225)'
                  }}
                >
                  {mine ? 'Me:' : 'Them:'}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: POSTER_FONT.pixel,
                    fontSize: 8.5,
                    lineHeight: 10,
                    color: POSTER.white
                  }}
                >
                  {`\u201C${line.text}\u201D`}
                </Text>
              </View>
            </View>
          );
        })}
      </ImageBackground>
    </OffsetShadowBox>
  );
}

// ============================================
// A shared helper: a hard-edged box with a black outline and a solid
// periwinkle shadow nudged down and to the right (no soft blur, on purpose).
// ============================================
function OffsetShadowBox({
  width,
  height,
  background,
  children
}: {
  width: number;
  height: number;
  background: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ width, height }}>
      <View
        style={{
          position: 'absolute',
          left: 4,
          top: 3,
          width,
          height,
          backgroundColor: POSTER.shadow
        }}
      />
      <View
        style={{
          width,
          height,
          backgroundColor: background,
          borderWidth: 3,
          borderColor: POSTER.ink
        }}
      >
        {children}
      </View>
    </View>
  );
}
