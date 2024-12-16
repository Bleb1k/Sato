import { splitParameters } from "./lib.js";

const LOGGING = true;

function log(...args) {
  if (LOGGING) console.log(...args);
}

/** @link {https://regex101.com/r/5bqW4M/4} */
const classRegex =
  /(?<paren>[{}])|(?<className>(?<=(?:class)\s+)\w+)|(?<function>(?<fnPad>\n? +)(?<fnGetSet>get|set)??\s*(?<fnName>#?\w+)\s*(?:\|(?<fnOp>[^\w\s|]+?)\|)?\s*\((?<fnParams>[^]*?)?\)\s*(?<fnBody>{(?:(?:[^\n]*?\n *(?<=(?:\k<fnPad>)))*}|[^]*?})))\n|(?<comment>\/\/.*$|\/\*[^]*?\*\/)|[{}]|(?<param>(?<paramPad>\n +)(?<paramName>#?\w+)(?:\s*:\s*(?<paramType>\w+))?(?:\s*=\s*(?<paramDefault>[^]*?)(?=\k<paramPad>[\w#/]))?)|(?<class>class)|(?<pad>(?<padChar>\s)?\k<padChar>*)/gm;

export function parseClass(src) {
  const data = {
    /** @type {string} */
    name,
    /** @type {{name: string, default: string?}[]} */
    fields: [],
    /** @type {{comment: string?, func: string}[]} */
    functions: [],
  };
  let pendingComment;
  for (const match of src.matchAll(classRegex)) {
    let { groups } = match;
    const buf = (groups = Object.entries(groups).filter(
      ([_, v]) => v !== undefined,
    ))[0];
    groups = Object.fromEntries(groups);
    switch (buf[0]) {
      case "className": {
        data.name = buf[1];
        break;
      }
      case "comment": {
        pendingComment = buf[1];
        continue;
      }
      case "function": {
        const fn = { func: buf[1] };
        if (pendingComment ?? 0) fn.comment = pendingComment;
        data.functions.push(fn);
        if (groups.fnName !== "constructor") break;
        const params = splitParameters(groups.fnParams);
        log(params);
        break;
      }
      default:
        break;
    }
    pendingComment = null;
  }
  log(data);
}
