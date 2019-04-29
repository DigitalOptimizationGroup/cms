import { connect as production } from "./production";
import { connect as realtime } from "./realtime";

const urlParams = new URLSearchParams(window.location.search);
var token = urlParams.get("token");
var logOut = urlParams.get("logout_realtime");

if (token !== null) {
  localStorage.setItem("realtime_token", token);
} else {
  token = localStorage.getItem("realtime_token");
}

if (logOut !== null) {
  token = null;
  localStorage.removeItem("realtime_token");
}

export const connect = token !== null ? realtime : production;
