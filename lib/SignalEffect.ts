import { debounce } from "./utils/tools";

interface Execute {
  (): void | (() => void);
}
interface SubscriberItem {
  execute?: Execute;
  beforeDestroy?: void | (() => void);
}

let serialNumber = 0;

export function createSignalEffect(mark?: string) {
  serialNumber++;
  const _mark = mark || `SerialNumber-${serialNumber}`;

  const signalSubscribers: (SubscriberItem | undefined)[] = [];

  let activeSubscriber: SubscriberItem | undefined;

  /**
   * 注意：初始化时会执行一次callback，用于收集所有Signal依赖项，此时所有需要有反应性的依赖项都应该执行一次
   */
  function useEffect(callback: Execute) {
    const index = signalSubscribers.length;

    function _execute() {
      try {
        return callback();
      } catch (error) {
        console.error(`${_mark} useEffect (index: ${index}) error:`, error);
      }
    }
    const execute = debounce(_execute, { wait: 0 });

    const _activeSubscriber: SubscriberItem = { execute };

    signalSubscribers.push(_activeSubscriber);

    activeSubscriber = _activeSubscriber;
    _activeSubscriber.beforeDestroy = _execute();
    activeSubscriber = undefined;

    return index;
  }

  function useSignal<T>(initValue: T) {
    let _oValue = initValue;

    const subscriberList: (SubscriberItem | undefined)[] = [];

    function setValueHandle(value: T): void;
    function setValueHandle(rValue: (value: T) => T): void;
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
            _subscriber.beforeDestroy = _subscriber.execute();
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

    getValueHandle.$set = setValueHandle;

    return getValueHandle;
  }

  function destroyEffect(id: number) {
    const signal = signalSubscribers[id];
    if (signal) {
      if (signal.beforeDestroy) {
        signal.beforeDestroy();
      }
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
