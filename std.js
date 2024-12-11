export function* range(from, to) {
    if (to ?? 0) {
        while (from < to) yield from++;
    } else {
        while (true) yield from++;
    }
}

class Foo {
    #a;
    // either
    // constructor(str = "default") {
    //     this.#a = str;
    // }
    // or
    // constructor({ str } = { str: "default" }) {
    //     this.#a = str;
    // }
}
