import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_BALANCE_MINOR } from '@/src/config/locale';
import { isLuhnValid } from '@/src/domain/card';
import { MAX_USER_TRANSACTIONS, useAppStore } from '@/src/store/useAppStore';

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

describe('rehydration safety', () => {
  async function rehydrateWith(state: unknown, version = 1) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version }));
    await useAppStore.persist.rehydrate();
    return useAppStore.getState();
  }

  it('persists with version 1', async () => {
    useAppStore.getState().setBalance(77);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const raw = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(raw.version).toBe(1);
  });

  it('migrates version 0 data unchanged', async () => {
    const card = useAppStore.getState().card;
    const state = await rehydrateWith(
      { balanceMinor: 321, currency: 'XOF', language: 'en', holderName: 'ADA', card, userTransactions: [] },
      0,
    );
    expect(state).toMatchObject({ balanceMinor: 321, currency: 'XOF', language: 'en', holderName: 'ADA' });
  });

  it('falls back to defaults for an unknown currency', async () => {
    const before = useAppStore.getState();
    const state = await rehydrateWith({ currency: 'GBP' });
    expect(state.currency).toBe(before.currency);
    expect(state.balanceMinor).toBe(before.balanceMinor);
    expect(state.card).toEqual(before.card);
    expect(state.hasHydrated).toBe(true);
  });

  it('drops an unknown currency together with the amounts expressed in it', async () => {
    const before = useAppStore.getState();
    const state = await rehydrateWith({
      currency: 'GBP',
      balanceMinor: 5,
      userTransactions: [
        { id: 'a', kind: 'receive', labelKey: 'k', amountMinor: 5, createdAt: '2026-01-01T00:00:00.000Z' },
      ],
    });
    expect(state.balanceMinor).toBe(before.balanceMinor);
    expect(state.userTransactions).toEqual(before.userTransactions);
  });

  it('repairs corrupted fields one by one', async () => {
    const before = useAppStore.getState();
    const state = await rehydrateWith({
      currency: 'EUR',
      language: 'de',
      balanceMinor: 'lots',
      holderName: 42,
      card: { number: 'abc', expiry: '13/99', cvv: 1 },
      userTransactions: [
        { id: 'ok', kind: 'pay', labelKey: 'content:intentions.pay', amountMinor: 10, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'bad-kind', kind: 'steal', labelKey: 'x', amountMinor: 10, createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'bad-amount', kind: 'pay', labelKey: 'x', amountMinor: null, createdAt: '2026-01-01T00:00:00.000Z' },
        'garbage',
      ],
    });
    expect(state.currency).toBe('EUR');
    expect(state.language).toBe(before.language);
    expect(state.balanceMinor).toBe(before.balanceMinor);
    expect(state.card).toEqual(before.card);
    expect(state.holderName).toBe(useAppStore.getState().holderName);
    expect(state.holderName.length).toBeGreaterThan(0);
    expect(state.userTransactions.map((tx) => tx.id)).toEqual(['ok']);
  });

  it('drops rehydrated intentions whose amount is not a positive integer', async () => {
    const tx = (id: string, amountMinor: number) => ({
      id,
      kind: 'pay',
      labelKey: 'content:intentions.pay',
      amountMinor,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const state = await rehydrateWith({
      currency: 'XOF',
      userTransactions: [tx('ok', 1), tx('negative', -50), tx('zero', 0), tx('fraction', 1.5)],
    });
    expect(state.userTransactions.map((item) => item.id)).toEqual(['ok']);
  });

  it('keeps the current state when the payload is not an object', async () => {
    const before = useAppStore.getState();
    const state = await rehydrateWith(null);
    expect(state.balanceMinor).toBe(before.balanceMinor);
    expect(state.currency).toBe(before.currency);
  });

  it('clamps a rehydrated balance and caps rehydrated intentions', async () => {
    const tx = (i: number) => ({
      id: `t${i}`,
      kind: 'receive',
      labelKey: 'content:intentions.receive',
      amountMinor: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const state = await rehydrateWith({
      currency: 'XOF',
      balanceMinor: MAX_BALANCE_MINOR * 10,
      userTransactions: Array.from({ length: MAX_USER_TRANSACTIONS + 20 }, (_, i) => tx(i)),
    });
    expect(state.balanceMinor).toBe(MAX_BALANCE_MINOR);
    expect(state.userTransactions).toHaveLength(MAX_USER_TRANSACTIONS);
    expect(state.userTransactions[0]?.id).toBe('t0');
  });
});

describe('history visit', () => {
  it('starts with no recorded visit and records the History visit date', () => {
    expect(useAppStore.getState().lastHistoryVisitAt).toBeNull();
    useAppStore.getState().markHistoryVisited(new Date('2026-10-19T09:45:00.000Z'));
    expect(useAppStore.getState().lastHistoryVisitAt).toBe('2026-10-19T09:45:00.000Z');
  });

  it('persists the visit date and forgets it on reset', async () => {
    useAppStore.getState().markHistoryVisited(new Date('2026-10-19T09:45:00.000Z'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const raw = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(raw.state.lastHistoryVisitAt).toBe('2026-10-19T09:45:00.000Z');

    useAppStore.getState().resetAll();
    expect(useAppStore.getState().lastHistoryVisitAt).toBeNull();
  });

  async function rehydrateWith(state: unknown) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: 1 }));
    await useAppStore.persist.rehydrate();
    return useAppStore.getState();
  }

  it('rehydrates version 1 data saved before the field existed with no visit', async () => {
    const card = useAppStore.getState().card;
    const state = await rehydrateWith({
      balanceMinor: 321,
      currency: 'XOF',
      language: 'fr',
      holderName: 'ADA',
      card,
      userTransactions: [],
    });
    expect(state.balanceMinor).toBe(321);
    expect(state.lastHistoryVisitAt).toBeNull();
  });

  it('restores a valid visit date and drops a corrupted one', async () => {
    let state = await rehydrateWith({ currency: 'XOF', lastHistoryVisitAt: '2026-10-18T10:00:00.000Z' });
    expect(state.lastHistoryVisitAt).toBe('2026-10-18T10:00:00.000Z');

    useAppStore.setState({ lastHistoryVisitAt: null });
    for (const corrupted of ['yesterday', 42, {}, '']) {
      state = await rehydrateWith({ currency: 'XOF', lastHistoryVisitAt: corrupted });
      expect(state.lastHistoryVisitAt).toBeNull();
    }
  });
});

