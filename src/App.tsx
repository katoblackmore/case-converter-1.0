import React, { useEffect, useMemo, useRef, useState } from "react";

/*
Integrated version:
- Signature view placeholder (so layout stays compatible)
- Case Converter view in original ESG dark style
- Toggle between views (no router)
- RU / EN support

Fix:
- Clipboard API may be blocked in some environments.
- Copy uses a safe fallback:
  1) Try navigator.clipboard.writeText
  2) Fallback to document.execCommand('copy')
  3) If still blocked, select output and show hint.

Also:
- Added lightweight self-tests for transforms (console.assert) in DEV.
*/

type Lang = "en" | "ru";

type ActionKey =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "toggle"
  | "alternating"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "dot"
  | "space";

const UI = {
  en: {
    badge: "Local utility • No server calls",
    title: "Case converter",
    subtitle: "Paste text on the left. Pick a format on the right.",
    input: "Input",
    output: "Result",
    placeholder: "Paste or type text…",
    empty: "Converted text will appear here…",
    clear: "Clear",
    copy: "Copy",
    formats: "Formats",
    preserve: "Preserve spaces & line breaks",
    actions: {
      upper: "UPPERCASE",
      lower: "lowercase",
      title: "Title Case",
      sentence: "Sentence case",
      toggle: "tOGGLE cASE",
      alternating: "aLtErNaTiNg",
      camel: "camelCase",
      pascal: "PascalCase",
      snake: "snake_case",
      kebab: "kebab-case",
      dot: "dot.case",
      space: "space case"
    } as const,
    lang: { en: "EN", ru: "RU" },
    toast: {
      copied: "Copied",
      copyFailed: "Copy blocked. Selected text — press Ctrl/Cmd+C.",
      empty: "Nothing to copy"
    }
  },
  ru: {
    badge: "Локальная утилита • Без сервера",
    title: "Конвертер регистров",
    subtitle: "Вставь текст слева. Выбери формат справа.",
    input: "Ввод",
    output: "Результат",
    placeholder: "Вставь или набери текст…",
    empty: "Тут появится результат…",
    clear: "Очистить",
    copy: "Копировать",
    formats: "Форматы",
    preserve: "Сохранять пробелы и переносы строк",
    actions: {
      upper: "ВСЕ ЗАГЛАВНЫЕ",
      lower: "все строчные",
      title: "Каждое Слово С Заглавной",
      sentence: "Как в предложении",
      toggle: "иНВЕРСИЯ рЕГИСТРА",
      alternating: "чЕрЕдОвАнИе",
      camel: "camelCase",
      pascal: "PascalCase",
      snake: "snake_case",
      kebab: "kebab-case",
      dot: "dot.case",
      space: "разделить пробелами"
    } as const,
    lang: { en: "EN", ru: "RU" },
    toast: {
      copied: "Скопировано",
      copyFailed: "Копирование заблокировано. Текст выделен — нажми Ctrl/Cmd+C.",
      empty: "Нечего копировать"
    }
  }
} as const;

