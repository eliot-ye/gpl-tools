import { debounce } from "./utils/tools";

interface SFn<T> {
  (): T;
}
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

  const subscriberMap: (SubscriberItem | undefined)[][] = [];

  let activeSubscriber: SubscriberItem | undefined;

  /**
   * 注意：初始化时会执行一次callback，用于收集所有Signal依赖项，此时所有需要有反应性的依赖项都应该执行一次
   */
  function useEffect(callback: Execute) {
    function _execute() {
      try {
        return callback();
      } catch (error) {
        console.error(`${_mark} useEffect error:`, error);
      }
    }
    const execute = debounce(_execute, { wait: 0 });

    const _activeSubscriber: SubscriberItem = { execute };

    activeSubscriber = _activeSubscriber;
    let beforeDestroy = _execute();
    _activeSubscriber.beforeDestroy = beforeDestroy;
    activeSubscriber = undefined;

    return () => {
      subscriberMap.forEach((_subscriberList) => {
        _subscriberList.forEach((_subscriber, _index) => {
          if (_subscriber?.execute === execute) {
            beforeDestroy = _subscriber.beforeDestroy;
            _subscriberList.splice(_index, 1);
          }
        });
      });
      beforeDestroy && beforeDestroy();
    };
  }

  function useWatch<T>(signalFn: SFn<T>, callback: Execute): () => void;
  function useWatch<T>(signalList: SFn<T>[], callback: Execute): () => void;
  function useWatch<T>(signal: SFn<T> | SFn<T>[], callback: Execute) {
    function _execute() {
      try {
        return callback();
      } catch (error) {
        console.error(`${_mark} useWatch error:`, error);
      }
    }
    const execute = debounce(_execute, { wait: 0 });

    const _activeSubscriber: SubscriberItem = { execute };

    activeSubscriber = _activeSubscriber;
    if (Array.isArray(signal)) {
      for (let i = 0; i < signal.length; i++) {
        signal[i]();
      }
    } else {
      signal();
    }
    activeSubscriber = undefined;

    return () => {
      let beforeDestroy: any;
      subscriberMap.forEach((_subscriberList) => {
        _subscriberList.forEach((_subscriber, _index) => {
          if (_subscriber?.execute === execute) {
            beforeDestroy = _subscriber.beforeDestroy;
            _subscriberList.splice(_index, 1);
          }
        });
      });
      beforeDestroy && beforeDestroy();
    };
  }

  function useSignal<T>(initValue: T) {
    let _inValue = initValue;

    const subscriberList: (SubscriberItem | undefined)[] = [];
    subscriberMap.push(subscriberList);

    function setValueHandle(value: T): void;
    function setValueHandle(rValue: (value: T) => T): void;
    function setValueHandle(value: T | ((value: T) => T)) {
      let _nValue = value as T;
      if (typeof _nValue === "function") {
        _nValue = _nValue(_inValue);
      }
      if (Object.is(_nValue, _inValue)) {
        return;
      }
      // const _oValue = _inValue;
      _inValue = _nValue;
      subscriberList.forEach((_subscriber) => {
        if (_subscriber && _subscriber.execute) {
          _subscriber.beforeDestroy = _subscriber.execute();
        }
      });
    }

    function getValueHandle() {
      if (activeSubscriber && !subscriberList.includes(activeSubscriber)) {
        subscriberList.push(activeSubscriber);
      }
      return _inValue;
    }

    getValueHandle.$set = setValueHandle;

    return getValueHandle;
  }

  return {
    useEffect,
    useSignal,
    useWatch,
  };
}

export const { useEffect, useSignal, useWatch } = createSignalEffect();
