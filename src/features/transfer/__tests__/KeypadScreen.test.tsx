import { fireEvent, render, screen } from "@testing-library/react-native";

import i18n from "@/src/i18n";
import { useAppStore } from "@/src/store/useAppStore";

import { KeypadScreen } from "../KeypadScreen";

const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, canGoBack: () => true }),
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
});
