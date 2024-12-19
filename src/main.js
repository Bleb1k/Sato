import { parse } from "./lib.js";
class Foo {
    constructor({ abc } = { abc: 1 }) {}
}
const args = Deno.args;

if (!args.length) {
    Deno.exit((console.log("Supply file name"), 1));
}

const filePath = Deno.realPathSync(Deno.args[0]);
const src = Deno.readTextFileSync(filePath);

let [result, { includes }] = parse(src);

result = `import { ${[...includes.values()]} } from "./lib/std.js";\n${result}`;

Deno.writeTextFileSync(filePath + ".js", result);
