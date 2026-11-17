import { fileURLToPath } from "node:url";
/** True when the module at `url` is the script Node was started with. */
export const isMain = (url) => process.argv[1] === fileURLToPath(url);
