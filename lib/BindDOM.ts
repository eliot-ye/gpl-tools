import { createSignalEffect } from ".";

export const instructionPrefix = "s";
export const mark = "BindDOM";

type SignalEffectRT = ReturnType<typeof createSignalEffect>;

interface DependencyItem {
  element: HTMLElement;
  parentElement?: HTMLElement;
  name: string;
  value: string;
  param: string;
  data: any;
  effectId?: number;
  children?: DependencyItem[];
}

type Directives = Record<
  string,
  (
    option: DependencyItem & SignalEffectRT & { execute(str: string): any }
  ) => void
>;
interface AppOptions {
  ele: HTMLElement | string | null;
  directives?: Directives;
  setup: (
    ctx: SignalEffectRT & {
      onMount: (callback: () => void) => void;
    }
  ) => Record<string, any>;
}

export function createApp({
  ele: element,
  setup,
  directives = {},
}: AppOptions) {
  const rootElement =
    typeof element === "string"
      ? document.querySelector<HTMLElement>(element)
      : element;
  if (!rootElement) {
    throw new Error("No root element found");
  }

  const SignalEffect = createSignalEffect(mark);

  let onMountCallbacks: (() => void)[] = [];
  const AppCtx = {
    ...SignalEffect,
    onMount: (callback: () => void) => {
      onMountCallbacks.push(callback);
    },
  };

  const dataMap = setup(AppCtx);

  function $getScope(str: string, scopeDataMap: any, scopeDataList?: string[]) {
    const _scopeDataList = scopeDataList || Object.keys(scopeDataMap);

    if (_scopeDataList.includes(str)) {
      if (typeof scopeDataMap[str] === "function") {
        return scopeDataMap[str]();
      }
      return scopeDataMap[str];
    }

    const dataStr = _scopeDataList
      .map((key) => `var ${key} = arguments[0]['${key}'];`)
      .join("");
    return new Function(`"use strict"; ${dataStr} return (${str});`)(
      scopeDataMap
    );
  }

  const _directives: Directives = {
    ...directives,

    text: (_opt) => {
      const { element, execute, value } = _opt;
      if (_opt.effectId) {
        _opt.destroyEffect(_opt.effectId);
      }
      _opt.effectId = _opt.useEffect(() => {
        element.innerText = execute(value);
      });
    },
    html: (_opt) => {
      const { element, execute, value } = _opt;
      if (_opt.effectId) {
        _opt.destroyEffect(_opt.effectId);
      }
      _opt.effectId = _opt.useEffect(() => {
        element.innerHTML = execute(value);
      });
    },

    bind: (_opt) => {
      const { element, execute, param, value } = _opt;
      if (_opt.effectId) {
        _opt.destroyEffect(_opt.effectId);
      }
      _opt.effectId = _opt.useEffect(() => {
        const _value = execute(value);
        if (param === "value") {
          const _ele = element as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement;
          _ele.value = _value;
        } else if (param === "checked") {
          const _ele = element as HTMLInputElement;
          if (_value) {
            _ele.checked = true;
            _ele.setAttribute("checked", "checked");
          } else {
            _ele.checked = false;
            _ele.removeAttribute("checked");
          }
        } else if (param === "disabled") {
          const _ele = element as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement
            | HTMLButtonElement;
          _value
            ? _ele.setAttribute("disabled", "disabled")
            : _ele.removeAttribute("disabled");
        } else if (param) {
          _value
            ? element.setAttribute(param, _value)
            : element.removeAttribute(param);
        }
      });
    },

    on: ({ element, param, value, data }) => {
      if (param) {
        element.addEventListener(param, (ev) => {
          $getScope(value, { ...data, $event: ev });
        });
      }
    },
  };
  const directivesNames = Object.keys(_directives);

  const dependencySet: DependencyItem[] = [];
  function executeDependency(
    dependencyList: DependencyItem[],
    scopeElement: HTMLElement,
    scopeData: any,
    parentElement?: HTMLElement
  ) {
    if (parentElement) {
      const instructionFor = `${instructionPrefix}-for`;
      if (scopeElement.hasAttribute(instructionFor)) {
        return;
      }
    }

    const attributes = scopeElement.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      const attributeName = attribute.name;
      if (attributeName.startsWith(":")) {
        dependencyList.push({
          element: scopeElement,
          name: "bind",
          value: attribute.value,
          param: attributeName.slice(1),
          data: scopeData,
          parentElement,
        });
      }
      if (attributeName.startsWith("@")) {
        dependencyList.push({
          element: scopeElement,
          name: "on",
          value: attribute.value,
          param: attributeName.slice(1),
          data: scopeData,
          parentElement,
        });
      }
      directivesNames.forEach((directivesName) => {
        const instruction = `${instructionPrefix}-${directivesName}`;
        if (attributeName.startsWith(instruction)) {
          dependencyList.push({
            element: scopeElement,
            name: directivesName,
            value: attribute.value,
            param: attributeName.split(":")[1],
            data: scopeData,
            parentElement,
          });
        }
      });
    }

    for (let i = 0; i < scopeElement.children.length; i++) {
      const child = scopeElement.children[i] as HTMLElement;
      executeDependency(dependencyList, child, scopeData, scopeElement);
    }
  }
  executeDependency(dependencySet, rootElement, dataMap);

  function render(dependencyList: DependencyItem[]) {
    dependencyList.forEach((dependency) => {
      if (_directives[dependency.name]) {
        _directives[dependency.name]({
          ...dependency,
          ...SignalEffect,
          execute: (_value: string) => $getScope(_value, dependency.data),
        });
      } else {
        console.error("directives not found", dependency.name);
      }
    });
  }
  render(dependencySet);

  onMountCallbacks.forEach((callback) => callback());

  return AppCtx;
}
