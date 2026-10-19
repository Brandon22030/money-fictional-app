import { getVisualFixture, type VisualFixture } from '@/src/dev/visualFixture';

const fixture: VisualFixture = {
  transactions: [],
  dailyDelta: { amountMinor: 841200, percent: 4.73 },
  kindShares: { receive: 45, send: 25, pay: 18, withdraw: 12 },
  monthly: [{ in: 46, out: 22 }],
};

describe('getVisualFixture', () => {
  const original = process.env.EXPO_PUBLIC_VISUAL_FIXTURE;

  beforeEach(() => {
    globalThis.__ABONDA_VISUAL_FIXTURE__ = fixture;
  });

  afterEach(() => {
    delete globalThis.__ABONDA_VISUAL_FIXTURE__;
    if (original === undefined) delete process.env.EXPO_PUBLIC_VISUAL_FIXTURE;
    else process.env.EXPO_PUBLIC_VISUAL_FIXTURE = original;
  });

  it('is undefined when the env variable is absent, even if a fixture is injected', () => {
    delete process.env.EXPO_PUBLIC_VISUAL_FIXTURE;
    expect(getVisualFixture()).toBeUndefined();
  });

  it.each(['0', '', 'true', 'yes'])('is undefined when the env variable is %p', (value) => {
    process.env.EXPO_PUBLIC_VISUAL_FIXTURE = value;
    expect(getVisualFixture()).toBeUndefined();
  });

  it('returns the injected fixture only when the variable is exactly 1', () => {
    process.env.EXPO_PUBLIC_VISUAL_FIXTURE = '1';
    expect(getVisualFixture()).toBe(fixture);
  });

  it('is undefined with the variable set but nothing injected', () => {
    process.env.EXPO_PUBLIC_VISUAL_FIXTURE = '1';
    delete globalThis.__ABONDA_VISUAL_FIXTURE__;
    expect(getVisualFixture()).toBeUndefined();
  });
});
