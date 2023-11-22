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
  function $get(str: string) {
    return new Function(
      `"use strict"; var dataMap = arguments[0]; return (dataMap.${str});`
    )(dataMap);
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

    on: (ele, { instructionVal, data }) => {
      const instructionValList = instructionVal.split(":");
      const eventName = instructionValList[0];
      const SEventName = instructionValList[1];
      const SEventParam = instructionValList[2];
      ele.addEventListener(eventName, (ev) => {
        if (SEventParam) {
          function getData(item: string) {
            if (item === "$event") {
              return ev;
            }
            if (/('|")(.*?)('|")/.test(item)) {
              return JSON.parse(item.replace(/\'/g, '"'));
            }
            return data(item);
          }

          if (SEventParam.includes(",")) {
            SubscribeEvent.publish.apply(null, [
              SEventName,
              ...SEventParam.split(",").map((_item) => getData(_item)),
            ] as any);
          } else {
            SubscribeEvent.publish(SEventName, getData(SEventParam));
          }
        } else {
          SubscribeEvent.publish(SEventName, ev);
        }
      });
    },
  };
  const directivesNames = Object.keys(_directives);
  const _directivesEffectIdsMap = {} as Record<string, number[]>;

  function executeDirectives(scopeElement: HTMLElement, scope: string) {
    directivesNames.forEach((directiveName) => {
      const scopeDirectiveName = scope + directiveName;
      if (!_directivesEffectIdsMap[scopeDirectiveName]) {
        _directivesEffectIdsMap[scopeDirectiveName] = [];
      }
      _directivesEffectIdsMap[directiveName].forEach((effectId) => {
        SignalEffect.destroyEffect(effectId);
      });
      const elements = scopeElement.querySelectorAll<HTMLElement>(
        `[${instructionPrefix}-${directiveName}]`
      );

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
                data: $get,
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

  executeDirectives(rootElement, "");

  return AppCtx;
}
