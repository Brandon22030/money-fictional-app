import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/src/components/ui';

export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <Screen testID="screen-settings" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="h2">{t('placeholder.settings')}</AppText>
    </Screen>
  );
}
