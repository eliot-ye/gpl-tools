import {
  createSignalEffect,
  createSubscribeEvents,
  destroyEffect,
  useEffect,
} from ".";

export const instructionPrefix = "s";
export const mark = "BindDOM";

type SignalEffectRT = ReturnType<typeof createSignalEffect>;
type SubscribeEventRT = ReturnType<typeof createSubscribeEvents>;

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
  (option: DependencyItem & { execute(str: string): any }) => void
>;
interface AppOptions {
  ele: HTMLElement | string | null;
  directives?: Directives;
  setup: (ctx: {
    useSignal: SignalEffectRT["useSignal"];
    useEffect: SignalEffectRT["useEffect"];
    destroyEffect: SignalEffectRT["destroyEffect"];
    event: SubscribeEventRT;
  }) => Record<string, any>;
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
  const SubscribeEvent = createSubscribeEvents(mark);

  const AppCtx = {
    ...SignalEffect,
    event: SubscribeEvent,
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

    let dataStr = "";
    for (let i = 0; i < _scopeDataList.length; i++) {
      const key = _scopeDataList[i];
      dataStr += `var ${key} = arguments[0]['${key}'];`;
    }
    return new Function(`"use strict"; ${dataStr} return (${str});`)(
      scopeDataMap
    );
  }

  const _directives: Directives = {
    ...directives,

    text: ({ element, execute, value }) => {
      element.innerText = execute(value);
    },
    html: ({ element, execute, value }) => {
      element.innerHTML = execute(value);
    },

    bind: ({ element, execute, param, value }) => {
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
    },

    // for: (option) => {
    //   if (!option.children || !option.parentElement) {
    //     return;
    //   }
    //   const { element, parentElement, value, execute } = option;
    //   let _childrenEle = [];
    //   for (let i = 0; i < parentElement.children.length; i++) {
    //     _childrenEle.push(parentElement.children[i]);
    //   }
    //   _childrenEle.forEach((item) => {
    //     parentElement.removeChild(item);
    //   });
    //   option.children.forEach((dependency) => {
    //     if (dependency.effectId) {
    //       destroyEffect(dependency.effectId);
    //     }
    //   });
    //   option.children = [];

    //   const instructionFor = `${instructionPrefix}-for`;
    //   const valueList = value.split(" in ");
    //   const list = execute(valueList[1].trim());
    //   if (!Array.isArray(list) && typeof list !== "number") {
    //     throw new Error(
    //       `Invalid ${instructionFor}="${value}": ${valueList[1]} is not an array or number`
    //     );
    //   }
    //   let itemKey = valueList[0].trim();
    //   let indexKey = itemKey + "$index";
    //   if (itemKey.includes(",")) {
    //     const itemKeyList = itemKey.split(".");
    //     itemKey = itemKeyList[0];
    //     indexKey = itemKeyList[1];
    //   }
    //   if (Array.isArray(list)) {
    //     for (let i = 0; i < list.length; i++) {
    //       const item = list[i];
    //       const scopeItem = {
    //         [indexKey]: i,
    //         [itemKey]: item,
    //       };
    //       const scopeItemElement = element.cloneNode(true) as HTMLElement;
    //       scopeItemElement.removeAttribute(instructionFor);
    //       executeDependency(
    //         option.children,
    //         scopeItemElement,
    //         scopeItem,
    //         parentElement
    //       );
    //     }
    //   }
    //   console.log(option.children);
    //   render(option.children);

    //   function renderChildren(
    //     _dependencyList: DependencyItem[],
    //     _parentElement: HTMLElement
    //   ) {
    //     _dependencyList.forEach((item) => {
    //       _parentElement.appendChild(item.element);
    //       if (item.children && item.children.length) {
    //         renderChildren(item.children, item.element);
    //       }
    //     });
    //   }

    //   renderChildren(option.children, parentElement);
    // },

    on: ({ element, param, value }) => {
      if (param) {
        element.addEventListener(param, (ev) => {
          $getScope(value, { ...dataMap, $event: ev });
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
        const instructionForValue = scopeElement.getAttribute(instructionFor);
        // if (instructionForValue) {
        //   dependencyList.push({
        //     element: scopeElement,
        //     parentElement,
        //     name: "for",
        //     value: instructionForValue,
        //     param: "",
        //     data: scopeData,
        //     children: [],
        //   });
        //   scopeElement.remove();
        // }
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
      if (dependency.effectId) {
        destroyEffect(dependency.effectId);
      }
      dependency.effectId = SignalEffect.useEffect(() => {
        if (_directives[dependency.name]) {
          _directives[dependency.name]({
            ...dependency,
            execute: (_value: string) => $getScope(_value, dependency.data),
          });
        } else {
          console.error("directives not found", dependency.name);
        }
      });
    });
  }
  render(dependencySet);

  return AppCtx;
}
