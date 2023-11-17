import { createSignalEffect, createSubscribeEvents } from ".";

export const instructionPrefix = "s";
export const mark = "BindDOM";

type SignalEffectRT = ReturnType<typeof createSignalEffect>;
type SubscribeEventRT = ReturnType<typeof createSubscribeEvents>;

interface AppOptions {
  ele: HTMLElement | string | null;
  setup: (ctx: {
    useSignal: SignalEffectRT["useSignal"];
    useEffect: SignalEffectRT["useEffect"];
    destroyEffect: SignalEffectRT["destroyEffect"];
    event: SubscribeEventRT;
  }) => Record<string, any>;
}

export function createApp({ ele: element, setup }: AppOptions) {
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

  const textEffectIds: number[] = [];
  instructionText({
    rootElement,
    dataMap,
    effectIds: textEffectIds,
    SignalEffect,
  });

  const htmlEffectIds: number[] = [];
  instructionHtml({
    rootElement,
    dataMap,
    effectIds: htmlEffectIds,
    SignalEffect,
  });

  instructionOn({
    rootElement,
    dataMap,
    effectIds: [],
    SignalEffect,
    SubscribeEvent,
  });

  return AppCtx;
}

function evalFn(str: string, dataMap: Record<string, any>) {
  return new Function(
    `"use strict"; var dataMap = arguments[0]; return (dataMap.${str});`
  )(dataMap);
}

interface InstructionOptions {
  rootElement: HTMLElement;
  dataMap: Record<string, any>;
  effectIds: number[];
  SignalEffect: SignalEffectRT;
}

function instructionText({
  rootElement,
  dataMap,
  effectIds,
  SignalEffect,
}: InstructionOptions) {
  effectIds.forEach((effectId) => {
    SignalEffect.destroyEffect(effectId);
  });

  const elements = rootElement.querySelectorAll<HTMLElement>(
    `[${instructionPrefix}-text]`
  );

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const instructionVal = element.getAttribute(`${instructionPrefix}-text`);
    if (instructionVal) {
      const effectId = SignalEffect.useEffect(() => {
        const data = evalFn(instructionVal, dataMap);
        try {
          element.innerText = data;
        } catch (error) {
          console.error(`Error in ${instructionPrefix}-text: ${error}`);
        }
      });
      effectIds.push(effectId);
    }
  }
}

function instructionHtml({
  rootElement,
  dataMap,
  effectIds,
  SignalEffect,
}: InstructionOptions) {
  effectIds.forEach((effectId) => {
    SignalEffect.destroyEffect(effectId);
  });

  const elements = rootElement.querySelectorAll<HTMLElement>(
    `[${instructionPrefix}-html]`
  );

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const instructionVal = element.getAttribute(`${instructionPrefix}-html`);
    if (instructionVal) {
      const effectId = SignalEffect.useEffect(() => {
        try {
          element.innerHTML = evalFn(instructionVal, dataMap);
        } catch (error) {
          console.error(`Error in ${instructionPrefix}-html: ${error}`);
        }
      });
      effectIds.push(effectId);
    }
  }
}

interface InstructionOnOptions extends InstructionOptions {
  SubscribeEvent: SubscribeEventRT;
}
function instructionOn({
  rootElement,
  SubscribeEvent,
  dataMap,
}: InstructionOnOptions) {
  const elements = rootElement.querySelectorAll<HTMLElement>(
    `[${instructionPrefix}-on]`
  );

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const instructionVal = element.getAttribute(`${instructionPrefix}-on`);
    if (instructionVal) {
      const instructionValList = instructionVal.split(":");
      const eventName = instructionValList[0];
      const SEventName = instructionValList[1];
      const SEventParam = instructionValList[2];
      element.addEventListener(eventName, (ev) => {
        if (SEventParam) {
          try {
            SubscribeEvent.publish(SEventName, evalFn(SEventParam, dataMap));
          } catch (error) {
            if (SEventParam.includes(",")) {
              SubscribeEvent.publish.apply(null, [
                SEventName,
                ...SEventParam.split(",").map((_item) =>
                  _item === "$event" ? ev : evalFn(_item, dataMap)
                ),
              ] as any);
            }
            SubscribeEvent.publish(
              SEventName,
              JSON.parse(SEventParam.replace(/\'/g, '"'))
            );
          }
        } else {
          SubscribeEvent.publish(SEventName, undefined);
        }
      });
    }
  }
}