function splitWords(text: string) {
  return text.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function preserveWordTransform(input: string, fn: (w: string) => string) {
  return input.replace(/\p{L}[\p{L}\p{N}]*/gu, (w) => fn(w));
}

function toTitleCase(text: string) {
  return text.replace(/\p{L}[\p{L}\p{N}]*/gu, (w) => {
    const chars = Array.from(w.toLocaleLowerCase());
    if (!chars.length) return "";
    chars[0] = chars[0].toLocaleUpperCase();
    return chars.join("");
  });
}

function toSentenceCase(text: string) {
  const lower = text.toLocaleLowerCase();
  let out = "";
  let capNext = true;

  for (const ch of Array.from(lower)) {
    if (capNext && /\p{L}/u.test(ch)) {
      out += ch.toLocaleUpperCase();
      capNext = false;
      continue;
    }
    out += ch;
    if (/[.!?]/.test(ch) || ch === "\n") capNext = true;
  }
  return out;
}

function toggleCase(text: string) {
  let out = "";
  for (const ch of Array.from(text)) {
    if (!/\p{L}/u.test(ch)) out += ch;
    else out += ch === ch.toLocaleUpperCase() ? ch.toLocaleLowerCase() : ch.toLocaleUpperCase();
  }
  return out;
}

function alternatingCase(text: string) {
  let out = "";
  let flip = false;
  for (const ch of Array.from(text)) {
    if (!/\p{L}/u.test(ch)) {
      out += ch;
      continue;
    }
    out += flip ? ch.toLocaleUpperCase() : ch.toLocaleLowerCase();
    flip = !flip;
  }
  return out;
}

function toCamelCase(text: string) {
  const words = splitWords(text);
  if (!words.length) return "";
  const first = words[0].toLocaleLowerCase();
  const rest = words
    .slice(1)
    .map((w) => {
      const chars = Array.from(w.toLocaleLowerCase());
      if (!chars.length) return "";
      chars[0] = chars[0].toLocaleUpperCase();
      return chars.join("");
    })
    .join("");
  return first + rest;
}

function toPascalCase(text: string) {
  return splitWords(text)
    .map((w) => {
      const chars = Array.from(w.toLocaleLowerCase());
      if (!chars.length) return "";
      chars[0] = chars[0].toLocaleUpperCase();
      return chars.join("");
    })
    .join("");
}

function toDelimited(text: string, d: string) {
  return splitWords(text).map((w) => w.toLocaleLowerCase()).join(d);
}

function toSpaceCase(text: string) {
  return splitWords(text).join(" ");
}

function computeOutput(text: string, preserve: boolean, active: ActionKey) {
  const input = text ?? "";

  if (active === "upper")
    return preserve ? preserveWordTransform(input, (w) => w.toLocaleUpperCase()) : input.trim().toLocaleUpperCase();

  if (active === "lower")
    return preserve ? preserveWordTransform(input, (w) => w.toLocaleLowerCase()) : input.trim().toLocaleLowerCase();

  if (active === "title") return preserve ? toTitleCase(input) : toTitleCase(input.trim());
  if (active === "sentence") return preserve ? toSentenceCase(input) : toSentenceCase(input.trim());
  if (active === "toggle") return preserve ? toggleCase(input) : toggleCase(input.trim());
  if (active === "alternating") return preserve ? alternatingCase(input) : alternatingCase(input.trim());

  if (active === "camel") return toCamelCase(input);
  if (active === "pascal") return toPascalCase(input);
  if (active === "snake") return toDelimited(input, "_");
  if (active === "kebab") return toDelimited(input, "-");
  if (active === "dot") return toDelimited(input, ".");
  if (active === "space") return toSpaceCase(input);

  return input;
}

function runSelfTests() {
  const assert = (name: string, cond: boolean) => console.assert(cond, `Test failed: ${name}`);

  assert("upper preserves punctuation", computeOutput("Hi, Bob!", true, "upper") === "HI, BOB!");
  assert("lower trims when preserve=false", computeOutput("  Hi  ", false, "lower") === "hi");
  assert("title basic", computeOutput("hello world", true, "title") === "Hello World");
  assert(
    "sentence casing respects punctuation",
    computeOutput("HELLO. HOW ARE YOU?\nOK!", true, "sentence") === "Hello. How are you?\nOk!"
  );
  assert("toggle", computeOutput("AbC", true, "toggle") === "aBc");
  assert("alternating ignores spaces", computeOutput("ab cd", true, "alternating") === "aB cD");
  assert("camel", computeOutput("hello world", true, "camel") === "helloWorld");
  assert("pascal", computeOutput("hello world", true, "pascal") === "HelloWorld");
  assert("snake", computeOutput("Hello, world!", true, "snake") === "hello_world");
  assert("kebab", computeOutput("Hello, world!", true, "kebab") === "hello-world");
  assert("dot", computeOutput("Hello, world!", true, "dot") === "hello.world");
  assert("space", computeOutput("Hello, world!", true, "space") === "Hello world");
}

async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const t = UI[lang];

  const [input, setInput] = useState("");
  const [preserve, setPreserve] = useState(true);
  const [active, setActive] = useState<ActionKey>("upper");

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const output = useMemo(() => computeOutput(input, preserve, active), [input, preserve, active]);
  const outputRef = useRef<HTMLDivElement | null>(null);

  const buttonGhost =
    "text-xs text-zinc-300 hover:text-white rounded-lg px-2 py-1 border border-white/10 hover:border-white/20 transition-all duration-200 hover:bg-white/5";

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1400);
  };

  const selectOutputText = () => {
    const el = outputRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.addRange(range);
  };

  const onCopy = async () => {
    const text = output;
    if (!text.trim()) {
      showToast(t.toast.empty);
      return;
    }
    const ok = await safeCopyToClipboard(text);
    if (ok) {
      showToast(t.toast.copied);
      return;
    }
    selectOutputText();
    showToast(t.toast.copyFailed);
  };

  useEffect(() => {
    try {
      // @ts-expect-error allow environments without import.meta
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) runSelfTests();
    } catch {}

    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-y-auto lg:overflow-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-24 right-10 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl border border-white/10 bg-zinc-950/70 backdrop-blur px-3 py-2 text-xs text-zinc-200 shadow-lg">
          {toast}
        </div>
      )}

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 md:py-8 flex flex-col flex-1 min-h-0">
        <header className="mb-4 md:mb-6 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              {t.badge}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLang("en")} className={buttonGhost + (lang === "en" ? " border-white text-white" : "")}>
                {t.lang.en}
              </button>
              <button type="button" onClick={() => setLang("ru")} className={buttonGhost + (lang === "ru" ? " border-white text-white" : "")}>
                {t.lang.ru}
              </button>
            </div>
          </div>

          <h1 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
            {t.subtitle}
          </p>
        </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0 lg:grid-rows-[1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <div className="text-sm font-semibold">{t.input}</div>
                <button type="button" onClick={() => setInput("")} className={buttonGhost}>
                  {t.clear}
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className="mt-4 w-full flex-1 min-h-0 resize-none rounded-xl bg-zinc-950/60 border border-white/10 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-white/20"
              />

              <label className="mt-3 flex items-center gap-2 text-sm text-zinc-400 shrink-0">
                <input
                  type="checkbox"
                  checked={preserve}
                  onChange={(e) => setPreserve(e.target.checked)}
                  className="h-4 w-4 shrink-0 appearance-none rounded border border-white/20 bg-zinc-950/60 checked:bg-white checked:border-white cursor-pointer relative after:content-[''] after:absolute after:hidden after:left-[4.5px] after:top-[1px] after:w-[5px] after:h-[9px] after:border-r-2 after:border-b-2 after:border-zinc-950 after:rotate-45 checked:after:block"
                />
                {t.preserve}
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <div className="text-sm font-semibold">{t.output}</div>
                <button type="button" onClick={onCopy} className={buttonGhost} disabled={!output.trim()}>
                  {t.copy}
                </button>
              </div>

              <div
                ref={outputRef}
                className="mt-4 rounded-2xl border border-white/10 bg-zinc-950/50 p-3 text-sm whitespace-pre-wrap break-words flex-1 min-h-0 overflow-y-auto select-text"
              >
                {output || <span className="text-zinc-500">{t.empty}</span>}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 shrink-0">
                {Object.entries(t.actions).map(([key, label]) => {
                  const k = key as ActionKey;
                  const isActive = active === k;
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => setActive(k)}
                      className={
                        "rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all truncate " +
                        (isActive
                          ? "bg-white text-zinc-950 border-white"
                          : "bg-zinc-950/40 text-zinc-100 border-white/10 hover:border-white/20")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
