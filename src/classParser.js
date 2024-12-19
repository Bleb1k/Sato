import { splitParameters } from "./lib.js";

const LOGGING = false;

function log(...args) {
    if (LOGGING) console.log(...args);
}

/** @type {{[className: string]: {[op: string]: {name: string, paramLen: number}}}[]} */
export const CLASSES = [];

/** @link {https://regex101.com/r/5bqW4M/4} */
const classRegex =
    /(?<paren>[{}])|(?<className>(?<=(?:class)\s+)\w+)|(?<function>(?<fnPad>\n? +)(?<fnGetSet>get|set)??\s*(?<fnName>#?\w+)\s*(?:\|(?<fnOp>[^\w\s]+)\|)?\s*\((?<fnParams>[^]*?)??\)\s*(?<fnBody>{(?:(?:[^\n]*?\n *(?<=(?:\k<fnPad>})))*}|[^]*?})))\n|(?<comment>\/\/.*$|\/\*[^]*?\*\/)|[{}]|(?<field>(?<fieldPad>\n +)(?<fieldName>#?\w+)(?:\s*:\s*(?<fieldType>[^=;]+(?<!\s)))?(?:\s*=\s*(?<fieldDefault>[^]*?)(?=\k<fieldPad>[\w#/]))?)|(?<class>class)|(?<pad>(?<padChar>\s)?\k<padChar>*)/gm;

export function parseClass(src) {
    const data = {
        /** @type {string} */
        name,
        /** @type {Set<string>} */
        fields: new Set(),
        /** @type {{[name: string]: {type: string, def: string}}} */
        fieldData: {},
        /** @type {{func: string, name: string, comment: string?, op: string?}[]} */
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
            case "field": {
                data.fields.add(groups.fieldName);
                if (
                    groups.fieldType !== undefined ||
                    groups.fieldDefault !== undefined
                ) data.fieldData[groups.fieldName] = {};
                if (groups.fieldType !== undefined) {
                    data.fieldData[groups.fieldName].type = groups.fieldType;
                }
                if (groups.fieldDefault !== undefined) {
                    data.fieldData[groups.fieldName].def = groups.fieldDefault;
                }
                break;
            }
            case "comment": {
                pendingComment = buf[1];
                continue;
            }
            case "function": {
                const fn = {
                    str: buf[1].replace(/\s*\|[^ ]+\|\s*/, ""),
                    name: groups.fnName,
                };
                if (groups.fnOp !== undefined) fn.op = groups.fnOp;
                if (pendingComment !== null && pendingComment !== undefined) {
                    fn.comment = pendingComment;
                }
                if (groups.fnName === "constructor") {
                    const params = parseConstructorParams(groups.fnParams);
                    data.fields = data.fields.union(params.fields);

                    const newFnParams = params.isObj
                        ? `{${
                            params.things
                                .reduce((a, b) => `${a}, ${b.param}`, "")
                                .replace(", ", "")
                        }} = {${
                            params.things
                                .reduce((a, b) =>
                                    `${a}, ${b.param}${
                                        b.def !== undefined ? ": " + b.def : ""
                                    }`, "")
                                .replace(", ", "")
                        }}`
                        : params.things
                            .reduce((a, b) => `${a}, ${b.param} = ${b.def}`, "")
                            .replace(", ", "");
                    fn.str = fn.str.replace(groups.fnParams, newFnParams);

                    let newFnBody = groups.fnBody;
                    for (const { field, param } of params.things) {
                        if (field === undefined || param === undefined) {
                            continue;
                        }
                        newFnBody = newFnBody.replace(
                            "{",
                            `{${
                                groups.fnPad + groups.fnPad.replace("\n", "")
                            }this.${field} = ${param};`,
                        );
                    }
                    fn.str = fn.str
                        .replace(groups.fnBody, newFnBody)
                        .replace(
                            new RegExp(`(?<!${groups.fnPad})}$`),
                            `${groups.fnPad}}`,
                        );
                }
                data.functions.push(fn);
                break;
            }
            default:
                break;
        }
        pendingComment = null;
    }
    const { name: className, fields, fieldData, functions: funcs } = data;
    log(data);
    // log(`\n\n/**\n${
    //     funcs
    //         .filter(({ op }) => op !== undefined)
    //         .map(({ name, op }) => ` * @overloads {${op}} ${name}`)
    //         .join("\n")
    // }\n */\nclass ${className} {${
    //     [...fields.values()]
    //         .map((foo) =>
    //             (fieldData[foo]
    //                 ? `\n  /** @type {${fieldData[foo].type ?? "any"}} */\n  `
    //                 : "") +
    //             foo +
    //             (fieldData[foo]?.def ? ` = ${fieldData[foo]?.def}` : "")
    //         ).join("\n  ")
    // }\n\n  ${
    //     funcs.map(({ str, comment }) =>
    //         ((comment ?? "") + "") + str.replace(/^\n?^  /, "")
    //     ).join(
    //         "\n\n  ",
    //     )
    // }\n}`);
    return `\n\n/**\n${
        funcs
            .filter(({ op }) => op !== undefined)
            .map(({ name, op }) => ` * @overloads {${op}} ${name}`)
            .join("\n")
    }\n */\nclass ${className} {${
        [...fields.values()]
            .map((foo) =>
                (fieldData[foo]
                    ? `\n  /** @type {${fieldData[foo].type ?? "any"}} */\n  `
                    : "") +
                foo +
                (fieldData[foo]?.def ? ` = ${fieldData[foo]?.def}` : "")
            ).join("\n  ")
    }\n\n  ${
        funcs.map(({ str, comment }) =>
            ((comment ?? "") + "") + str.replace(/^\n?^  /, "")
        ).join(
            "\n\n  ",
        )
    }\n}`;
}

function parseConstructorParams(src) {
    const isObj = src[0] === "{" ? (src.at(-1) === "}" ? true : false) : false;
    const params = splitParameters(src.replace(/^{/, "").replace(/}$/, ""));

    const fields = new Set();
    const things = [];
    for (const i in params) {
        const paramStr = params[i];
        const items = paramStr.split(/\s*=\s*/g);
        switch (items.length) {
            case 1: {
                const [param] = items;
                if (param[0] !== "#") {
                    things.push({ param });
                } else fields.add(param);
                break;
            }
            case 2: {
                const [fieldOrParam, paramOrDef] = items;
                let field, param, def;
                if (fieldOrParam[0] === "#") {
                    field = fieldOrParam;
                    param = paramOrDef;
                    things.push({ field, param });
                    fields.add(field);
                } else {
                    param = fieldOrParam;
                    def = paramOrDef;
                    things.push({ param, def });
                }
                break;
            }
            case 3: {
                const [field, param, def] = items;
                things.push({ field, param, def });
                fields.add(field);
                break;
            }
            default:
                break;
        }
    }
    return ({ fields, things, isObj });
}
