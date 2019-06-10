import { of, fromEvent } from "rxjs";
import { ajax } from "rxjs/ajax";
import { map, take, switchMap, catchError, retryWhen } from "rxjs/operators";

export const argsToString = args => {
  return Object.keys(args)
    .map(key => `${key}_${args[key]}`)
    .sort()
    .join(".");
};

export const connect = ({ apiUrl, apikey, fallbackUrl, vid }) => {
  // new cache for this instantiation
  // really we should use some browser storage for the cache,
  // and then we can load data in the service worker... ultimately.
  const cache = window.__APP_CACHE__ || {};
  const fallbackCache = window.__FALLBACK_APP_CACHE__ || {};
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
          map(({ response }) => {
            // we only save real responses into the cache
            cache[cacheId] = response;
            return response;
          }),
          catchError(e => {
            // log this error to dog
            // check for already fetched fallback JSON
            if (fallbackCache[cacheId]) {
              return of(fallbackCache[cacheId]);
            } else {
              return ajax({
                url: fallbackUrl,
                crossDomain: true
              }).pipe(
                map(({ response }) => {
                  fallbackCache = response;
                  return fallbackCache[cacheId];
                })
              );
            }
          }),
          take(1)
        );
  };
};
