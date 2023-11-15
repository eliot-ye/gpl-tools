import { createReactiveConstant } from ".";
import { useEffect, useSignal } from "./SignalEffect";

type InferKeyArray<T> = T extends `${string}{${infer K}}${infer R}`
  ? [K, ...InferKeyArray<R>]
  : [];
/**
 * 获取字符串`{key}`结构中的key值
 * @example
 * type D = InferKey<'abc{d}efg'>
 * // type D = 'd'
 * */
type InferKey<T> = InferKeyArray<T> extends Array<infer K extends string>
  ? K
  : T;
type Formatted = string | number;
type KeyConstraint<K extends string, V extends Formatted> = Record<K, V>;
export function fromatText<L extends string, V extends Formatted>(
  langString: L,
  value: KeyConstraint<InferKey<L>, V>
): string;
export function fromatText<L extends string, V extends Formatted>(
  langString: L,
  ...values: V[]
): string;
export function fromatText(text: string, ...args: any[]) {
  return text.replace(/{(.*?)}/g, (_match, key) => {
    if (isNaN(Number(key))) {
      return args[0][key];
    } else {
      return args[Number(key)];
    }
  });
}

/** 排除T中key符合条件K的集合 */
type ExcludedKey<T, K> = {
  [Key in keyof T as Key extends K ? never : Key]: T[Key];
};
type ReactiveConstantReturn = ReturnType<typeof createReactiveConstant>;

export function createSignalI18n<T extends ReactiveConstantReturn>(
  reactiveConstant: T
) {
  type V1 = ExcludedKey<T, `$${string}`>;
  type V2 = ExcludedKey<V1, `_${string}`>;

  const useI18n = useSignal<V2>(reactiveConstant);
  reactiveConstant.$addListener(() => {
    useI18n.$set({ ...reactiveConstant });
  });

  useEffect(() => {
    const langEleList = document.querySelectorAll("[data-t]");
    const i18n = useI18n();
    for (let index = 0; index < langEleList.length; index++) {
      const element = langEleList[index];
      const langKey = element.getAttribute("data-t") as keyof typeof i18n;
      if (langKey) {
        let value = i18n[langKey] as string;
        if (typeof value === "function") {
          return;
        }
        if (/(\{[\d|\w]+\})/.test(value)) {
          const fromatStr = element.getAttribute("data-f");
          if (!fromatStr) {
            return;
          }
          const fromatList = fromatStr.split(",");
          value = fromatText.apply(null, [value, ...fromatList]);
        }
        element.innerHTML = value;
      }
    }
  });

  return useI18n;
}
