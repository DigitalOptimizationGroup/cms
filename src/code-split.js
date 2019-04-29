const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

export const connect = ({
  apikey,
  apiUrl = "https://dog-api.digitaloptgroup.com",
  queryId
}) => {
  return ({ queryName, args }) => {
    if (token !== null) {
      import("./production")
        .then(({ connect }) => {
          // Use moduleA
        })
        .catch(err => {
          // Handle failure
        });
    } else {
      import("./realtime")
        .then(({ connect }) => {
          // Use moduleA
        })
        .catch(err => {
          // Handle failure
        });
    }
  };
};
