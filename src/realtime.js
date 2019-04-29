import { webSocket } from "rxjs/webSocket";
import { timer, fromEvent } from "rxjs";
import { share, pluck, switchMap, retryWhen, tap } from "rxjs/operators";
import stableStringify from "fast-stable-stringify";
import sha1 from "sha1";

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
    const featureId = `${queryName}_${sha1(stableStringify(args))}`;
    if (cache[featureId] === undefined) {
      cache[featureId] = subject
        .multiplex(
          () => ({ action: "subscribe", featureId }),
          () => ({ action: "unsubscribe", featureId }),
          message => message.featureId === featureId
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
    return cache[featureId];
  };

  return ({ queryName, args }) => {
    // subscribe to the feature
    return subscribeToFeature(queryName, args);
  };
};
