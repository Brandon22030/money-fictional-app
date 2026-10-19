import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/src/components/ui';

export default function KeypadScreen() {
  const { t } = useTranslation();

  return (
    <Screen testID="screen-keypad" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="h2">{t('placeholder.keypad')}</AppText>
    </Screen>
  );
}
