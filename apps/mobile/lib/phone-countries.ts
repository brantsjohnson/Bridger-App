// ============================================
// WHAT THIS FILE DOES (plain English):
// The list of country dial codes for Sign in (phone OTP). Someone picks a
// country, then types their local number. We turn that into E.164 (+…) so
// people outside the US are not stuck behind a US-only assumption.
//
// PRIVACY: analytics may record the 2-letter country (US, GB…), never the
// phone digits.
// ============================================
import * as Localization from 'expo-localization';

/** One row in the country dial picker. */
export type PhoneCountry = {
  /** ISO 3166-1 alpha-2 (US, GB, …). */
  iso: string;
  /** Digits only, no plus (1, 44, 61…). */
  dial: string;
  /** English display name for search. */
  name: string;
};

/**
 * Common countries for SMS sign-in. Not every ISO territory; enough that
 * search finds the usual dial codes. Sorted later by the picker.
 */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'US', dial: '1', name: 'United States' },
  { iso: 'CA', dial: '1', name: 'Canada' },
  { iso: 'GB', dial: '44', name: 'United Kingdom' },
  { iso: 'AU', dial: '61', name: 'Australia' },
  { iso: 'NZ', dial: '64', name: 'New Zealand' },
  { iso: 'IE', dial: '353', name: 'Ireland' },
  { iso: 'IN', dial: '91', name: 'India' },
  { iso: 'MX', dial: '52', name: 'Mexico' },
  { iso: 'BR', dial: '55', name: 'Brazil' },
  { iso: 'AR', dial: '54', name: 'Argentina' },
  { iso: 'CL', dial: '56', name: 'Chile' },
  { iso: 'CO', dial: '57', name: 'Colombia' },
  { iso: 'PE', dial: '51', name: 'Peru' },
  { iso: 'DE', dial: '49', name: 'Germany' },
  { iso: 'FR', dial: '33', name: 'France' },
  { iso: 'ES', dial: '34', name: 'Spain' },
  { iso: 'IT', dial: '39', name: 'Italy' },
  { iso: 'PT', dial: '351', name: 'Portugal' },
  { iso: 'NL', dial: '31', name: 'Netherlands' },
  { iso: 'BE', dial: '32', name: 'Belgium' },
  { iso: 'CH', dial: '41', name: 'Switzerland' },
  { iso: 'AT', dial: '43', name: 'Austria' },
  { iso: 'SE', dial: '46', name: 'Sweden' },
  { iso: 'NO', dial: '47', name: 'Norway' },
  { iso: 'DK', dial: '45', name: 'Denmark' },
  { iso: 'FI', dial: '358', name: 'Finland' },
  { iso: 'PL', dial: '48', name: 'Poland' },
  { iso: 'CZ', dial: '420', name: 'Czechia' },
  { iso: 'RO', dial: '40', name: 'Romania' },
  { iso: 'GR', dial: '30', name: 'Greece' },
  { iso: 'TR', dial: '90', name: 'Turkey' },
  { iso: 'UA', dial: '380', name: 'Ukraine' },
  { iso: 'RU', dial: '7', name: 'Russia' },
  { iso: 'IL', dial: '972', name: 'Israel' },
  { iso: 'AE', dial: '971', name: 'United Arab Emirates' },
  { iso: 'SA', dial: '966', name: 'Saudi Arabia' },
  { iso: 'EG', dial: '20', name: 'Egypt' },
  { iso: 'ZA', dial: '27', name: 'South Africa' },
  { iso: 'NG', dial: '234', name: 'Nigeria' },
  { iso: 'KE', dial: '254', name: 'Kenya' },
  { iso: 'GH', dial: '233', name: 'Ghana' },
  { iso: 'JP', dial: '81', name: 'Japan' },
  { iso: 'KR', dial: '82', name: 'South Korea' },
  { iso: 'CN', dial: '86', name: 'China' },
  { iso: 'HK', dial: '852', name: 'Hong Kong' },
  { iso: 'TW', dial: '886', name: 'Taiwan' },
  { iso: 'SG', dial: '65', name: 'Singapore' },
  { iso: 'MY', dial: '60', name: 'Malaysia' },
  { iso: 'TH', dial: '66', name: 'Thailand' },
  { iso: 'VN', dial: '84', name: 'Vietnam' },
  { iso: 'PH', dial: '63', name: 'Philippines' },
  { iso: 'ID', dial: '62', name: 'Indonesia' },
  { iso: 'PK', dial: '92', name: 'Pakistan' },
  { iso: 'BD', dial: '880', name: 'Bangladesh' },
  { iso: 'LK', dial: '94', name: 'Sri Lanka' },
  { iso: 'NP', dial: '977', name: 'Nepal' },
  { iso: 'PR', dial: '1', name: 'Puerto Rico' },
  { iso: 'DO', dial: '1', name: 'Dominican Republic' },
  { iso: 'JM', dial: '1', name: 'Jamaica' },
  { iso: 'CR', dial: '506', name: 'Costa Rica' },
  { iso: 'PA', dial: '507', name: 'Panama' },
  { iso: 'GT', dial: '502', name: 'Guatemala' },
  { iso: 'HN', dial: '504', name: 'Honduras' },
  { iso: 'SV', dial: '503', name: 'El Salvador' },
  { iso: 'NI', dial: '505', name: 'Nicaragua' },
  { iso: 'UY', dial: '598', name: 'Uruguay' },
  { iso: 'PY', dial: '595', name: 'Paraguay' },
  { iso: 'BO', dial: '591', name: 'Bolivia' },
  { iso: 'EC', dial: '593', name: 'Ecuador' },
  { iso: 'VE', dial: '58', name: 'Venezuela' },
  { iso: 'IS', dial: '354', name: 'Iceland' },
  { iso: 'LU', dial: '352', name: 'Luxembourg' },
  { iso: 'HU', dial: '36', name: 'Hungary' },
  { iso: 'SK', dial: '421', name: 'Slovakia' },
  { iso: 'SI', dial: '386', name: 'Slovenia' },
  { iso: 'HR', dial: '385', name: 'Croatia' },
  { iso: 'RS', dial: '381', name: 'Serbia' },
  { iso: 'BG', dial: '359', name: 'Bulgaria' },
  { iso: 'LT', dial: '370', name: 'Lithuania' },
  { iso: 'LV', dial: '371', name: 'Latvia' },
  { iso: 'EE', dial: '372', name: 'Estonia' },
  { iso: 'CY', dial: '357', name: 'Cyprus' },
  { iso: 'MT', dial: '356', name: 'Malta' },
  { iso: 'QA', dial: '974', name: 'Qatar' },
  { iso: 'KW', dial: '965', name: 'Kuwait' },
  { iso: 'BH', dial: '973', name: 'Bahrain' },
  { iso: 'OM', dial: '968', name: 'Oman' },
  { iso: 'JO', dial: '962', name: 'Jordan' },
  { iso: 'LB', dial: '961', name: 'Lebanon' },
  { iso: 'MA', dial: '212', name: 'Morocco' },
  { iso: 'TN', dial: '216', name: 'Tunisia' },
  { iso: 'DZ', dial: '213', name: 'Algeria' },
  { iso: 'ET', dial: '251', name: 'Ethiopia' },
  { iso: 'TZ', dial: '255', name: 'Tanzania' },
  { iso: 'UG', dial: '256', name: 'Uganda' },
  { iso: 'RW', dial: '250', name: 'Rwanda' },
  { iso: 'SN', dial: '221', name: 'Senegal' },
  { iso: 'CI', dial: '225', name: 'Ivory Coast' },
  { iso: 'CM', dial: '237', name: 'Cameroon' },
  { iso: 'AO', dial: '244', name: 'Angola' },
  { iso: 'MZ', dial: '258', name: 'Mozambique' },
  { iso: 'ZW', dial: '263', name: 'Zimbabwe' },
  { iso: 'MU', dial: '230', name: 'Mauritius' },
  { iso: 'KH', dial: '855', name: 'Cambodia' },
  { iso: 'LA', dial: '856', name: 'Laos' },
  { iso: 'MM', dial: '95', name: 'Myanmar' },
  { iso: 'BN', dial: '673', name: 'Brunei' },
  { iso: 'FJ', dial: '679', name: 'Fiji' },
  { iso: 'PG', dial: '675', name: 'Papua New Guinea' },
  { iso: 'GU', dial: '1', name: 'Guam' },
  { iso: 'AS', dial: '1', name: 'American Samoa' },
  { iso: 'VI', dial: '1', name: 'U.S. Virgin Islands' },
  { iso: 'MP', dial: '1', name: 'Northern Mariana Islands' }
];

