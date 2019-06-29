import { connect as production } from "./production";
import { internalInit as realtime } from "./realtime";

let selectedResolver;
console.log("HELLO");
const LOGIN_TOKEN_PARAM_NAME = "dog_realtime_token";

// URLSearchParams is only used for realtime mode, it's not
// supported by IE 11, but realtime mode is only for development
// and the Editor requires a modern browser
if (window.URLSearchParams) {
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
        `You are in Realtime Preview mode of Digital Optimization Group's CMS Editor. Click here to logout: ${
          window.location.href
        }?dog_log_out_reatime=yes`
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
