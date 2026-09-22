// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that matching embeddings keep meaning (words and dial numbers)
// and do not swap that meaning for an identity label.
// ============================================
import { describe, expect, it } from 'vitest';
import { normalizeAttribute, normalizePersonCorpus } from './normalize';

describe('normalizeAttribute', () => {
  it('embeds a quiz dial number, not the dimension title', () => {
    const line = normalizeAttribute({
      key: 'quiz.personality.sociability',
      value: {
        score: 0.22,
        label: 'Sociability',
        quizId: 'personality',
        confidence: 0.9
      }
    });
    expect(line).toBe('quiz.personality.sociability: 0.22 confidence 0.9');
    expect(line).not.toContain('Sociability');
  });

  it('drops a quiz row that has a title but no score', () => {
    expect(
      normalizeAttribute({
        key: 'quiz.personality.sociability',
        value: { label: 'Introvert' }
      })
    ).toBe('');
  });

  it('keeps a hobby name and the words they wrote about it', () => {
    const line = normalizeAttribute({
      key: 'hobby:jazz',
      value: {
        id: 'jazz',
        label: 'Jazz',
        emoji: '🎷',
        followUp: {
          question: 'Who got you into it?',
          answer: 'My dad, endless Coltrane'
        }
      }
    });
    expect(line).toBe('hobby:jazz: Jazz - My dad, endless Coltrane');
    expect(line).not.toContain('🎷');
  });

  it('keeps a place name and note, not the map pin', () => {
    const line = normalizeAttribute({
      key: 'place:pl1',
      value: {
        label: 'Lisbon',
        note: 'A week of trams',
        lat: 38.72,
        lng: -9.14
      }
    });
    expect(line).toBe('place:pl1: Lisbon - A week of trams');
    expect(line).not.toContain('38.72');
    expect(line).not.toContain('-9.14');
  });

  it('keeps the this-or-that option they picked', () => {
    expect(
      normalizeAttribute({
        key: 'tot:t1',
        value: { a: 'Coffee', b: 'Tea', pick: 'a', emoji: '☕' }
      })
    ).toBe('tot:t1: Coffee');
  });

  it('embeds favorite items, not only the group title', () => {
    const line = normalizeAttribute({
      key: 'fav:food',
      value: { group: 'Food', emoji: '🍜', items: ['Thai', 'Ramen'], total: 2 }
    });
    expect(line).toBe('fav:food: Food - Thai, Ramen');
  });
});

describe('normalizePersonCorpus', () => {
  it('skips empty rows so a label-only quiz cannot enter the vector', () => {
    const corpus = normalizePersonCorpus([
      {
        key: 'quiz.personality.sociability',
        value: { label: 'Sociability' }
      },
      { key: 'hobby:film', value: { label: 'Film photos' } }
    ]);
    expect(corpus).toBe('hobby:film: Film photos');
  });
});
