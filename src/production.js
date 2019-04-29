import { of } from "rxjs";
import { ajax } from "rxjs/ajax";
import { map, take } from "rxjs/operators";
import stableStringify from "fast-stable-stringify";
import sha1 from "sha1";

export const connect = ({
  apikey,
  apiUrl = "https://dog-api.digitaloptgroup.com"
}) => {
  // new cache for this instantiation
  // really we should use some browser storage for the cache,
  // and then we can load data in the service worker... ultimately.
  const cache = window.__APP_CACHE__ || {};
  const queries = [];
  return ({ queryName, args }) => {
    queries.push({ queryName, args });

    const featureId = `${queryName}_${sha1(stableStringify(args))}`;

    return cache[featureId]
      ? of(cache[featureId])
      : ajax({
          // trying api on same domain
          // ${SERVER_URL}
          // need to send user-id here or allow cookie?
          url: `${apiUrl}/resolve-feature/${queryName}?apikey=${apikey}&args=${encodeURIComponent(
            JSON.stringify(args)
          )}`,
          crossDomain: true,
          //   headers: {
          //       "x-api-key": apiKey
          //   },
          createXHR: () => new XMLHttpRequest()
        }).pipe(
          take(1),
          map(({ response }) => {
            cache[featureId] = response;

            return response;
          })
        );
  };
};
