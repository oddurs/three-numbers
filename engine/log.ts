/** Terminal output. Colour is used sparingly, and disabled when not a TTY. */

const ESC = String.fromCharCode(27);
const useColor = process.stdout.isTTY && process.env["NO_COLOR"] === undefined;
const wrap = (code: string) => (s: string) => (useColor ? `${ESC}[${code}m${s}${ESC}[0m` : s);

export const style = {
  bold: wrap("1"),
  dim: wrap("2"),
  red: wrap("31"),
  green: wrap("32"),
  yellow: wrap("33"),
  blue: wrap("34"),
  cyan: wrap("36"),
  grey: wrap("90"),
};

export const log = {
  info: (msg: string) => console.log(msg),
  step: (msg: string) => console.log(`${style.cyan("*")} ${msg}`),
  ok: (msg: string) => console.log(`${style.green("ok")} ${msg}`),
  warn: (msg: string) => console.warn(`${style.yellow("!")}  ${msg}`),
  error: (msg: string) => console.error(`${style.red("x")}  ${msg}`),
  detail: (msg: string) => console.log(`   ${style.grey(msg)}`),
  blank: () => console.log(""),
};

export const duration = (ms: number): string =>
  ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;

export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${n} ${n === 1 ? one : many}`;
