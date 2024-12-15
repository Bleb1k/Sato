import { splitParameters } from "./src/lib.js";

function gogogadget(src) {
    let isObj = src[0] === "{" ? (src.at(-1) === "}" ? true : false) : false;
    const params = splitParameters(src.replace(/^{/, "").replace(/}$/, ""));

    const fields = new Set();
    const things = [];
    for (const i in params) {
        const paramStr = params[i];
        const items = paramStr.split(/\s*=\s*/g);
        switch (items.length) {
            case 1: {
                const [param] = items;
                things.push({ param });
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
    console.log({ fields, things, isObj });
}

[
    `{#data = str = "default"}`,
    `#data = str = "default"`,
    `{#data = str = "default", #a = a = 1, #b = b = false, #c = c = [{}, 1]}`,
    `#data = str = "default", #a = a = 1, #b = b = false, #c = c = [{}, 1]`,
    `{#data = str}`,
    `#data = str`,
    `#data = "default" // should be valid to throw at compilation`,
    `#data = "default" // same here`,
    `{foo = str = "default"}`,
    `foo = str = "default"`,
    `{foo = str}`,
    `foo = str`,
    `{str = "default"}`,
    `str = "default"`,
    `{str}`,
    `str`,
].forEach((s) => gogogadget(s));
