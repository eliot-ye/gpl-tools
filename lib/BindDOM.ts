import { createSubscribeState } from "./SubscribeState";
import { createReactiveConstant } from "./ReactiveConstant";
import { getValueFromStringKey } from "./utils/tools";

type SubscribeStateInstance = ReturnType<typeof createSubscribeState>;
type ReactiveConstantInstance = ReturnType<typeof createReactiveConstant>;
type Instance = SubscribeStateInstance | ReactiveConstantInstance;

interface InstructionHandle {
  (
    ele: HTMLElement,
    instructionValue: string,
    instructionName: string,
    instance: Instance
  ): (state: any) => void;
}

export function createApp(
  instanceList: Instance[],
  option: { instructionPrefix?: string } = {}
) {
  const { instructionPrefix = "bd" } = option;

  const instanceKeys = instanceList.map((instance) => {
    if (instance._interfaceType === "SubscribeState") {
      return {
        instance,
        keys: Object.keys(instance.$getStateRaw()),
        subscribeIds: [] as string[],
      };
    }
    if (instance._interfaceType === "ReactiveConstant") {
      return {
        instance,
        keys: Object.keys(instance),
        subscribeIds: [] as string[],
      };
    }

    return { instance, keys: [] as string[], subscribeIds: [] as string[] };
  });

  let containerEle: HTMLElement | null = null;

  const InstructionSet: {
    [instructionName: string]: InstructionHandle;
  } = {
    text: (ele, instructionValue) => (state) => {
      const textStr = getValueFromStringKey(instructionValue, state);
      ele.innerText = textStr;
    },
    html: (ele, instructionValue) => (state) => {
      const htmlStr = getValueFromStringKey(instructionValue, state);
      ele.innerHTML = htmlStr;
    },
    bind: (ele, instructionValue, instructionName) => (state) => {
      const attrName = instructionName.split(":")[1];
      const stateValue = getValueFromStringKey(instructionValue, state);
      if (["string", "number"].includes(typeof stateValue)) {
        ele.setAttribute(attrName, stateValue);
      } else if (Array.isArray(stateValue)) {
        ele.setAttribute(attrName, stateValue.join(","));
      }
    },
    value(ele, instructionValue, _instructionName, instance) {
      if (ele.tagName === "INPUT") {
        const _el = ele as HTMLInputElement;
        if (_el.type === "checkbox" || _el.type === "radio") {
          _el.addEventListener("change", () => {
            instance.$setFromStringKey(instructionValue, _el.checked);
          });
        } else {
          _el.addEventListener("input", () => {
            instance.$setFromStringKey(instructionValue, _el.value);
          });
        }
      }
      if (ele.tagName === "SELECT") {
        const _el = ele as HTMLSelectElement;
        _el.addEventListener("change", () => {
          instance.$setFromStringKey(instructionValue, _el.value);
        });
      }
      if (ele.tagName === "TEXTAREA") {
        const _el = ele as HTMLTextAreaElement;
        _el.addEventListener("input", () => {
          instance.$setFromStringKey(instructionValue, _el.value);
        });
      }

      return (state) => {
        const stateValue = getValueFromStringKey(instructionValue, state);
        if (ele.tagName === "INPUT") {
          const _el = ele as HTMLInputElement;
          if (_el.type === "checkbox" || _el.type === "radio") {
            _el.checked = stateValue;
          } else {
            _el.value = stateValue;
          }
        }
        if (ele.tagName === "SELECT") {
          const _el = ele as HTMLSelectElement;
          _el.value = stateValue;
        }
        if (ele.tagName === "TEXTAREA") {
          const _el = ele as HTMLTextAreaElement;
          _el.value = stateValue;
        }
      };
    },
  };

  function getInstructionNames() {
    return Object.keys(InstructionSet).map(
      (item) => `${instructionPrefix}-${item}`
    );
  }
  let instructionNames = getInstructionNames();

  function collectingInstructions(ele: HTMLElement) {
    const attrNames = ele.getAttributeNames();
    for (const instructionName of instructionNames) {
      for (const attrName of attrNames) {
        if (attrName.startsWith(instructionName)) {
          for (const instanceKey of instanceKeys) {
            const attrValue = ele.getAttribute(attrName);
            if (attrValue) {
              const instructionHandle = InstructionSet[
                instructionName.replace(`${instructionPrefix}-`, "")
              ](ele, attrValue, attrName, instanceKey.instance);

              const subscribeId = instanceKey.instance.$subscribe(
                (state: any) => {
                  instructionHandle(state);
                },
                [attrValue.split(".")[0]]
              );
              if (subscribeId) {
                instanceKey.subscribeIds.push(subscribeId);
              }
            }
          }
        }
      }
    }

    if (ele.children) {
      for (let i = 0; i < ele.children.length; i++) {
        collectingInstructions(ele.children[i] as HTMLElement);
      }
    }
  }

  return {
    registerInstruction(instructionName: string, handler: InstructionHandle) {
      InstructionSet[instructionName] = handler;
      instructionNames = getInstructionNames();
    },

    mount(container: string | HTMLElement) {
      if (typeof container === "string") {
        containerEle = document.querySelector(container);
      } else {
        containerEle = container;
      }

      if (containerEle) {
        collectingInstructions(containerEle);
      }
    },
    unmount() {
      instanceKeys.forEach((instanceKey) => {
        instanceKey.subscribeIds.forEach((subscribeId) => {
          instanceKey.instance.$unsubscribe(subscribeId);
        });
      });
    },
  } as const;
}
