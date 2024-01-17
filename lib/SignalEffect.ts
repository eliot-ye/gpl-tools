import { debounce, getOnlyStr } from "./utils/tools";

interface SFn<T> {
  (): T;
}
interface Execute {
  (): void | (() => void);
}
interface SubscriberItem {
  execute: Execute;
  beforeDestroy?: void | (() => void);
}

const subscriberMap: { [id: string]: SubscriberItem[][] } = {};
const subscriberMapIds: string[] = [];
let activeSubscriberMapId = "";
let activeSubscriber: SubscriberItem | undefined;

export function createEffectScope() {
  const subscriberMapId = getOnlyStr(subscriberMapIds);
  subscriberMap[subscriberMapId] = [];
  activeSubscriberMapId = subscriberMapId;

  return {
    runActive() {
      activeSubscriberMapId = subscriberMapId;
    },
    destroy() {
      const _subscriberMap = subscriberMap[subscriberMapId];
      for (let index = 0; index < _subscriberMap.length; index++) {
        const _subscriberList = _subscriberMap[index];
        _subscriberList.forEach((_subscriber) => {
          if (_subscriber.beforeDestroy) {
            _subscriber.beforeDestroy();
          }
        });
      }
      subscriberMap[subscriberMapId] = [];
    },
  };
}

export const defaultEffectScope = createEffectScope();

/**
 * 注意：初始化时会执行一次callback，用于收集所有Signal依赖项，此时所有需要有反应性的依赖项都应该执行一次
 */
export function useEffect(callback: Execute) {
  const _subscriberMap = subscriberMap[activeSubscriberMapId];
  function _execute() {
    try {
      return callback();
    } catch (error) {
      console.error(`${activeSubscriberMapId} useEffect error:`, error);
    }
  }
  const execute = debounce(_execute, { wait: 0 });

  const _activeSubscriber: SubscriberItem = { execute };

  activeSubscriber = _activeSubscriber;
  let beforeDestroy = _execute();
  _activeSubscriber.beforeDestroy = beforeDestroy;
  activeSubscriber = undefined;

  return () => {
    _subscriberMap.forEach((_subscriberList) => {
      _subscriberList.forEach((_subscriber, _index) => {
        if (_subscriber.execute === execute) {
          beforeDestroy = _subscriber.beforeDestroy;
          _subscriberList.splice(_index, 1);
        }
      });
    });
    beforeDestroy && beforeDestroy();
  };
}

export function useWatch<T>(signalFn: SFn<T>, callback: Execute): () => void;
export function useWatch<T>(
  signalList: SFn<T>[],
  callback: Execute
): () => void;
export function useWatch<T>(signal: SFn<T> | SFn<T>[], callback: Execute) {
  const _subscriberMap = subscriberMap[activeSubscriberMapId];
  function _execute() {
    try {
      return callback();
    } catch (error) {
      console.error(`${activeSubscriberMapId} useWatch error:`, error);
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
    _subscriberMap.forEach((_subscriberList) => {
      _subscriberList.forEach((_subscriber, _index) => {
        if (_subscriber.execute === execute) {
          beforeDestroy = _subscriber.beforeDestroy;
          _subscriberList.splice(_index, 1);
        }
      });
    });
    beforeDestroy && beforeDestroy();
  };
}

export function useSignal<T>(initValue: T) {
  const _subscriberMap = subscriberMap[activeSubscriberMapId];
  if (!_subscriberMap) {
    throw new Error("useSignal must be called after createEffectScope");
  }

  let _inValue = initValue;

  const subscriberList: SubscriberItem[] = [];
  _subscriberMap.push(subscriberList);

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
      _subscriber.beforeDestroy = _subscriber.execute();
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
