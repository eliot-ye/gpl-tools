import { getOnlyStr } from "./utils/tools";

interface Handler<T> {
  (eventData: T): void;
}

let serialNumber = 0;

export function createSubscribeEvents<T = any>(mark?: string) {
  serialNumber++;
  const _mark = mark || `SerialNumber-${serialNumber}`;

  const handlerMap: { [id: string]: Handler<T> | undefined } = {};
  const ids: string[] = [];

  return {
    _interfaceType: "SubscribeEvents",
    _mark,

    subscribe(handler: Handler<T>) {
      let id = getOnlyStr(ids);

      handlerMap[id] = handler;

      ids.push(id);
      return id;
    },

    unsubscribe(id: string) {
      handlerMap[id] = undefined;
      ids.splice(ids.indexOf(id), 1);
    },

    publish(eventData: T) {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        try {
          const handler = handlerMap[id];
          handler && handler(eventData);
        } catch (error) {
          console.error(`${_mark} publish (id: ${id}) error:`, error);
        }
      }
    },
  } as const;
}
