import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_BALANCE_MINOR } from '@/src/config/locale';
import { isLuhnValid } from '@/src/domain/card';
import { useAppStore } from '@/src/store/useAppStore';

const STORAGE_KEY = 'abonda-store-v1';

beforeEach(async () => {
  await AsyncStorage.clear();
  useAppStore.getState().resetAll();
  useAppStore.getState().setCurrency('XOF');
  useAppStore.getState().setBalance(1000);
});

describe('persistence', () => {
  it('restores state after a simulated rehydration and does not persist hasHydrated', async () => {
    useAppStore.getState().setBalance(4242);
    useAppStore.getState().setHolderName('Ada');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string).state;
    expect(persisted).not.toHaveProperty('hasHydrated');
    expect(persisted.balanceMinor).toBe(4242);

    useAppStore.setState({ balanceMinor: 1, holderName: 'X' });
    await AsyncStorage.setItem(STORAGE_KEY, raw as string);
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().balanceMinor).toBe(4242);
    expect(useAppStore.getState().holderName).toBe('ADA');
    expect(useAppStore.getState().hasHydrated).toBe(true);
  });
});

describe('setBalance', () => {
  it('clamps to the allowed range and rounds', () => {
    const { setBalance } = useAppStore.getState();
    setBalance(-50);
    expect(useAppStore.getState().balanceMinor).toBe(0);
    setBalance(MAX_BALANCE_MINOR * 2);
    expect(useAppStore.getState().balanceMinor).toBe(MAX_BALANCE_MINOR);
    setBalance(1234.6);
    expect(useAppStore.getState().balanceMinor).toBe(1235);
  });

  it('ignores non finite values', () => {
    useAppStore.getState().setBalance(Number.NaN);
    expect(useAppStore.getState().balanceMinor).toBe(1000);
  });
});

describe('applyIntention', () => {
  it('credits on receive and prepends a transaction', () => {
    const result = useAppStore.getState().applyIntention('receive', 500);
    expect(result).toEqual({ ok: true });
    const state = useAppStore.getState();
    expect(state.balanceMinor).toBe(1500);
    expect(state.userTransactions[0]).toMatchObject({ kind: 'receive', amountMinor: 500 });
  });

  it.each(['send', 'pay', 'withdraw'] as const)('debits on %s', (kind) => {
    expect(useAppStore.getState().applyIntention(kind, 400)).toEqual({ ok: true });
    expect(useAppStore.getState().balanceMinor).toBe(600);
  });

  it('keeps the newest transaction first and stores label options', () => {
    const { applyIntention } = useAppStore.getState();
    applyIntention('receive', 10);
    applyIntention('pay', 20, { labelKey: 'content:intentions.coffee', labelParams: { who: 'Ada' } });
    const [first, second] = useAppStore.getState().userTransactions;
    expect(first).toMatchObject({ kind: 'pay', labelKey: 'content:intentions.coffee' });
    expect(first.labelParams).toEqual({ who: 'Ada' });
    expect(second.kind).toBe('receive');
  });

  it('refuses a debit above the balance without changes', () => {
    const result = useAppStore.getState().applyIntention('send', 1001);
    expect(result).toEqual({ ok: false, reason: 'insufficient' });
    expect(useAppStore.getState().balanceMinor).toBe(1000);
    expect(useAppStore.getState().userTransactions).toHaveLength(0);
  });

  it('refuses non positive and invalid amounts', () => {
    const { applyIntention } = useAppStore.getState();
    expect(applyIntention('receive', 0)).toEqual({ ok: false, reason: 'invalid' });
    expect(applyIntention('pay', -5)).toEqual({ ok: false, reason: 'invalid' });
    expect(applyIntention('pay', Number.NaN)).toEqual({ ok: false, reason: 'invalid' });
    expect(useAppStore.getState().balanceMinor).toBe(1000);
  });

  it('refuses a credit beyond the maximum balance', () => {
    expect(useAppStore.getState().applyIntention('receive', MAX_BALANCE_MINOR)).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });
});

describe('setHolderName', () => {
  it('trims, uppercases and limits to 26 characters', () => {
    useAppStore.getState().setHolderName('  ada lovelace  ');
    expect(useAppStore.getState().holderName).toBe('ADA LOVELACE');
    useAppStore.getState().setHolderName('a'.repeat(40));
    expect(useAppStore.getState().holderName).toBe('A'.repeat(26));
  });

  it('falls back to the translated default when empty', () => {
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().setHolderName('   ');
    expect(useAppStore.getState().holderName).toBe('TITULAIRE ABONDA');
    useAppStore.getState().setLanguage('en');
    useAppStore.getState().setHolderName('');
    expect(useAppStore.getState().holderName).toBe('ABONDA HOLDER');
  });
});

describe('currency, card and reset', () => {
  it('keeps the numeric value when switching currency precision', () => {
    useAppStore.getState().setCurrency('EUR');
    expect(useAppStore.getState().balanceMinor).toBe(100000);
    useAppStore.getState().setCurrency('XOF');
    expect(useAppStore.getState().balanceMinor).toBe(1000);
  });

  it('regenerates an invalid-Luhn card', () => {
    const before = useAppStore.getState().card.number;
    useAppStore.getState().regenerateCard();
    const { card } = useAppStore.getState();
    expect(card.number).toMatch(/^8\d{15}$/);
    expect(isLuhnValid(card.number)).toBe(false);
    expect(card.number).not.toBe(before);
  });

  it('resets everything to defaults', () => {
    useAppStore.getState().applyIntention('receive', 10);
    useAppStore.getState().resetAll();
    const state = useAppStore.getState();
    expect(state.userTransactions).toHaveLength(0);
    expect(state.balanceMinor).toBeGreaterThanOrEqual(1_000_000);
  });
});
