import { createContext, useContext, useState } from 'react';
import uz from '../i18n/uz';
import ru from '../i18n/ru';

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('uzavto_lang') || 'uz');

  /**
   * Translate a dot-notation key: e.g. t('nav.home')
   */
  const t = (key) => {
    const keys = key.split('.');
    const translations = lang === 'uz' ? uz : ru;
    const result = keys.reduce((obj, k) => obj?.[k], translations);
    return result !== undefined ? result : key;
  };

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('uzavto_lang', newLang);
  };

  return (
    <LangContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
