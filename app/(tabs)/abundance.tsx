import { useTranslation } from 'react-i18next';

import { AppText, Screen } from '@/src/components/ui';

export default function AbundanceScreen() {
  const { t } = useTranslation();

  return (
    <Screen testID="screen-abundance" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AppText variant="h2">{t('placeholder.abundance')}</AppText>
    </Screen>
  );
}