const BY_ISO = new Map(PHONE_COUNTRIES.map((c) => [c.iso, c]));

/** Look up a country by ISO code. */
export function findPhoneCountry(iso: string): PhoneCountry | undefined {
  return BY_ISO.get(iso.trim().toUpperCase());
}

/**
 * Turn a 2-letter country code into a flag emoji (🇺🇸 from US).
 * Empty string if the code is not two letters.
 */
export function flagEmojiForIso(iso: string): string {
  const cc = iso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  const A = 0x1f1e6;
  return String.fromCodePoint(...[...cc].map((ch) => A + (ch.charCodeAt(0) - 65)));
}

/**
 * Guess the starting country from the phone's region setting.
 * Falls back to United States when the region is unknown.
 */
export function guessDefaultPhoneCountry(): PhoneCountry {
  try {
    const locales = Localization.getLocales?.() ?? [];
    for (const loc of locales) {
      const region = loc.regionCode?.toUpperCase();
      if (!region) continue;
      const hit = findPhoneCountry(region);
      if (hit) return hit;
    }
  } catch {
    // Localization can throw in odd test environments; US is fine.
  }
  return findPhoneCountry('US')!;
}

/**
 * Filter countries by name, ISO, or dial digits. Never logs the query.
 */
export function filterPhoneCountries(query: string): PhoneCountry[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...PHONE_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
  }
  const dialDigits = q.replace(/[^\d]/g, '');
  return PHONE_COUNTRIES.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if (c.iso.toLowerCase().includes(q)) return true;
    if (dialDigits && c.dial.includes(dialDigits)) return true;
    if (q.startsWith('+') && c.dial.startsWith(dialDigits)) return true;
    return false;
  }).sort((a, b) => a.name.localeCompare(b.name));
}
