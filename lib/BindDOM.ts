import { createSignalEffect, createSubscribeEvents } from ".";

export const instructionPrefix = "s";
export const mark = "BindDOM";

type SignalEffectRT = ReturnType<typeof createSignalEffect>;
type SubscribeEventRT = ReturnType<typeof createSubscribeEvents>;

type Directives = Record<
  string,
  (
    ele: HTMLElement,
    ctx: { instructionVal: string; data(str: string): any }
  ) => void
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
  const dataList = Object.keys(dataMap);
  function $get(str: string) {
    return $getScope(str, dataMap, dataList);
  }
  function $getScope(str: string, scopeDataMap: any, scopeDataList?: string[]) {
    const _scopeDataList = scopeDataList || Object.keys(scopeDataMap);

    if (_scopeDataList.includes(str)) {
      return scopeDataMap[str]();
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
    value: (ele, { data, instructionVal }) => {
      const _ele = ele as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;
      _ele.value = data(instructionVal);
    },
    checked: (ele, { data, instructionVal }) => {
      const _ele = ele as HTMLInputElement;
      const value = data(instructionVal);
      if (value) {
        _ele.checked = true;
        _ele.setAttribute("checked", "checked");
      } else {
        _ele.checked = false;
        _ele.removeAttribute("checked");
      }
    },
    disabled: (ele, { data, instructionVal }) => {
      const _ele = ele as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | HTMLButtonElement;
      const value = data(instructionVal);
      value
        ? _ele.setAttribute("disabled", "disabled")
        : _ele.removeAttribute("disabled");
    },

    ...directives,

    text: (ele, { data, instructionVal }) => {
      ele.innerText = data(instructionVal);
    },
    html: (ele, { data, instructionVal }) => {
      ele.innerHTML = data(instructionVal);
    },

    on: (ele, { instructionVal }) => {
      const instructionValList = instructionVal.split(":");
      const eventName = instructionValList[0];
      const SEventStr = instructionValList[1];
      ele.addEventListener(eventName, (ev) => {
        $getScope(SEventStr, {...dataMap, $event: ev})
      });
    },
  };
  const directivesNames = Object.keys(_directives);
  const _directivesEffectIdsMap = {} as Record<string, number[]>;

  function executeDirectives(
    scopeElement: HTMLElement,
    scope?: string,
    scopeData?: any
  ) {
    directivesNames.forEach((directiveName) => {
      const scopeDirectiveName = (scope || "") + directiveName;
      if (!_directivesEffectIdsMap[scopeDirectiveName]) {
        _directivesEffectIdsMap[scopeDirectiveName] = [];
      }
      _directivesEffectIdsMap[directiveName].forEach((effectId) => {
        SignalEffect.destroyEffect(effectId);
      });
      const elements = scopeElement.querySelectorAll<HTMLElement>(
        `[${instructionPrefix}-${directiveName}]`
      );

      const getDataFn = scopeData
        ? (str: string) => $getScope(str, scopeData)
        : $get;

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const instructionVal = element.getAttribute(
          `${instructionPrefix}-${directiveName}`
        );
        if (instructionVal) {
          const effectId = SignalEffect.useEffect(() => {
            try {
              _directives[directiveName](element, {
                instructionVal,
                data: getDataFn,
              });
            } catch (error) {
              console.error(
                `Error in ${instructionPrefix}-${directiveName}="${instructionVal}"`,
                error
              );
            }
          });
          _directivesEffectIdsMap[scopeDirectiveName].push(effectId);
        }
      }
    });
  }

  executeDirectives(rootElement);

  return AppCtx;
}
