const args = Deno.args;

if (!args.length) {
    Deno.exit((console.log("Supply file name"), 1));
}

const file = Deno.readTextFileSync(Deno.realPathSync(Deno.args[0]));

const includes = [];
let result = "";

for (const match of file.matchAll(
    /(?<word>\w+)|(?<paren>[<>(){}[\]])|(?<comment>\/\/.*$|\/\*[^]*?\*\/)|(?<punctuation>([^])\5*)/gmy,
)) {
    const buf = Object.entries(match.groups).filter(
        ([_, v]) => v !== undefined,
    )[0];

    switch (buf[0]) {
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

result = `import { ${includes.toString()} } from "./std.js";\n${result}`;
console.log("Done compiling!!\n\n");
Deno.writeTextFileSync(Deno.realPathSync(Deno.args[0]) + ".js", result);
