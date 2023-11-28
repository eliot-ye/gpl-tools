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
  setup({ useSignal, useEffect, onMount }) {
    const useI18n = createSignalI18n(I18nRC, {
      useSignal,
      useEffect,
    });

    const langCode = useSignal(I18nRC.$getCode());
    function changeLang(_langCode: ReturnType<typeof I18nRC.$getCode>) {
      I18nRC.$setCode(_langCode);
      langCode.$set(_langCode);
    }

    console.log("setup1");
    onMount(() => {
      console.log("onMount1");
    });
    onMount(() => {
      console.log("onMount2");
    });
    console.log("setup2");

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

    function setS1(nData: number) {
      s1.$set(nData);
    }
    function setS3(nData: number) {
      s3.$set(nData);
    }

    const s4 = useSignal(1);
    function inputS4(ev: Event) {
      const target = ev.target as HTMLInputElement;
      s4.$set(Number(target.value));
    }
    const s4Disabled = useSignal(false);
    function setS4Disabled() {
      s4Disabled.$set((_v) => !_v);
    }
    useEffect(() => {
      const el = document.querySelector('[s-t="s4"]');
      if (el) {
        const i18n = useI18n();
        el.innerHTML = fromatText(i18n.s4, s4Disabled());
      }
    });

    const s5 = useSignal(false);
    function changeS5(ev: Event) {
      const target = ev.target as HTMLInputElement;
      s5.$set(target.checked);
    }
    function setS5(value: boolean) {
      s5.$set(value);
    }

    const s6 = useSignal([
      { title: "1", children: [0, 1, 2, 3] },
      { title: "2", children: [4, 5, 6, 7] },
    ]);
    useEffect(() => {
      console.log("s6", s6());
    });

    return {
      langCode,
      changeLang,
      s1,
      setS1,
      s2,
      s3,
      setS3,
      s4,
      inputS4,
      s4Disabled,
      setS4Disabled,
      s5,
      changeS5,
      setS5,
      s6,
    };
  },
});
