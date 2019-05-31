import { of, fromEvent } from "rxjs";
import { ajax } from "rxjs/ajax";
import { map, take, switchMap, catchError, retryWhen } from "rxjs/operators";

export const argsToString = args => {
  Object.keys(args)
    .map(key => `${key}_${object[key]}`)
    .sort()
    .join(".");
};

export const connect = ({ apiUrl, apikey, fallbackUrl, vid }) => {
  // new cache for this instantiation
  // really we should use some browser storage for the cache,
  // and then we can load data in the service worker... ultimately.
  const cache = window.__APP_CACHE__ || {};
  return ({ queryName, args }) => {
    const cacheId = `${queryName}_${argsToString(args)}`;

    return cache[cacheId]
      ? of(cache[cacheId])
      : ajax({
          // trying api on same domain
          // ${SERVER_URL}
          // need to send user-id here or allow cookie?
          url: `${apiUrl}/resolve-feature/${queryName}?apikey=${apikey}&vid=${vid}&args=${encodeURIComponent(
            JSON.stringify(args)
          )}`,
          crossDomain: true
          //   headers: {
          //       "x-api-key": apiKey
          //   },
          // createXHR: () => new XMLHttpRequest() // is this needed?
        }).pipe(
          retryWhen(error$ =>
            error$.pipe(
              switchMap(error => {
                if (!navigator.onLine) {
                  return fromEvent(window, "online");
                } else {
                  throw error;
                }
              })
            )
          ),
          catchError(e => {
            return ajax({
              url: fallbackUrl,
              crossDomain: true
            }).pipe(transforming());
          }),
          take(1),
          map(({ response }) => {
            cache[cacheId] = response;
            return response;
          })
        );
  };
};
