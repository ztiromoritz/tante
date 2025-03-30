import repl from "repl";

import moment from "moment";

let r = repl.start({
  ignoreUndefined: true,
  replMode: repl.REPL_MODE_STRICT,
});

r.context.moment = moment;
r.context.$ = moment;
