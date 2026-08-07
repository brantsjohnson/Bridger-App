// ============================================
// WHAT THIS FILE DOES (plain English):
// Last scrub before embedding: strip emails, phones, and @handles from text
// so Zone C vectors never carry contact info.
// ============================================
export { stripPiiFromText as scrubTextForEmbed } from '../gateway/scrub';
