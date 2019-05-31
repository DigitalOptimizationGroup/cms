import { webSocket } from "rxjs/webSocket";
import { timer, fromEvent } from "rxjs";
import { share, pluck, switchMap, retryWhen, tap } from "rxjs/operators";
import { argsToString } from "./production";

export const connect = ({
  realtimeUrl = "wss://realtime.digitaloptgroup.com"
}) => {
  const cache = {};

  // of course this needs to be our new auth token
  const urlParams = new URLSearchParams(window.location.search);
  const token =
    urlParams.get("token") || localStorage.getItem("realtime_token");

  const subject = webSocket(`${realtimeUrl}?token=${token}`);

  const subscribeToFeature = (queryName, args = {}) => {
    const cacheId = `${queryName}_${argsToString(args)}`;

    if (cache[cacheId] === undefined) {
      cache[cacheId] = subject
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
          share()
        );
    }
    return cache[cacheId];
  };

  return ({ queryName, args }) => {
    // subscribe to the feature
    return subscribeToFeature(queryName, args);
  };
};
