import { APP_LOCALES, LOCALE_META, detectBrowserLocale, translateText, type AppLocale } from "@/lib/locale";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "barato.locale";
type LocaleContextValue = { locale: AppLocale; dir: "rtl" | "ltr"; setLocale: (locale: AppLocale) => void; text: (source: string) => string; formatting: string };
const fallbackValue: LocaleContextValue = { locale: "fa", dir: "rtl", setLocale: () => undefined, text: source => translateText(source, "fa"), formatting: "fa-IR" };
const LocaleContext = createContext<LocaleContextValue>(fallbackValue);

function savedOrDetectedLocale(): AppLocale {
  if (typeof window === "undefined") return "fa";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return APP_LOCALES.includes(stored as AppLocale) ? stored as AppLocale : detectBrowserLocale();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(savedOrDetectedLocale);
  const textByNode = useRef(new WeakMap<Text, string>());
  const attributesByNode = useRef(new WeakMap<Element, Map<string, string>>());

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);
  const text = useCallback((source: string) => translateText(source, locale), [locale]);

  useEffect(() => {
    const meta = LOCALE_META[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    document.body.dir = meta.dir;

    const localizeTextNode = (node: Text) => {
      const current = node.nodeValue ?? "";
      const original = textByNode.current.get(node);
      if (!original) textByNode.current.set(node, current);
      else if (current !== translateText(original, locale)) textByNode.current.set(node, current);
      const source = textByNode.current.get(node) ?? current;
      const next = translateText(source, locale);
      if (next !== current) node.nodeValue = next;
    };
    const localizeElement = (element: Element) => {
      ["placeholder", "title", "aria-label", "alt"].forEach(attribute => {
        const current = element.getAttribute(attribute);
        if (!current) return;
        const stored = attributesByNode.current.get(element) ?? new Map<string, string>();
        if (!stored.has(attribute)) stored.set(attribute, current);
        else if (current !== translateText(stored.get(attribute) ?? "", locale)) stored.set(attribute, current);
        attributesByNode.current.set(element, stored);
        const next = translateText(stored.get(attribute) ?? current, locale);
        if (next !== current) element.setAttribute(attribute, next);
      });
    };
    const localizeTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) localizeTextNode(root as Text);
      if (root.nodeType === Node.ELEMENT_NODE) {
        localizeElement(root as Element);
        root.childNodes.forEach(localizeTree);
      }
    };
    localizeTree(document.body);
    const observer = new MutationObserver(records => records.forEach(record => {
      if (record.type === "characterData") localizeTextNode(record.target as Text);
      else if (record.type === "attributes") localizeElement(record.target as Element);
      else record.addedNodes.forEach(localizeTree);
    }));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label", "alt"] });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo(() => ({ locale, dir: LOCALE_META[locale].dir, setLocale, text, formatting: LOCALE_META[locale].formatting }), [locale, setLocale, text]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
