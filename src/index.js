import { connect as production } from "./production";
import { internalInit as realtime } from "./realtime";
import { connect as ssr } from "./ssr";

let selectedResolver;

const LOGIN_TOKEN_PARAM_NAME = "dog_realtime_token";

console.log("v.now.2");

if (typeof __DOG_WORKER__ !== "undefined") {
  selectedResolver = ssr;
}

// URLSearchParams is only used for realtime mode, it's not
// supported by IE 11, but realtime mode is only for development
// and the Editor requires a modern browser
else if (
  typeof window !== "undefined" &&
  typeof URLSearchParams === "function"
) {
  // get paramters from URL
  const urlParams = new URLSearchParams(window.location.search);

  var token = urlParams.get(LOGIN_TOKEN_PARAM_NAME);
  var logout = urlParams.get("dog_log_out_reatime");

  // we have log_out_reatime parameter in the URL
  if (logout !== null) {
    localStorage.removeItem(LOGIN_TOKEN_PARAM_NAME);
    sessionStorage.removeItem("dog_realtimeDismissed");
    selectedResolver = production;
  }

  // we have a realtime token
  else if (token !== null) {
    localStorage.setItem(LOGIN_TOKEN_PARAM_NAME, token);
    selectedResolver = realtime(token);
  } else {
    token = localStorage.getItem(LOGIN_TOKEN_PARAM_NAME);

    if (token !== null && !sessionStorage.getItem("dog_realtimeDismissed")) {
      const result = window.confirm(
        "You are in Realtime Preview mode. Click OK to dismiss this message for the remainder of your session or click CANCEL to logout."
      );

      if (result === true) {
        sessionStorage.setItem("dog_realtimeDismissed", true);
        selectedResolver = realtime(token);
      } else {
        localStorage.removeItem(LOGIN_TOKEN_PARAM_NAME);
        sessionStorage.removeItem("dog_realtimeDismissed");
        selectedResolver = production;
      }
    } else if (token !== null) {
      console.warn(
        `You are in Realtime Preview mode of Digital Optimization Group's CMS Editor. Click here to logout: ${window.location.href}?dog_log_out_reatime=yes`
      );
      selectedResolver = realtime(token);
    } else {
      selectedResolver = production;
    }
  }
} else {
  selectedResolver = production;
}

export const connect = selectedResolver;

export const isEdge = typeof __DOG_WORKER__ !== "undefined";

export function registerRoot(id, renderer) {
  console.log("registerRoot");

  console.log("registerRoot: isEdge:", isEdge);
  if (!isEdge) {
    throw new Error(
      "registerRoot should only be called when isEdge is true (when rendering at the Edge.)"
    );
  }

  __DOG_WORKER__.roots.set(id, { id, renderer });
}

export function registerRenderer(renderer) {
  console.log("registerRenderer");
  if (!isEdge) {
    throw new Error(
      "registerRenderer should only be called when isEdge is true (when rendering at the Edge.)"
    );
  }

  __DOG_WORKER__.render = renderer;
}

// TODO: remove this after we've migrated projects off of it, to edgeInfo prop
export function getEdgeInfo(defaults = {}) {
  if (isEdge) {
    return { ...defaults, ...__DOG_WORKER__.edgeUserInfo };
  } else if (
    typeof window !== "undefined" &&
    typeof window.__EDGE_USER_INFO__ === "object"
  ) {
    return { ...defaults, ...window.__EDGE_USER_INFO__ };
  } else {
    return defaults;
  }
}

export const edgeInfo = (() => {
  if (isEdge) {
    return __DOG_WORKER__.edgeUserInfo;
  } else if (typeof window !== "undefined" && window.__EDGE_USER_INFO__) {
    return window.__EDGE_USER_INFO__;
  } else {
    return {};
  }
})();

export function __EXPERIMENTAL__registerCacheLoader(loader) {
  if (typeof __DOG_WORKER__ !== "undefined") {
    __DOG_WORKER__.cacheLoaders.push(loader);
  }
}

export function __EXPERIMENTAL__getFromCache(key) {
  if (typeof __DOG_WORKER__ !== "undefined") {
    const value = __DOG_WORKER__.userFilledCache[key];

    // save value for client hydration
    __DOG_WORKER__.ssrCache[key] = value;

    return value;
  } else if (typeof window !== "undefined") {
    return window.__SSR_CACHE__ && window.__SSR_CACHE__[key];
  }
}
