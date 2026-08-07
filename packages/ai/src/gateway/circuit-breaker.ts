// ============================================
// WHAT THIS FILE DOES (plain English):
// If a provider (Anthropic or OpenAI) keeps failing, we stop calling it for a
// while so we do not burn money or pile up errors. Per-provider, in memory.
// ============================================

export interface CircuitBreakerOptions {
  /** Failures before opening. */
  failureThreshold?: number;
  /** How long to stay open (ms). */
  coolDownMs?: number;
}

type State = 'closed' | 'open' | 'half_open';

export class CircuitBreaker {
  private failures = 0;
  private state: State = 'closed';
  private openedAt = 0;
  private readonly failureThreshold: number;
  private readonly coolDownMs: number;

  constructor(
    private readonly name: string,
    opts: CircuitBreakerOptions = {}
  ) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.coolDownMs = opts.coolDownMs ?? 60_000;
  }

  /** Returns false when the circuit is open and still cooling down. */
  canRequest(now = Date.now()): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (now - this.openedAt >= this.coolDownMs) {
        this.state = 'half_open';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(now = Date.now()): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold || this.state === 'half_open') {
      this.state = 'open';
      this.openedAt = now;
    }
  }

  getStatus() {
    return { name: this.name, state: this.state, failures: this.failures };
  }
}
