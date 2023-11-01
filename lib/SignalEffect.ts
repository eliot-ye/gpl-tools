import { debounce } from "./utils/tools";

interface SignalItem {
  execute?: () => void;
}

export function createSignalEffect() {
  const signalSubscribers: (SignalItem | undefined)[] = [];

  let activeSubscriber: SignalItem | undefined;

  function useEffect(callback: () => void) {
    function _execute() {
      try {
        callback();
      } catch (error) {
        console.error(error);
      }
    }
    const execute = debounce(_execute, { wait: 0 });

    const _activeSubscriber = { execute };

    signalSubscribers.push(_activeSubscriber);

    activeSubscriber = _activeSubscriber;
    _execute();
    activeSubscriber = undefined;

    return signalSubscribers.length - 1;
  }

  function useSignal<T>(value: T) {
    let _value: T = value;

    const signalList: (SignalItem | undefined)[] = [];

    function setValue(handler: (value: T) => T): void;
    function setValue(value: T): void;
    function setValue(signalValue: T | ((value: T) => T)) {
      let _signalValue = signalValue as any;
      if (typeof _signalValue === "function") {
        _signalValue = _signalValue(_value);
      }
      if (_signalValue !== _value) {
        _value = _signalValue;
        signalList.forEach((signal, index) => {
          if (signal) {
            if (signal.execute) {
              signal.execute();
            } else {
              signalList[index] = undefined;
            }
          }
        });
      }
    }

    return [
      () => {
        if (activeSubscriber && !signalList.includes(activeSubscriber)) {
          signalList.push(activeSubscriber);
        }
        return _value;
      },
      setValue,
    ] as const;
  }

  function destroyEffect(id: number) {
    const signal = signalSubscribers[id];
    if (signal) {
      signal.execute = undefined;
    }
    signalSubscribers[id] = undefined;
  }

  return {
    useEffect,
    useSignal,
    destroyEffect,
  };
}

export const { useEffect, useSignal, destroyEffect } = createSignalEffect();
