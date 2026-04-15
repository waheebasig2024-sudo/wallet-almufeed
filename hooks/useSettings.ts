import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '@/constants/i18n';

export const DEFAULT_SERVER_URL = 'http://127.0.0.1:8081';

interface SettingsContextType {
  biometricsEnabled: boolean;
  language: Language;
  deviceId: string;
  serverUrl: string;
  setBiometricsEnabled: (val: boolean) => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setServerUrl: (url: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  biometricsEnabled: true,
  language: 'ar',
  deviceId: '',
  serverUrl: DEFAULT_SERVER_URL,
  setBiometricsEnabled: async () => {},
  setLanguage: async () => {},
  setServerUrl: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [biometricsEnabled, setBiometricsState] = useState(true);
  const [language, setLanguageState] = useState<Language>('ar');
  const [deviceId, setDeviceId] = useState('');
  const [serverUrl, setServerUrlState] = useState(DEFAULT_SERVER_URL);

  useEffect(() => {
    (async () => {
      const bio = await AsyncStorage.getItem('@settings:biometrics');
      if (bio !== null) setBiometricsState(bio === 'true');

      const lang = await AsyncStorage.getItem('@settings:language') as Language | null;
      if (lang === 'ar' || lang === 'en') setLanguageState(lang);

      const url = await AsyncStorage.getItem('@settings:serverUrl');
      if (url) setServerUrlState(url);

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

  const setServerUrl = async (url: string) => {
    const trimmed = url.trim();
    setServerUrlState(trimmed);
    await AsyncStorage.setItem('@settings:serverUrl', trimmed);
  };

  return React.createElement(
    SettingsContext.Provider,
    { value: { biometricsEnabled, language, deviceId, serverUrl, setBiometricsEnabled, setLanguage, setServerUrl } },
    children
  );
}

export const useSettings = () => useContext(SettingsContext);
