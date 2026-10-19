import { fireEvent, render, screen } from "@testing-library/react-native";

import { MAX_BALANCE_MINOR } from "@/src/config/locale";
import i18n from "@/src/i18n";
import { useAppStore } from "@/src/store/useAppStore";

import { KeypadScreen } from "../KeypadScreen";

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => mockCanGoBack,
  }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

async function typeDigits(digits: string[]) {
  for (const digit of digits) {
    await fireEvent.press(screen.getByTestId(`keypad-${digit}`));
  }
}

describe("KeypadScreen", () => {
  beforeEach(async () => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack = true;
    mockParams = {};
    await i18n.changeLanguage("fr");
    useAppStore.getState().resetAll();
    useAppStore.getState().setCurrency("XOF");
    useAppStore.getState().setBalance(10000);
  });

  it("falls back to set mode for an unknown mode and prefills the balance", async () => {
    mockParams = { mode: "nope" };
    await render(<KeypadScreen />);
    expect(screen.getByText("Définir mon solde")).toBeTruthy();
    expect(screen.getByTestId("keypad-amount").props.children).toBe("10000");
  });

  it("set mode updates the balance and closes", async () => {
    mockParams = { mode: "set" };
    await render(<KeypadScreen />);
    await fireEvent.press(screen.getByTestId("keypad-backspace"));
    await typeDigits(["5"]);
    await fireEvent.press(screen.getByTestId("keypad-validate"));
    expect(useAppStore.getState().balanceMinor).toBe(10005);
    expect(useAppStore.getState().userTransactions).toHaveLength(0);
    expect(mockBack).toHaveBeenCalled();
  });

  it("receive adds an intention and credits the balance", async () => {
    mockParams = { mode: "receive" };
    await render(<KeypadScreen />);
    expect(screen.getByText("Recevoir de l'abondance")).toBeTruthy();
    await typeDigits(["2", "5", "0"]);
    await fireEvent.press(screen.getByTestId("keypad-validate"));
    expect(useAppStore.getState().balanceMinor).toBe(10250);
    expect(useAppStore.getState().userTransactions[0]?.kind).toBe("receive");
    expect(mockBack).toHaveBeenCalled();
  });

  it("send above the balance shows a gentle message and stays open", async () => {
    mockParams = { mode: "send" };
    await render(<KeypadScreen />);
    await typeDigits(["9", "9", "9", "9", "9"]);
    await fireEvent.press(screen.getByTestId("keypad-validate"));
    expect(screen.getByTestId("keypad-insufficient")).toBeTruthy();
    expect(useAppStore.getState().balanceMinor).toBe(10000);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("disables validation at zero and shows the contact", async () => {
    mockParams = { mode: "send", contact: "amina" };
    await render(<KeypadScreen />);
    expect(
      screen.getByTestId("keypad-validate").props.accessibilityState.disabled,
    ).toBe(true);
    expect(screen.getByTestId("keypad-contact")).toBeTruthy();
    expect(screen.getByText("Pour Amina")).toBeTruthy();
  });

  it("records a favorite as a shared-with intention keyed by its id", async () => {
    mockParams = { mode: "send", contact: "amina" };
    await render(<KeypadScreen />);
    await typeDigits(["1", "0"]);
    await fireEvent.press(screen.getByTestId("keypad-validate"));
    expect(useAppStore.getState().userTransactions[0]).toMatchObject({
      kind: "send",
      labelKey: "content:intentions.sharedWith",
      labelParams: { contact: "amina" },
    });
  });

  it("ignores a free-text contact that is not a favorite", async () => {
    mockParams = { mode: "send", contact: "Arbitrary deep link text" };
    await render(<KeypadScreen />);
    expect(screen.queryByTestId("keypad-contact")).toBeNull();
    await typeDigits(["1", "0"]);
    await fireEvent.press(screen.getByTestId("keypad-validate"));
    const [tx] = useAppStore.getState().userTransactions;
    expect(tx?.labelKey).toBe("content:intentions.send");
    expect(tx?.labelParams).toBeUndefined();
  });

  it("returns Home when there is no screen to go back to", async () => {
    mockCanGoBack = false;
    mockParams = { mode: "receive" };
    await render(<KeypadScreen />);
    await fireEvent.press(screen.getByTestId("keypad-close"));
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("goes back when possible", async () => {
    await render(<KeypadScreen />);
    await fireEvent.press(screen.getByTestId("keypad-close"));
    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows a gentle message when the amount would exceed the simulation limit", async () => {
    useAppStore.getState().setBalance(MAX_BALANCE_MINOR);
    mockParams = { mode: "receive" };
    await render(<KeypadScreen />);
    await typeDigits(["1"]);
    await fireEvent.press(screen.getByTestId("keypad-validate"));
    expect(screen.getByTestId("keypad-too-large")).toBeTruthy();
    expect(
      screen.getByText(
        "Ce montant dépasse le plafond de la simulation. Essayez un montant un peu plus doux.",
      ),
    ).toBeTruthy();
    expect(useAppStore.getState().balanceMinor).toBe(MAX_BALANCE_MINOR);
    expect(mockBack).not.toHaveBeenCalled();

    await typeDigits(["2"]);
    expect(screen.queryByTestId("keypad-too-large")).toBeNull();
  });

  it("allows setting the balance to zero", async () => {
    mockParams = { mode: "set" };
    await render(<KeypadScreen />);
    for (let i = 0; i < 5; i += 1) {
      await fireEvent.press(screen.getByTestId("keypad-backspace"));
    }
    expect(screen.getByTestId("keypad-amount").props.children).toBe("0");
    expect(
      screen.getByTestId("keypad-validate").props.accessibilityState.disabled,
    ).toBe(false);
    await fireEvent.press(screen.getByTestId("keypad-validate"));
    expect(useAppStore.getState().balanceMinor).toBe(0);
    expect(mockBack).toHaveBeenCalled();
  });

  it("places the currency symbol like formatMoney", async () => {
    mockParams = { mode: "receive" };
    await render(<KeypadScreen />);
    expect(screen.getByTestId("keypad-symbol-suffix").props.children).toBe(" FCFA");
    expect(screen.queryByTestId("keypad-symbol-prefix")).toBeNull();
    screen.unmount();

    useAppStore.getState().setLanguage("en");
    useAppStore.getState().setCurrency("USD");
    await i18n.changeLanguage("en");
    await render(<KeypadScreen />);
    expect(screen.getByTestId("keypad-symbol-prefix").props.children).toBe("$");
    expect(screen.queryByTestId("keypad-symbol-suffix")).toBeNull();
  });
});
