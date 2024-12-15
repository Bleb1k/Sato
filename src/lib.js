const LOGGING = false;

function log(...args) {
    if (LOGGING) console.log(...args);
}

function splitParameters(paramString) {
    const params = [];
    let currentParam = "";
    let bracketCount = 0; // To track nested brackets

    for (let char of paramString) {
        if (char === "[" || char === "{" || char === "(") {
            bracketCount++;
        } else if (char === "]" || char === "}" || char === ")") {
            bracketCount--;
        }

        // If we encounter a comma and we're not inside any brackets, we split
        if (char === "," && bracketCount === 0) {
            params.push(currentParam.trim());
            currentParam = ""; // Reset for the next parameter
        } else {
            currentParam += char; // Build the current parameter
        }
    }

    // Push the last parameter if there's any remaining
    if (currentParam) {
        params.push(currentParam.trim());
    }

    return params;
}

function parseStr(groups) {
    if (groups.strChar !== "`") return [groups.str, new Set()];
    log("pStr(start): ", [groups.str], groups.strChar, "`");

    const str = groups.strContent;
    let depth = 0; // To track nested brackets
    let toParse = "";
    let result = "";
    let inc = new Set();

    for (let i = 0; i < str.length; ) {
        let char = str[i++];
        // log(i - 1, "char:", char);
        if (depth === 0) {
            result += char;
            log("d0:", [result]);
        } else {
            toParse += char;
            log("dN:", [toParse]);
        }
        // log(`v\n${result}\n^\nvv\n${toParse}\n^^`);

        if (depth === 0 && char !== "$") continue;
        if (depth === 0) char = str[i++];
        // log("parsing", char);

        if (char === "{") {
            depth++;
            log("depth:", depth);
        } else if (char === "}") {
            if (--depth === 0) {
                log("toParse:", [toParse]);
                const [res, { includes }] = parse(toParse);
                toParse = "";
                log("inc", inc, includes);
                inc = inc.union(includes);
                result += "{" + res;
            }
            log("depth:", depth);
        }
    }
    log("pStr(end): ", [result, inc]);
    return ["`" + result + "`", inc];
}
export function parse(src, { includes } = { includes: new Set() }) {
    let result = "";
    for (const match of src.matchAll(
        /(?<str>(?<strChar>['"`])(?<strContent>[^]*?)(?<!\\)\k<strChar>)|(?<forCapture>for *\( *(?<FCIterable>[^)]*?) *\) *\| *(?<FCVariable>[^|]*?) *\|)|(?<range>\d+\.\.(?:=(?=\d))?\d*)|(?<word>\w+)|(?<paren>[<>(){}[\]])|(?<comment>\/\/.*$|\/\*[^]*?\*\/)|(?<punc>(?<puncChar>[^])\k<puncChar>*)/gm,
    )) {
        const { groups } = match;

        const buf = Object.entries(groups).filter(
            ([_, v]) => v !== undefined,
        )[0];
        switch (buf[0]) {
            case "str": {
                const [res, inc] = parseStr(groups);
                buf[1] = res;
                console.log(includes, inc);
                includes = includes.union(inc);
                break;
            }
            case "forCapture": {
                if (!includes.has("FCIter")) includes.add("FCIter");
                const { FCIterable, FCVariable } = groups;
                const [iterables, variables] = [
                    splitParameters(FCIterable),
                    splitParameters(FCVariable),
                ];
                if (iterables.length < variables.length) {
                    // TODO: getPosition -> `${line}:${index}`
                    throw new Error(
                        `Can't capture ${variables.length} parameters, ${
                            iterables.length
                        } supplied.\n    at file://${
                            filePath
                        } index:${match.index}\n        ${match[0]}`,
                    );
                }
                while (iterables.length > variables.length) variables.push("_");
                buf[1] = `for (const [${variables}] of FCIter(${iterables.map((v) => parse(v)[0])}))`;
                break;
            }
            case "range": {
                const including = buf[1] !== (buf[1] = buf[1].replace("=", ""));
                let [min, max] = buf[1].split("..");
                if (including && max !== "") max = Number(max) + 1;
                if (!includes.has("range")) includes.add("range");
                buf[1] = `range(${max === "" ? min : [min, max]})`;
                break;
            }
            default:
                break;
        }
        log(buf);
        result += buf[1];
    }
    return [result, { includes }];
}