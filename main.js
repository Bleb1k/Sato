import { parse } from "./src/lib.js";

const args = Deno.args;

if (!args.length) {
    Deno.exit((console.log("Supply file name"), 1));
}

const filePath = Deno.realPathSync(Deno.args[0]);
let src = Deno.readTextFileSync(filePath);

let [result, { includes }] = parse(src);

result = `import { ${[...includes.values()]} } from "./lib/std.js";\n${result}`;

Deno.writeTextFileSync(Deno.realPathSync(Deno.args[0]) + ".js", result);
