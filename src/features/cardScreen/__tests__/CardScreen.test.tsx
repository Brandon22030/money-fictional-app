import { act, fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Alert } from "react-native";

import { formatCardNumber } from "@/src/components/card/formatCardNumber";
import { formatMoney } from "@/src/domain/money";
import i18n from "@/src/i18n";
import { useAppStore } from "@/src/store/useAppStore";

import { CardScreen } from "../CardScreen";

function KeypadStub() {
  const { useLocalSearchParams } = jest.requireActual("expo-router");
  const { Text } = jest.requireActual("react-native");
  const { mode } = useLocalSearchParams();
  return <Text testID="keypad-mode">{mode}</Text>;
}

async function renderCard() {
  await renderRouter({ index: CardScreen, keypad: KeypadStub });
}

describe("CardScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("fr");
    await act(async () => {
      useAppStore.getState().resetAll();
      useAppStore.getState().setBalance(125050);
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it("shows the store balance, holder and number on the card", async () => {
    await renderCard();
    const { currency, language, card, holderName } = useAppStore.getState();
    expect(screen.getByTestId("card-balance")).toHaveTextContent(
      formatMoney(125050, currency, language).full,
    );
    expect(screen.getByTestId("card-holder")).toHaveTextContent(holderName);
    expect(screen.getByTestId("card-number")).toHaveTextContent(
      formatCardNumber(card.number),
    );
    expect(screen.getByTestId("card-gold-logo")).toBeTruthy();
  });

  it("flips the card from the card and from the Flip tile", async () => {
    await renderCard();
    const card = screen.getByTestId("card-screen-card");
    expect(card.props.accessibilityLabel).toMatch(/recto/);
    await fireEvent.press(card);
    expect(
      screen.getByTestId("card-screen-card").props.accessibilityLabel,
    ).toMatch(/verso/);
    await fireEvent.press(screen.getByTestId("action-flip"));
    expect(
      screen.getByTestId("card-screen-card").props.accessibilityLabel,
    ).toMatch(/recto/);
  });

  it("regenerates the number after confirmation only", async () => {
    const alert = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    await renderCard();
    const before = useAppStore.getState().card.number;

    await fireEvent.press(screen.getByTestId("action-new-number"));
    expect(useAppStore.getState().card.number).toBe(before);

    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      buttons.find((b) => b.style !== "cancel")?.onPress?.();
    });
    expect(useAppStore.getState().card.number).not.toBe(before);
  });

  it.each([
    ["action-pay", "pay"],
    ["action-set", "set"],
    ["action-withdraw", "withdraw"],
  ])("%s opens the keypad in %s mode", async (testID, mode) => {
    await renderCard();
    await fireEvent.press(screen.getByTestId(testID));
    expect(screen.getByTestId("keypad-mode")).toHaveTextContent(mode);
  });

  it("offers no copy or share action", async () => {
    await renderCard();
    expect(screen.queryByLabelText(/copier|copy|partager|share/i)).toBeNull();
  });
});
