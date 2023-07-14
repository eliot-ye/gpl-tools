import { debounce, getOnlyStr } from "./utils/tools";

type JSONConstraint = Record<string, any>;
type Option<C extends string, T extends JSONConstraint> = {
  [code in C]: T;
};

interface ListenerFn<C, T> {
  (code: C, keys: (keyof T)[]): void;
}

interface SubscribeFn<T> {
  (value: T): void;
}

let serialNumber = 0;

export function createReactiveConstant<
  C extends string,
  T extends JSONConstraint
>(opt: Option<C, T>, mark?: string) {
  serialNumber++;
  const _mark = mark || `SerialNumber-${serialNumber}`;

  const defaultActiveCode = Object.keys(opt)[0] as C;
  let activeCode = defaultActiveCode;
  const defaultValue = opt[defaultActiveCode] as T;

  type Key = keyof T;

  type ListenerId = string;
  let listenerMap: { [id: ListenerId]: ListenerFn<C, T> | undefined } = {};
  let listenerIds: ListenerId[] = [];
  function listenerHandle(_activeCode: C, changeKeys: Key[]) {
    for (let i = 0; i < listenerIds.length; i++) {
      const listener = listenerMap[listenerIds[i]];
      try {
        listener && listener(_activeCode, changeKeys);
      } catch (error) {
        console.error(
          `${_mark} listener (id: ${listenerIds[i]}) error:`,
          error
        );
      }
    }
  }

  type SubscribeId = string;
  const subscribeMap: {
    [id: SubscribeId]: { fn: SubscribeFn<T>; keys?: Key[] } | undefined;
  } = {};
  const subscribeIds: SubscribeId[] = [];
  let effectKeys: Key[] = [];
  const effectHandler = debounce(
    (_value: T) => {
      subscribeIds.forEach((_id) => {
        const subscribe = subscribeMap[_id];
        if (subscribe?.keys) {
          let hasSubscribe = false;
          for (const _key of effectKeys) {
            if (subscribe.keys.includes(_key)) {
              hasSubscribe = true;
            }
          }
          if (hasSubscribe) {
            try {
              subscribe.fn(_value);
            } catch (error) {
              console.error(`${_mark} subscribe (id: ${_id}) error:`, error);
            }
          }
        } else if (subscribe) {
          try {
            subscribe.fn(_value);
          } catch (error) {
            console.error(`${_mark} subscribe (id: ${_id}) error:`, error);
          }
        }
      });
      effectKeys = [];
    },
    { wait: 0 }
  );

  const returnValue = {
    ...defaultValue,

    _interfaceType: "ReactiveConstant",
    _mark,

    /**
     * - setValue 内部会进行数据的浅层对比。对比相同的属性，不会更新和触发订阅函数。
     * @param value - 不能是`undefined`和是函数
     */
    $setValue<K extends Key>(key: K, value: T[K]) {
      const oldValue = returnValue[key];
      if (
        oldValue !== value &&
        value !== undefined &&
        typeof returnValue[value] !== "function"
      ) {
        returnValue[key] = value;
        effectKeys.push(key);
        effectHandler(returnValue);
        listenerHandle(activeCode, [key]);
      }
    },
    $setCode(code: C) {
      if (activeCode !== code) {
        activeCode = code;

        const valueMap: T = opt[activeCode];

        let changeKeys: Key[] = [];

        const keyList = Object.keys(valueMap) as Key[];
        keyList.forEach((_key) => {
          const valueStr = valueMap[_key];
          if (valueStr !== undefined && returnValue[_key] !== valueStr) {
            changeKeys.push(_key);
            effectKeys.push(_key);
            returnValue[_key] = valueStr;
          }
        });

        effectHandler(returnValue);
        listenerHandle(activeCode, changeKeys);
      }
    },
    $getCode() {
      return activeCode;
    },

    /**
     * @param fn - 订阅函数
     * - 初始化时会执行一次
     * - 使用 $setValue 时，内部在更新数据后才触发函数预计算，订阅函数获取的数据是最新的。
     * - 短时间内多次使用 $setValue 时，会触发防抖处理，订阅函数只执行一次。
     * @param keys - 订阅属性
     * - 只有订阅的属性发生了更改才触发执行订阅函数。如果不传入该参数，则所有属性更改都会执行。
     * - 如果传入空数组，则订阅函数只执行一次，并且不会返回 SubscribeId
     * @returns `subscribeId`
     */
    $subscribe<K extends Key>(fn: SubscribeFn<T>, keys?: K[]) {
      try {
        fn(returnValue);
      } catch (error) {
        console.error(`${_mark} subscribe error:`, error);
      }

      if (keys?.length === 0) {
        return;
      }
      const id: SubscribeId = getOnlyStr(subscribeIds);
      subscribeIds.push(id);
      subscribeMap[id] = {
        fn,
        keys,
      };

      return id;
    },
    $unsubscribe(subscribeId: SubscribeId) {
      subscribeMap[subscribeId] = undefined;
      subscribeIds.splice(subscribeIds.indexOf(subscribeId), 1);
    },

    /**
     * - 监听函数初始化不执行
     * - 监听函数在每次数据更改时（执行$setValue, $setCode时）都执行
     * @returns `listenerId`
     */
    $addListener(fn: ListenerFn<C, T>) {
      const id: ListenerId = getOnlyStr(listenerIds);
      listenerMap[id] = fn;
      listenerIds.push(id);
      return id;
    },
    $removeListener(listenerId: ListenerId) {
      listenerMap[listenerId] = undefined;
      listenerIds.splice(listenerIds.indexOf(listenerId), 1);
    },
  } as const;

  return returnValue;
}
