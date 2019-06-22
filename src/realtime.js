import { webSocket } from "rxjs/webSocket";
import { timer, fromEvent } from "rxjs";
import {
  share,
  pluck,
  switchMap,
  retryWhen,
  tap,
  shareReplay,
  finalize
} from "rxjs/operators";
import { argsToString } from "./production";

export const internalInit = token => ({
  realtimeUrl = "wss://realtime.digitaloptgroup.com"
}) => {
  const cache = new Map();

  const subject = webSocket(`${realtimeUrl}?token=${token}`);

  const subscribeToFeature = (queryName, args = {}) => {
    const cacheId = `${queryName}_${argsToString(args)}`;

    if (!cache.has(cacheId)) {
      const result$ = subject
        .multiplex(
          () => ({ action: "subscribe", queryName, args }),
          () => ({ action: "unsubscribe", queryName, args }),
          ({ queryName, args }) => {
            // this filters the reponses so our multiplex subscriber only gets what they need
            return `${queryName}_${argsToString(args)}` === cacheId;
          }
        )
        .pipe(
          retryWhen(error$ => {
            return error$.pipe(
              switchMap(e => {
                // log error
                return navigator.onLine === true
                  ? timer(1000)
                  : fromEvent(document.body, "online");
              })
            );
          }),
          tap({
            next: x => {
              if (process.env.NODE_ENV !== "production") {
                console.log("From server", x);
              }
            },
            complete() {
              // do logging
            }
          }),
          pluck("feature"),
          finalize(() => {
            // Because we're using shareReplay with refCount, this will only
            // get called when the *last* consumer unsubscribes(), or of course
            // if this ever complete()s or error()s. We don't want to leak memory.
            cache.delete(cacheId);
          }),
          shareReplay({ refCount: true, bufferSize: 1 })
        );
      cache.set(cacheId, result$);
    }
    return cache.get(cacheId);
  };

  return ({ queryName, args }) => {
    // subscribe to the feature
    return subscribeToFeature(queryName, args);
  };
};
