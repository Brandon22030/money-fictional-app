import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/src/components/ui';

export default function HomeScreen() {
  const { t } = useTranslation();

  return (
    <Screen testID="screen-home" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="h2">{t('placeholder.home')}</AppText>
    </Screen>
  );
}
