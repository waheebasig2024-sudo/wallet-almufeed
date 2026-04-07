import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '@/constants/i18n';

interface SettingsContextType {
  biometricsEnabled: boolean;
  language: Language;
  deviceId: string;
  setBiometricsEnabled: (val: boolean) => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  biometricsEnabled: true,
  language: 'ar',
  deviceId: '',
  setBiometricsEnabled: async () => {},
  setLanguage: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [biometricsEnabled, setBiometricsState] = useState(true);
  const [language, setLanguageState] = useState<Language>('ar');
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    (async () => {
      const bio = await AsyncStorage.getItem('@settings:biometrics');
      if (bio !== null) setBiometricsState(bio === 'true');

      const lang = await AsyncStorage.getItem('@settings:language') as Language | null;
      if (lang === 'ar' || lang === 'en') setLanguageState(lang);

      let did = await AsyncStorage.getItem('@device:id');
      if (!did) {
        did = Date.now().toString(36) + Math.random().toString(36).substr(2, 12);
        await AsyncStorage.setItem('@device:id', did);
      }
      setDeviceId(did);
    })();
  }, []);

  const setBiometricsEnabled = async (val: boolean) => {
    setBiometricsState(val);
    await AsyncStorage.setItem('@settings:biometrics', val.toString());
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('@settings:language', lang);
  };

  return React.createElement(
    SettingsContext.Provider,
    { value: { biometricsEnabled, language, deviceId, setBiometricsEnabled, setLanguage } },
    children
  );
}

export const useSettings = () => useContext(SettingsContext);
