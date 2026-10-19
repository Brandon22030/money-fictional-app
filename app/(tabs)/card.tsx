import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/src/components/ui';

export default function CardScreen() {
  const { t } = useTranslation();

  return (
    <Screen testID="screen-card" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="h2">{t('placeholder.card')}</AppText>
    </Screen>
  );
}
