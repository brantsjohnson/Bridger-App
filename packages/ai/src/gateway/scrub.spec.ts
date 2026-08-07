// ============================================
// WHAT THIS FILE DOES (plain English):
// Unit tests for the PII scrubber: prove emails/names/media are rejected on
// the deidentified lane, and personal_agent requires a signed-in user.
// ============================================
import { describe, expect, it } from 'vitest';
import { ScrubError, scrubPayload } from './scrub';

describe('scrubPayload deidentified', () => {
  it('accepts opaque subject and fact text', () => {
    const result = scrubPayload('person_summary', {
      subject_ref: '00000000-0000-4000-8000-000000000001',
      facts: ['hobby: climbing']
    });
    expect(result.ok).toBe(true);
    expect(result.lane).toBe('deidentified');
  });

  it('rejects email keys', () => {
    expect(() =>
      scrubPayload('day_summary', {
        subject_ref: '00000000-0000-4000-8000-000000000001',
        email: 'a@b.com'
      })
    ).toThrow(ScrubError);
  });

  it('rejects media keys', () => {
    expect(() =>
      scrubPayload('day_summary', {
        subject_ref: '00000000-0000-4000-8000-000000000001',
        photo_url: 'https://example.com/x.jpg'
      })
    ).toThrow(ScrubError);
  });

  it('redacts emails inside free text', () => {
    const result = scrubPayload('day_summary', {
      subject_ref: '00000000-0000-4000-8000-000000000001',
      user_prompt: 'reach me at test@example.com please'
    });
    expect(String(result.payload.user_prompt)).toContain('[redacted-email]');
  });

  it('rejects display-name subject refs', () => {
    expect(() =>
      scrubPayload('person_summary', {
        subject_ref: 'Maya Chen',
        facts: ['hobby: climbing']
      })
    ).toThrow(ScrubError);
  });
});

describe('scrubPayload personal_agent', () => {
  it('hard-fails without principal', () => {
    expect(() =>
      scrubPayload('agent_reasoning', {
        query: 'what does Lindsey like?'
      })
    ).toThrow(/principalId/);
  });

  it('accepts with principal and still rejects media', () => {
    expect(() =>
      scrubPayload(
        'agent_reasoning',
        { query: 'hi', media: 'x' },
        { principalId: '00000000-0000-4000-8000-000000000001' }
      )
    ).toThrow(ScrubError);
  });
});
