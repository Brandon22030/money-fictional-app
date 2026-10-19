import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/src/components/ui';

export default function HistoryScreen() {
  const { t } = useTranslation();

  return (
    <Screen testID="screen-history" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="h2">{t('placeholder.history')}</AppText>
    </Screen>
  );
}
