export function* range(from, to) {
  if (to ?? 0) {
    while (from < to) yield from++;
  } else {
    while (true) yield from++;
  }
}

export function* FCIter(...iterables) {
  const arrays = iterables.filter(o => o instanceof Array)
  const next = (obj, i) => obj instanceof Array ? obj[i] : obj.next().value;
  let i = 0
  if (arrays.length === 0) {
    while (true) yield iterables.map(v => next(v))
  };
  const max = arrays.reduce((a, b) => Math.max(a, b.length), 0)
  if (max > 0) {
    while (i < max) { yield iterables.map(v => next(v, i)); ++i }
  }
  return;
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
