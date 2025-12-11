export function init() {}

export function log(error) {
  console.log(error);
}

export default {
  init,
  log,
};

// we can use external dependencies like sentry to log
