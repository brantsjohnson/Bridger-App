// ============================================
// WHAT THIS FILE DOES (plain English):
// The phone number row on Sign in: a country dial chip (+1 🇺🇸) next to the
// number box, plus a searchable sheet to pick another country. That way
// someone in the UK or India is not forced into a US-only assumption.
//
// PRIVACY: analytics may store the 2-letter country (US, GB), never the
// digits they type.
// ============================================
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { ChevronDownIcon } from 'lucide-react-native';
import { AUTH } from '@bridger/shared';
import {
  SearchField,
  Sheet,
  TextField,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import {
  filterPhoneCountries,
  flagEmojiForIso,
  type PhoneCountry
} from '../../lib/phone-countries';

export function PhoneCountryField({
  country,
  onCountryChange,
  phoneRaw,
  onPhoneChange,
  onSubmitEditing
}: {
  country: PhoneCountry;
  onCountryChange: (next: PhoneCountry) => void;
  phoneRaw: string;
  onPhoneChange: (next: string) => void;
  onSubmitEditing?: () => void;
}) {
  const c = useThemeColors();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  // THIS SECTION DOES: filter the country list by name, ISO, or dial digits.
  const rows = useMemo(() => filterPhoneCountries(query), [query]);

  const openSheet = withAnalyticsPress(
    AUTH.sign_in.country_code,
    () => setSheetOpen(true),
    {
      analyticsProps: { country_iso: country.iso }
    }
  );

  function closeSheet() {
    setSheetOpen(false);
    setQuery('');
  }

  function pickCountry(next: PhoneCountry) {
    onCountryChange(next);
    closeSheet();
  }

  const flag = flagEmojiForIso(country.iso);

  return (
    <View className="w-full gap-1.5">
      <Text className="font-sans-b text-[12px] text-ink-soft">Phone number</Text>

      {/* THIS SECTION DOES: country dial chip + local number field side by side. */}
      <View className="flex-row items-start gap-2">
        <Pressable
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel={`Country code ${flag} plus ${country.dial}. ${country.name}`}
          accessibilityHint="Opens a list to pick another country"
          className="h-12 flex-row items-center gap-1 rounded-2xl border border-ink-line bg-canvas-raised px-3 active:opacity-80"
          style={{ minWidth: 96 }}
        >
          <Text className="font-sans-sb text-[16px] text-ink" accessibilityElementsHidden>
            {flag ? `${flag} ` : ''}
            <Text className="font-sans-sb text-[16px] text-ink">+{country.dial}</Text>
          </Text>
          <ChevronDownIcon size={16} color={c.inkSoft} strokeWidth={2.5} />
        </Pressable>

        <View className="min-w-0 flex-1">
          <TextField
            value={phoneRaw}
            onChange={onPhoneChange}
            placeholder={country.dial === '1' ? '(555) 123-4567' : 'Local number'}
            type="phone"
            autoComplete="tel"
            analyticsId={AUTH.sign_in.phone}
            onSubmitEditing={onSubmitEditing}
            accessibilityLabel="Phone number without country code"
            accessibilityHint={`Country code plus ${country.dial} is already selected`}
          />
        </View>
      </View>

      {/* THIS SECTION DOES: searchable country list as its own analytics surface. */}
      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title="Country code"
        surface="auth_country_sheet"
        parentScreen="auth"
        dismissAnalyticsId={AUTH.sign_in.country_dismiss}
      >
        <View className="gap-3" style={{ maxHeight: 420 }}>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search country or +44"
            analyticsId={AUTH.sign_in.country_search}
          />
          <FlatList
            data={rows}
            keyExtractor={(item) => item.iso}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 340 }}
            ListEmptyComponent={
              <Text className="py-6 text-center font-sans-sb text-[16px] text-ink-mute">
                No countries match.
              </Text>
            }
            renderItem={({ item }) => {
              const selected = item.iso === country.iso;
              const itemFlag = flagEmojiForIso(item.iso);
              return (
                <Pressable
                  onPress={withAnalyticsPress(
                    AUTH.sign_in.country_row,
                    () => pickCountry(item),
                    { analyticsProps: { country_iso: item.iso } }
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name}, plus ${item.dial}`}
                  className={`mb-1 flex-row items-center justify-between rounded-2xl px-3 py-3 active:opacity-80 ${
                    selected ? 'bg-ink/5' : ''
                  }`}
                >
                  <View className="min-w-0 flex-1 flex-row items-center gap-3">
                    <Text className="text-[20px]">{itemFlag}</Text>
                    <Text
                      className="min-w-0 flex-1 font-sans-sb text-[16px] text-ink"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <Text className="ml-3 font-sans-sb text-[16px] text-ink-mute">
                    +{item.dial}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}
