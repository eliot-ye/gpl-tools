import { debounce } from "./utils/tools";

interface SubscriberItem {
  execute?: () => void;
}

let serialNumber = 0;

export function createSignalEffect(mark?: string) {
  serialNumber++;
  const _mark = mark || `SerialNumber-${serialNumber}`;

  const signalSubscribers: (SubscriberItem | undefined)[] = [];

  let activeSubscriber: SubscriberItem | undefined;

  function useEffect(callback: () => void) {
    const index = signalSubscribers.length;

    function _execute() {
      try {
        callback();
      } catch (error) {
        console.error(`${_mark} useEffect (index: ${index}) error:`, error);
      }
    }
    const execute = debounce(_execute, { wait: 0 });

    const _activeSubscriber = { execute };

    signalSubscribers.push(_activeSubscriber);

    activeSubscriber = _activeSubscriber;
    _execute();
    activeSubscriber = undefined;

    return index;
  }

  function useSignal<T>(initValue: T) {
    let _oValue = initValue;

    const subscriberList: (SubscriberItem | undefined)[] = [];

    function setValueHandle(rValue: (value: T) => T): void;
    function setValueHandle(value: T): void;
    function setValueHandle(value: T | ((value: T) => T)) {
      let _nValue = value as any;
      if (typeof _nValue === "function") {
        _nValue = _nValue(_oValue);
      }
      if (_nValue === _oValue) {
        return;
      }
      _oValue = _nValue;
      subscriberList.forEach((_subscriber, index) => {
        if (_subscriber) {
          if (_subscriber.execute) {
            _subscriber.execute();
          } else {
            subscriberList[index] = undefined;
          }
        }
      });
    }

    function getValueHandle() {
      if (activeSubscriber && !subscriberList.includes(activeSubscriber)) {
        subscriberList.push(activeSubscriber);
      }
      return _oValue;
    }

    return [getValueHandle, setValueHandle] as const;
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
