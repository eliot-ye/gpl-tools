import {
  createReactiveConstant,
  createSignalEffect,
  useEffect,
  useSignal,
} from ".";
import { instructionPrefix } from "./BindDOM";

const fromatRE = /{(.*?)}/g;

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
type Formatted = string | number | boolean;
type KeyConstraint<K extends string, V extends Formatted> = Record<K, V>;
/** 替换字符串中的占位符 `{*}` */
export function fromatText<L extends string, V extends Formatted>(
  langString: L,
  value: KeyConstraint<InferKey<L>, V>
): string;
export function fromatText<L extends string, V extends Formatted>(
  langString: L,
  ...values: V[]
): string;
export function fromatText(text: string, ...args: any[]) {
  return text.replace(fromatRE, (match, key) => {
    if (isNaN(Number(key))) {
      return args[0][key] ?? match;
    } else {
      return args[Number(key)] ?? match;
    }
  });
}

/** 排除T中key符合条件K的集合 */
type ExcludedKey<T, K> = {
  [Key in keyof T as Key extends K ? never : Key]: T[Key];
};
type ReactiveConstantRT = ReturnType<typeof createReactiveConstant>;
type SignalEffectRT = ReturnType<typeof createSignalEffect>;

/**
 * 一个基于 `SignalEffect` `ReactiveConstant` 的 document I18n 工具
 * @param reactiveConstant - createReactiveConstant返回值
 * @returns function useI18n
 */
export function createSignalI18n<T extends ReactiveConstantRT>(
  reactiveConstant: T,
  option: {useEffect: SignalEffectRT['useEffect'], useSignal: SignalEffectRT['useSignal']} = {
    useEffect,
    useSignal,
  }
) {
  type V1 = ExcludedKey<T, `$${string}`>;
  type V2 = ExcludedKey<V1, `_${string}`>;

  const useI18n = option.useSignal<V2>(reactiveConstant);
  reactiveConstant.$addListener(() => {
    useI18n.$set({ ...reactiveConstant });
  });

  option.useEffect(() => {
    const langEleList = document.querySelectorAll<HTMLElement>(
      `[${instructionPrefix}-t]`
    );
    const i18n = useI18n();
    for (let index = 0; index < langEleList.length; index++) {
      const element = langEleList[index];
      const langKey = element.getAttribute(
        `${instructionPrefix}-t`
      ) as keyof V2;
      if (langKey) {
        let value = i18n[langKey] as string;
        if (typeof value === "function") {
          return;
        }
        if (fromatRE.test(value)) {
          const fromatStr = element.getAttribute(`${instructionPrefix}-f`);
          if (!fromatStr) {
            return;
          }
          try {
            const fromatData = JSON.parse(fromatStr);
            value = fromatText(value, fromatData);
          } catch (error) {
            const fromatList = fromatStr.split(",");
            value = fromatText.apply(null, [value, ...fromatList]);
          }
        }
        element.innerHTML = value;
      }
    }
  });

  return useI18n;
}
