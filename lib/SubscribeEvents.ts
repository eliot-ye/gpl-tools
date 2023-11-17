import { getOnlyStr } from "./utils/tools";

interface HandlerFn<T, E extends keyof T> {
  (eventData: T[E], ...args: any[]): void;
}

let serialNumber = 0;

export function createSubscribeEvents<T extends Record<string, any>>(
  mark?: string
) {
  serialNumber++;
  const _mark = mark || `SerialNumber-${serialNumber}`;

  type EventName = keyof T;

  interface HandlerMap<E extends EventName> {
    [id: string]: HandlerFn<T, E> | undefined;
  }
  type EventMap = {
    [E in EventName]?: HandlerMap<E>;
  };

  const eventMap: EventMap = {};
  const ids: string[] = [];

  return {
    mark: _mark,

    subscribe<E extends EventName>(eventName: E, handler: HandlerFn<T, E>) {
      let id = getOnlyStr(ids);

      const eventHandlerMap = eventMap[eventName];
      if (eventHandlerMap) {
        eventHandlerMap[id] = handler;
      } else {
        eventMap[eventName] = {
          [id]: handler,
        };
      }

      ids.push(id);
      return id;
    },

    unsubscribe(eventName: EventName, id: string) {
      const eventHandlerMap = eventMap[eventName];
      if (eventHandlerMap) {
        eventHandlerMap[id] = undefined;
      }
      ids.splice(ids.indexOf(id), 1);
    },

    publish<E extends EventName>(
      eventName: E,
      eventData: T[E],
      ...args: any[]
    ) {
      const eventHandlerMap = eventMap[eventName];
      if (!eventHandlerMap) {
        console.error(`${_mark} publish event: ${String(eventName)} not found`);
        return;
      }
      for (const id in eventHandlerMap) {
        try {
          const handler = eventHandlerMap[id];
          handler && handler(eventData, ...args);
        } catch (error) {
          console.error(
            `${_mark} publish (event: ${String(eventName)}) (id: ${id}) error:`,
            error
          );
        }
      }
    },
  } as const;
}