describe('user intentions cap', () => {
  it(`keeps only the ${MAX_USER_TRANSACTIONS} most recent intentions`, () => {
    const { applyIntention } = useAppStore.getState();
    for (let i = 0; i < MAX_USER_TRANSACTIONS + 5; i += 1) {
      expect(applyIntention('receive', 1)).toEqual({ ok: true });
    }
    const { userTransactions, balanceMinor } = useAppStore.getState();
    expect(userTransactions).toHaveLength(MAX_USER_TRANSACTIONS);
    expect(balanceMinor).toBe(1000 + MAX_USER_TRANSACTIONS + 5);
    applyIntention('pay', 3, { labelKey: 'content:intentions.coffee' });
    expect(useAppStore.getState().userTransactions[0]?.labelKey).toBe('content:intentions.coffee');
    expect(useAppStore.getState().userTransactions).toHaveLength(MAX_USER_TRANSACTIONS);
  });
});

describe('setLanguage and the default holder', () => {
  it('translates a holder name left at the default', () => {
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().setHolderName('');
    expect(useAppStore.getState().holderName).toBe('TITULAIRE ABONDA');
    useAppStore.getState().setLanguage('en');
    expect(useAppStore.getState().holderName).toBe('ABONDA HOLDER');
    useAppStore.getState().setLanguage('fr');
    expect(useAppStore.getState().holderName).toBe('TITULAIRE ABONDA');
  });

  it('keeps a custom holder name', () => {
    useAppStore.getState().setLanguage('fr');
    useAppStore.getState().setHolderName('Ada');
    useAppStore.getState().setLanguage('en');
    expect(useAppStore.getState().holderName).toBe('ADA');
    expect(useAppStore.getState().language).toBe('en');
  });
});

describe('repeat announcement', () => {
  async function rehydrateWith(state: unknown) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: 1 }));
    await useAppStore.persist.rehydrate();
    return useAppStore.getState();
  }

  it('is off by default, can be toggled, and is persisted', async () => {
    expect(useAppStore.getState().repeatAnnouncement).toBe(false);
    useAppStore.getState().setRepeatAnnouncement(true);
    expect(useAppStore.getState().repeatAnnouncement).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const raw = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(raw.state.repeatAnnouncement).toBe(true);
  });

  it('goes back to off on reset', () => {
    useAppStore.getState().setRepeatAnnouncement(true);
    useAppStore.getState().resetAll();
    expect(useAppStore.getState().repeatAnnouncement).toBe(false);
  });

  it('rehydrates version 1 data saved before the field existed with the default', async () => {
    useAppStore.setState({ repeatAnnouncement: true });
    let state = await rehydrateWith({ currency: 'XOF', balanceMinor: 5 });
    expect(state.repeatAnnouncement).toBe(true);
    useAppStore.setState({ repeatAnnouncement: false });
    state = await rehydrateWith({ currency: 'XOF', balanceMinor: 5 });
    expect(state.repeatAnnouncement).toBe(false);
  });

  it('restores a saved value and ignores a corrupted one', async () => {
    let state = await rehydrateWith({ currency: 'XOF', repeatAnnouncement: true });
    expect(state.repeatAnnouncement).toBe(true);
    useAppStore.setState({ repeatAnnouncement: false });
    for (const corrupted of ['true', 1, null, {}]) {
      state = await rehydrateWith({ currency: 'XOF', repeatAnnouncement: corrupted });
      expect(state.repeatAnnouncement).toBe(false);
    }
  });
});
