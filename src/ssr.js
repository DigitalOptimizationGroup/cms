import { of } from "rxjs";
import { argsToString } from "./production";

export const connect = ({ vid }) => {
  return ({ queryName, args }) => {
    const cacheId = `${queryName}_${argsToString(args)}`;
    const result = __DOG_WORKER__.cacheResolver(cacheId, {
      userId: vid,
      queryName,
      args
    });
    return of(result);
  };
};

// resolve
// set to cache
// return
// test how this works with streaming!!
// new cache for this instantiation
// really we should use some browser storage for the cache,
// and then we can load data in the service worker... ultimately.
// somehow after SSR completes we'd like to pull out this cache and send it down to the browser
// maybe by VID

// let cache = null;
// export function registerCache(newCache) {
//   cache = newCache;
// }

// function getEnv() {
//   if (typeof window !== 'undefined') {
//     return 'browser';
//   }

//   if (typeof self !== 'undefined') {
//     return 'worker';
//   }

//   if (typeof global !== 'undefined') {
//     return 'node';
//   }

//   return 'unknown';
// }

// const env = getEnv();

// function getCache() {
//   switch (env) {
//     case 'browser':
//       return window.__APP_CACHE__ || {};
//     case 'worker':
//       return cache;
//   }
// }

// import { fromFetch } from 'rxjs/fetch';

// const users$ = fromFetch('https://reqres.in/api/users').pipe(
//   switchMap(response => {
//     if (response.ok) {
//       return response.json();
//     } else {
//       return of({ error: true, message: `Error ${response.status}` });
//     }
//   }),
//   catchError((error) => of({ error: true, message: error.message }))
// );

// export events = new EventEmitter();
