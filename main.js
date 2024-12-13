import { splitParameters } from "./lib/lib.js";

const args = Deno.args;

if (!args.length) {
  Deno.exit((console.log("Supply file name"), 1));
}

const filePath = Deno.realPathSync(Deno.args[0]);
let file = Deno.readTextFileSync(filePath)

const includes = [];
let result = "";
let needsRerun = true
let foo = 2
while (needsRerun) {
  needsRerun = false
  for (const match of file.matchAll(
    /(?<forCapture>for *\( *(?<FCIterable>[^)]*?) *\) *\| *(?<FCVariable>[^|]*?) *\|)|(?<range>\d+\.\.(?:=(?=\d))?\d*)|(?<word>\w+)|(?<paren>[<>(){}[\]])|(?<comment>\/\/.*$|\/\*[^]*?\*\/)|(?<punc>(?<puncInner>[^])\k<puncInner>*)/gm
  )) {
    const buf = Object.entries(match.groups).filter(
      ([_, v]) => v !== undefined,
    )[0];

    switch (buf[0]) {
      case "forCapture":
        needsRerun = true
        if (!includes.includes("FCIter")) includes.push("FCIter")
        const { FCIterable, FCVariable } = match.groups
        const [iterables, variables] = [splitParameters(FCIterable), splitParameters(FCVariable)]
        if (iterables.length < variables.length) {
          // TODO: getPosition -> `${line}:${index}`
          throw new Error(`Can't capture ${variables.length} parameters, ${iterables.length} supplied.\n    at file://${filePath} index:${match.index}\n        ${match[0]}`);
        }
        while (iterables.length > variables.length) variables.push("_")
        buf[1] = `for (const [${variables}] of FCIter(${iterables}))`
        break;
      case "range": {
        const including = buf[1] !== (buf[1] = buf[1].replace("=", ""));
        let [min, max] = buf[1].split("..");
        if (max === "" || max - min > 1000) {
          if (!includes.includes("range")) includes.push("range");
          buf[1] = `range(${max === "" ? min : [min, max]})`;
          break;
        }
        [min, max] = [min, max].map(Number);
        if (including) max += 1;
        buf[1] = `new Array(${max - min}).fill(${min}).map((n, i) => n + i)`;
        break;
      }
      default:
        break;
    }

    result += buf[1];
  }
  if (needsRerun) {
    file = result
    result = ""
  }
}

result = `import { ${includes.toString()} } from "./std.js";\n${result}`;
Deno.writeTextFileSync(Deno.realPathSync(Deno.args[0]) + ".js", result);
