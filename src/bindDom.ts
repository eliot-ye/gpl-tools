import "./style.css";
import { createReactiveConstant, createSignalI18n, fromatText } from "../lib";
import { createApp } from "../lib/BindDOM";

const I18nRC = createReactiveConstant({
  en: {
    s1: "click s1",
    s2: "click s2",
    s3: "click s3 {count}",
    s4: "click s4 disabled: {0}",
    s5: "click s5",
  } as const,
  zh: {
    s1: "点击 s1",
    s2: "点击 s2",
    s3: "点击 s3 {count}",
    s4: "点击 s4 disabled: {0}",
    s5: "点击 s5",
  } as const,
} as const);

createApp({
  ele: "#app",
  setup({ useSignal, useEffect, event }) {
    const useI18n = createSignalI18n(I18nRC, {
      useSignal,
      useEffect,
    });

    const langCode = useSignal(I18nRC.$getCode());
    event.subscribe("changeLang", (_langCode) => {
      langCode.$set(_langCode);
      I18nRC.$setCode(_langCode);
    });

    const s1 = useSignal(1);
    const s2 = useSignal(1);
    const s3 = useSignal(1);

    useEffect(() => {
      console.log("useEffect s3", s3());
      const s3El = document.querySelector('[s-t="s3"]');
      if (s3El) {
        const i18n = useI18n();
        s3El.innerHTML = fromatText(i18n.s3, { count: s3() });
      }
    });

    event.subscribe("setS1", (nData) => {
      s1.$set(nData);
    });
    event.subscribe("setS2", (nData) => {
      s2.$set(nData);
    });
    event.subscribe("setS3", (nData) => {
      s3.$set(nData);
    });

    const s4 = useSignal(1);
    event.subscribe("inputS4", (ev) => {
      s4.$set(ev.target.value);
    });
    const s4Disabled = useSignal(false);
    event.subscribe("setS4", () => {
      s4Disabled.$set((_v) => !_v);
    });
    useEffect(() => {
      const el = document.querySelector('[s-t="s4"]');
      if (el) {
        const i18n = useI18n();
        el.innerHTML = fromatText(i18n.s4, s4Disabled());
      }
    });

    const s5 = useSignal(false);
    event.subscribe("setS5", (_v) => {
      s5.$set(_v);
    });
    event.subscribe("changeS5", (ev) => {
      console.log(ev);
      s5.$set(ev.target.checked);
    });

    return {
      langCode,
      s1,
      s2,
      s3,
      s4,
      s4Disabled,
      s5,
    };
  },
});
