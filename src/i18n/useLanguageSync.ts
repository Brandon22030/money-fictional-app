import { useEffect } from 'react';

import { useAppStore } from '@/src/store/useAppStore';

import i18n from './index';

/**
 * Single place where i18next follows the language stored in the app state.
 * Mounted once by the root layout; screens only update the store.
 */
export function useLanguageSync(): void {
  const language = useAppStore((state) => state.language);

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);
}
