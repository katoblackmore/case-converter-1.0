import React, { useEffect, useMemo, useRef, useState } from "react";
import CaseConverter from "./CaseConverter";

type FormData = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  companyName: string;
  officePhone: string;
  mobilePhone: string;
  websiteUrl: string;
  emailAddress: string;
  address: string;
  logoUrl: string;
  logoDataUrl: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  whatsapp: string;
  legal: string;
};

const DEFAULTS: FormData = {
  firstName: "",
  lastName: "",
  jobTitle: "",
  department: "",
  companyName: "",
  officePhone: "",
  mobilePhone: "",
  websiteUrl: "",
  emailAddress: "",
  address: "",
  logoUrl: "",
  logoDataUrl: "",
  linkedin: "",
  facebook: "",
  twitter: "",
  instagram: "",
  whatsapp: "",
  legal: "",
};

const DEMO_DATA: FormData = {
  firstName: "Alex",
  lastName: "Johnson",
  jobTitle: "Senior Product Designer",
  department: "Fintech & Payments",
  companyName: "Acme Payments Inc.",
  officePhone: "+1 212 555 0199",
  mobilePhone: "+1 917 555 0421",
  websiteUrl: "acmepayments.com",
  emailAddress: "alex.johnson@acmepayments.com",
  address: "350 Fifth Avenue, New York, NY, USA",
  logoUrl: "",
  logoDataUrl: "",
  linkedin: "https://linkedin.com/in/alexjohnson",
  facebook: "https://facebook.com/alex.johnson",
  twitter: "https://x.com/alexjohnson",
  instagram: "https://instagram.com/alexjohnson",
  whatsapp: "https://wa.me/19175550421",
  legal:
    "This email and any attachments are confidential and intended solely for the addressee. If you have received this message in error, please notify the sender and delete it immediately.",
};

function iconDataUri(svg: string) {
  const encoded = encodeURIComponent(svg).replace(/%0A/g, "").replace(/%20/g, " ");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function makeSocialIcons(stroke: string) {
  const mk = (txt: string, size = 9) =>
    iconDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <rect x="2.5" y="2.5" width="19" height="19" rx="6" fill="none" stroke="${stroke}" stroke-width="1.5"/>
  <text x="12" y="14.1" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" fill="${stroke}">${txt}</text>
</svg>`);

  return {
    linkedin: mk("in"),
    facebook: mk("f"),
    twitter: mk("X"),
    instagram: mk("ig"),
    whatsapp: mk("wa", 8.5),
  } as const;
}

const SOCIAL_LIGHT = makeSocialIcons("#6b7280");
const SOCIAL_DARK = makeSocialIcons("#cbd5e1");

const DEMO_LOGO = iconDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect x="6" y="6" width="84" height="84" rx="18" fill="none" stroke="#111827" stroke-width="3"/>
  <path d="M28 60V34h12c7 0 12 4 12 13s-5 13-12 13H28Zm8-7h4c4 0 6-2 6-6s-2-6-6-6h-4v12Z" fill="#111827"/>
  <path d="M56 60V34h8v19h10v7H56Z" fill="#111827"/>
</svg>`);

function normalizeUrl(raw: string) {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^(mailto:|tel:|https?:\/\/)/i.test(v)) return v;
  return `https://${v}`;
}

function escapeHtml(str: string) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type BuildOpts = { theme?: "light" | "dark" };

function buildSignatureHTML(data: FormData, opts: BuildOpts = {}) {
  const theme = opts.theme === "dark" ? "dark" : "light";
  const SOCIAL = theme === "dark" ? SOCIAL_DARK : SOCIAL_LIGHT;

  const font = "Arial, Helvetica, sans-serif";
  const black = theme === "dark" ? "#f8fafc" : "#111827";
  const gray600 = theme === "dark" ? "#e5e7eb" : "#4b5563";
  const gray500 = theme === "dark" ? "#cbd5e1" : "#6b7280";
  const gray400 = theme === "dark" ? "#94a3b8" : "#9ca3af";

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
  const jobLine = [data.jobTitle, data.department].filter(Boolean).join(" • ").trim();

  const company = String(data.companyName || "").trim();
  const officePhone = String(data.officePhone || "").trim();
  const mobilePhone = String(data.mobilePhone || "").trim();
  const email = String(data.emailAddress || "").trim();
  const websiteUrl = String(data.websiteUrl || "").trim();
  const address = String(data.address || "").trim();

  const logoSrc =
    String(data.logoDataUrl || "").trim() ||
    (String(data.logoUrl || "").trim() ? normalizeUrl(data.logoUrl) : "");
  const website = websiteUrl ? normalizeUrl(websiteUrl) : "";

  const socials = [
    { key: "linkedin", label: "LinkedIn", url: normalizeUrl(data.linkedin) },
    { key: "facebook", label: "Facebook", url: normalizeUrl(data.facebook) },
    { key: "twitter", label: "X", url: normalizeUrl(data.twitter) },
    { key: "instagram", label: "Instagram", url: normalizeUrl(data.instagram) },
    { key: "whatsapp", label: "WhatsApp", url: normalizeUrl(data.whatsapp) },
  ].filter((s) => !!s.url);

  const baseTd = `font-family:${font}; text-align:left; mso-line-height-rule:exactly; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;`;

  const row = (html: string) => {
    if (!html) return "";
    return `
<tr>
  <td style="padding:2px 0; ${baseTd} font-size:14px; line-height:18px; color:${gray600};">${html}</td>
</tr>`;
  };

  const officeHtml = officePhone
    ? `<span style="color:${gray500};">Office:</span> <a href="tel:${escapeHtml(officePhone)}" style="color:${gray600}; text-decoration:none;">${escapeHtml(officePhone)}</a>`
    : "";

  const mobileHtml = mobilePhone
    ? `<span style="color:${gray500};">Mobile:</span> <a href="tel:${escapeHtml(mobilePhone)}" style="color:${gray600}; text-decoration:none;">${escapeHtml(mobilePhone)}</a>`
    : "";

  const emailHtml = email
    ? `<a href="mailto:${escapeHtml(email)}" style="color:${gray600}; text-decoration:none;">${escapeHtml(email)}</a>`
    : "";

  const webHtml = website
    ? `<a href="${escapeHtml(website)}" style="color:${gray600}; text-decoration:none;">${escapeHtml(
        website.replace(/^https?:\/\//i, "")
      )}</a>`
    : "";

  const addressHtml = address ? `<span style="color:${gray600};">${escapeHtml(address)}</span>` : "";

  const legal = String(data.legal || "").trim();

  const socialsRow =
    socials.length > 0
      ? `
<tr>
  <td style="padding-top:10px; ${baseTd}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; ${baseTd}">
      <tr>
        ${socials
          .map(
            (s) =>
              `<td style="padding-right:8px;"><a href="${escapeHtml(
                s.url
              )}" style="text-decoration:none;" target="_blank" rel="noopener noreferrer"><img src="${SOCIAL[
                s.key as keyof typeof SOCIAL
              ]}" width="24" height="24" style="display:block; border:0; outline:none; text-decoration:none;" alt="${escapeHtml(
                s.label
              )}" /></a></td>`
          )
          .join("")}
      </tr>
    </table>
  </td>
</tr>`
      : "";

  const headerBlock = logoSrc
    ? `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; ${baseTd}">
  <tr>
    <td style="vertical-align:top; padding-right:12px;">
      <img src="${escapeHtml(logoSrc)}" width="48" height="48" style="display:block; border:0; outline:none; text-decoration:none; border-radius:10px;" alt="" />
    </td>
    <td style="vertical-align:top; ${baseTd}">
      ${
        fullName
          ? `<div style="${baseTd} font-size:18px; line-height:22px; font-weight:700; color:${black};">${escapeHtml(
              fullName
            )}</div>`
          : ""
      }
      ${
        jobLine
          ? `<div style="${baseTd} padding-top:2px; font-size:14px; line-height:18px; color:${gray600};">${escapeHtml(
              jobLine
            )}</div>`
          : ""
      }
      ${
        company
          ? `<div style="${baseTd} padding-top:2px; font-size:14px; line-height:18px; color:${gray400};">${escapeHtml(
              company
            )}</div>`
          : ""
      }
    </td>
  </tr>
</table>`
    : `
${
  fullName
    ? `<div style="${baseTd} font-size:18px; line-height:22px; font-weight:700; color:${black};">${escapeHtml(
        fullName
      )}</div>`
    : ""
}
${
  jobLine
    ? `<div style="${baseTd} padding-top:2px; font-size:14px; line-height:18px; color:${gray600};">${escapeHtml(
        jobLine
      )}</div>`
    : ""
}
${
  company
    ? `<div style="${baseTd} padding-top:2px; font-size:14px; line-height:18px; color:${gray400};">${escapeHtml(
        company
      )}</div>`
    : ""
}`;

  const html = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; ${baseTd}">
  <tr>
    <td style="padding:0; ${baseTd}">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; ${baseTd}">
        <tr>
          <td style="padding:0; ${baseTd}">${headerBlock}</td>
        </tr>

        <tr>
          <td style="padding-top:10px; ${baseTd}">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; ${baseTd}">
              ${row(officeHtml)}
              ${row(mobileHtml)}
              ${row(emailHtml)}
              ${row(webHtml)}
              ${row(addressHtml)}
            </table>
          </td>
        </tr>

        ${socialsRow}

        ${
          legal
            ? `
<tr>
  <td style="padding-top:12px; ${baseTd} font-size:11px; line-height:15px; color:${gray400}; max-width:420px;">${escapeHtml(
                legal
              ).replace(/\n/g, "<br/>")}</td>
</tr>`
            : ""
        }
      </table>
    </td>
  </tr>
</table>
`.trim();

  return html;
}

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm font-semibold text-zinc-100">{children}</div>
      {right}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  inputMode,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-xs text-zinc-400 mb-2">
        {label}
        {required ? <span className="text-zinc-500"> *</span> : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={!!error}
        className={`w-full rounded-xl bg-zinc-950/60 border px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-2 transition-all duration-200 hover:border-white/25 hover:bg-zinc-950/70 ${
          error ? "border-red-400/60 focus:ring-red-400/20" : "border-white/10 focus:ring-white/20"
        }`}
      />
      {error ? <div className="mt-1 text-[11px] text-red-300">{error}</div> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-zinc-400 mb-2">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl bg-zinc-950/60 border border-white/10 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 hover:border-white/25 hover:bg-zinc-950/70"
      />
    </label>
  );
}

function isEmail(v: string) {
  const s = String(v || "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

function isPhone(v: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  return /^[+()\-\s\d]{6,}$/.test(s);
}

function isUrlOrDomain(v: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(normalizeUrl(s));
    return true;
  } catch {
    return false;
  }
}

export default function App() {
  const logoFileRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<"signature" | "case">("signature");
  const [caseLang, setCaseLang] = useState<"en" | "ru">("ru");

  const [data, setData] = useState<FormData>(DEFAULTS);
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showErrors, setShowErrors] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const toast = (msg: string) => setToastMsg(msg);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(""), 1800);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    const req2 = (v: string, label: string) => {
      const s = String(v || "").trim();
      if (!s) return `${label} is required`;
      if (s.length < 2) return "Enter at least 2 characters";
      return "";
    };

    e.firstName = req2(data.firstName, "First Name");
    e.lastName = req2(data.lastName, "Last Name");
    e.jobTitle = req2(data.jobTitle, "Job Title");
    e.companyName = req2(data.companyName, "Company Name");

    const em = String(data.emailAddress || "").trim();
    e.emailAddress = !em ? "Email Address is required" : isEmail(em) ? "" : "Enter a valid email";

    const dep = String(data.department || "").trim();
    e.department = dep && dep.length < 2 ? "Enter at least 2 characters" : "";

    const addr = String(data.address || "").trim();
    e.address = addr && addr.length < 4 ? "Enter at least 4 characters" : "";

    e.officePhone = isPhone(data.officePhone) ? "" : "Enter a valid phone number";
    e.mobilePhone = isPhone(data.mobilePhone) ? "" : "Enter a valid phone number";

    e.websiteUrl = isUrlOrDomain(data.websiteUrl) ? "" : "Enter a valid URL";
    e.logoUrl = isUrlOrDomain(data.logoUrl) ? "" : "Enter a valid URL";

    e.linkedin = isUrlOrDomain(data.linkedin) ? "" : "Enter a valid URL";
    e.facebook = isUrlOrDomain(data.facebook) ? "" : "Enter a valid URL";
    e.twitter = isUrlOrDomain(data.twitter) ? "" : "Enter a valid URL";
    e.instagram = isUrlOrDomain(data.instagram) ? "" : "Enter a valid URL";
    e.whatsapp = isUrlOrDomain(data.whatsapp) ? "" : "Enter a valid URL";

    return e;
  }, [data]);

  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  const requiredFields = useMemo(
    () => new Set(["firstName", "lastName", "jobTitle", "companyName", "emailAddress"]),
    []
  );

  const getError = (name: keyof FormData | string) => {
    const v = String((data as any)[name] || "").trim();
    const shouldShow = showErrors || touched[name];
    if (!shouldShow) return "";
    if (!requiredFields.has(name) && !v) return "";
    return errors[name] || "";
  };

  const markTouched = (name: keyof FormData | string) => setTouched((t) => ({ ...t, [name]: true }));

  const signatureHtml = useMemo(
    () => buildSignatureHTML(data, { theme: previewTheme }),
    [data, previewTheme]
  );

  const previewDoc = useMemo(() => {
    const bg = previewTheme === "dark" ? "#0b0b0f" : "#ffffff";
    return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;padding:16px;background:${bg};">${signatureHtml}</body></html>`;
  }, [signatureHtml, previewTheme]);

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

  const buttonGhost =
    "text-xs text-zinc-300 hover:text-white rounded-lg px-2 py-1 border border-white/10 hover:border-white/20 transition-all duration-200 hover:bg-white/5";

  function clearAll() {
    setData(DEFAULTS);
    setTouched({});
    setShowErrors(false);
    toast("Cleared");
  }

  function fillDemo() {
    setData({ ...DEMO_DATA, logoUrl: "", logoDataUrl: DEMO_LOGO });
    setTouched({});
    setShowErrors(false);
    toast("Demo data filled");
  }

  function onPickLogo() {
    logoFileRef.current?.click();
  }

  function onLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setData((s) => ({ ...s, logoDataUrl: result, logoUrl: "" }));
      toast("Logo added");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function copyHtml() {
    setShowErrors(true);
    if (hasErrors) {
      toast("Fix validation errors");
      return;
    }

    try {
      await navigator.clipboard.writeText(signatureHtml);
      toast("HTML copied");
      return;
    } catch {
      // ignore
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = signatureHtml;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("HTML copied");
    } catch {
      toast("Copy failed — your browser blocked clipboard");
    }
  }

  async function copyRich() {
    setShowErrors(true);
    if (hasErrors) {
      toast("Fix validation errors");
      return;
    }

    try {
      const container = document.createElement("div");
      container.setAttribute("contenteditable", "true");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.opacity = "0";
      container.innerHTML = signatureHtml;
      document.body.appendChild(container);

      const range = document.createRange();
      range.selectNodeContents(container);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      const ok = document.execCommand("copy");

      sel?.removeAllRanges();
      document.body.removeChild(container);

      if (ok) {
        toast("Signature copied");
        return;
      }
    } catch {
      // ignore
    }

    try {
      const AnyClipboardItem = (globalThis as any).ClipboardItem as
        | (new (items: Record<string, Blob>) => ClipboardItem)
        | undefined;

      if (AnyClipboardItem && navigator.clipboard?.write) {
        const item = new AnyClipboardItem({
          "text/html": new Blob([signatureHtml], { type: "text/html" }),
          "text/plain": new Blob([signatureHtml], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
        toast("Signature copied");
        return;
      }
    } catch {
      // ignore
    }

    await copyHtml();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-24 right-10 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:py-10">
        <header className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              {view === "signature" ? "Gmail • Outlook • Apple Mail friendly" : "Local utility • No server calls"}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setView("signature")} className={buttonGhost}>
                Signature
              </button>
              <button type="button" onClick={() => setView("case")} className={buttonGhost}>
                Case
              </button>
              {view === "case" && (
                <>
                  <button type="button" onClick={() => setCaseLang("en")} className={buttonGhost}>
                    EN
                  </button>
                  <button type="button" onClick={() => setCaseLang("ru")} className={buttonGhost}>
                    RU
                  </button>
                </>
              )}
            </div>
          </div>

          <h1 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">
            {view === "signature"
              ? "Email signature generator"
              : caseLang === "ru"
                ? "Конвертер регистров"
                : "Case converter"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
            {view === "signature"
              ? "Fill the form, preview instantly, then copy the signature."
              : caseLang === "ru"
                ? "Вставь текст слева. Выбери формат справа."
                : "Paste text on the left. Pick a format on the right."}
          </p>
        </header>

        {view === "case" ? (
          <CaseConverter toast={toast} lang={caseLang} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            <SectionTitle
              right={
                <div className="flex items-center gap-2 ml-auto justify-end">
                  <button onClick={clearAll} className={buttonGhost} type="button">
                    Clear all
                  </button>
                  <button onClick={fillDemo} className={buttonGhost} type="button">
                    Fill demo
                  </button>
                </div>
              }
            >
              Details
            </SectionTitle>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="First Name"
                required
                value={data.firstName}
                onChange={(v) => setData((s) => ({ ...s, firstName: v }))}
                onBlur={() => markTouched("firstName")}
                placeholder="John"
                error={getError("firstName")}
              />
              <Field
                label="Last Name"
                required
                value={data.lastName}
                onChange={(v) => setData((s) => ({ ...s, lastName: v }))}
                onBlur={() => markTouched("lastName")}
                placeholder="Doe"
                error={getError("lastName")}
              />
              <Field
                label="Job Title"
                required
                value={data.jobTitle}
                onChange={(v) => setData((s) => ({ ...s, jobTitle: v }))}
                onBlur={() => markTouched("jobTitle")}
                placeholder="Product Designer"
                error={getError("jobTitle")}
              />
              <Field
                label="Department"
                value={data.department}
                onChange={(v) => setData((s) => ({ ...s, department: v }))}
                onBlur={() => markTouched("department")}
                placeholder="Payments"
                error={getError("department")}
              />
              <Field
                label="Company Name"
                required
                value={data.companyName}
                onChange={(v) => setData((s) => ({ ...s, companyName: v }))}
                onBlur={() => markTouched("companyName")}
                placeholder="Your Company"
                error={getError("companyName")}
              />
              <Field
                label="Office Phone Number"
                value={data.officePhone}
                onChange={(v) => setData((s) => ({ ...s, officePhone: v }))}
                onBlur={() => markTouched("officePhone")}
                placeholder="+1 555 000 000"
                inputMode="tel"
                error={getError("officePhone")}
              />
              <Field
                label="Mobile Phone Number"
                value={data.mobilePhone}
                onChange={(v) => setData((s) => ({ ...s, mobilePhone: v }))}
                onBlur={() => markTouched("mobilePhone")}
                placeholder="+1 555 111 111"
                inputMode="tel"
                error={getError("mobilePhone")}
              />
              <Field
                label="Website URL"
                value={data.websiteUrl}
                onChange={(v) => setData((s) => ({ ...s, websiteUrl: v }))}
                onBlur={() => markTouched("websiteUrl")}
                placeholder="example.com"
                inputMode="url"
                error={getError("websiteUrl")}
              />
              <Field
                label="Email Address"
                required
                value={data.emailAddress}
                onChange={(v) => setData((s) => ({ ...s, emailAddress: v }))}
                onBlur={() => markTouched("emailAddress")}
                placeholder="name@company.com"
                inputMode="email"
                type="email"
                error={getError("emailAddress")}
              />
              <div className="md:col-span-2">
                <Field
                  label="Address"
                  value={data.address}
                  onChange={(v) => setData((s) => ({ ...s, address: v }))}
                  onBlur={() => markTouched("address")}
                  placeholder="Street, City, Country"
                  error={getError("address")}
                />
              </div>
            </div>

            <div className="mt-6">
              <SectionTitle>Company Logo</SectionTitle>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Logo URL"
                  value={data.logoUrl}
                  onChange={(v) => setData((s) => ({ ...s, logoUrl: v, logoDataUrl: "" }))}
                  onBlur={() => markTouched("logoUrl")}
                  placeholder="https://example.com/logo.png"
                  inputMode="url"
                  error={getError("logoUrl")}
                />
                <div className="block">
                  <div className="text-xs text-zinc-400 mb-2">Upload logo</div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={onPickLogo} className={`${buttonGhost} px-3 py-2`}>
                      Choose file
                    </button>
                    <div className="text-xs text-zinc-500 truncate">{data.logoDataUrl ? "Selected" : "Optional"}</div>
                  </div>
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    onChange={onLogoFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Tip: hosted HTTPS logos are most compatible with Outlook. Uploaded logos use a data URL for preview and HTML.
              </div>
            </div>

            <div className="mt-6">
              <SectionTitle>Enter Your Social Links</SectionTitle>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="LinkedIn"
                  value={data.linkedin}
                  onChange={(v) => setData((s) => ({ ...s, linkedin: v }))}
                  onBlur={() => markTouched("linkedin")}
                  placeholder="linkedin.com/in/username"
                  inputMode="url"
                  error={getError("linkedin")}
                />
                <Field
                  label="Facebook"
                  value={data.facebook}
                  onChange={(v) => setData((s) => ({ ...s, facebook: v }))}
                  onBlur={() => markTouched("facebook")}
                  placeholder="facebook.com/username"
                  inputMode="url"
                  error={getError("facebook")}
                />
                <Field
                  label="X / Twitter"
                  value={data.twitter}
                  onChange={(v) => setData((s) => ({ ...s, twitter: v }))}
                  onBlur={() => markTouched("twitter")}
                  placeholder="x.com/username"
                  inputMode="url"
                  error={getError("twitter")}
                />
                <Field
                  label="Instagram"
                  value={data.instagram}
                  onChange={(v) => setData((s) => ({ ...s, instagram: v }))}
                  onBlur={() => markTouched("instagram")}
                  placeholder="instagram.com/username"
                  inputMode="url"
                  error={getError("instagram")}
                />
                <Field
                  label="WhatsApp"
                  value={data.whatsapp}
                  onChange={(v) => setData((s) => ({ ...s, whatsapp: v }))}
                  onBlur={() => markTouched("whatsapp")}
                  placeholder="wa.me/XXXXXXXXX"
                  inputMode="url"
                  error={getError("whatsapp")}
                />
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                Tip: you can paste full links or just domains — the generator will add https:// when needed.
              </div>
            </div>

            <div className="mt-6">
              <SectionTitle>Legal</SectionTitle>
              <div className="mt-3">
                <TextArea
                  label="Legal Content"
                  value={data.legal}
                  onChange={(v) => setData((s) => ({ ...s, legal: v }))}
                  onBlur={() => markTouched("legal")}
                  placeholder="Confidentiality notice, disclaimer, etc."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={copyRich}
                className="inline-flex items-center justify-center rounded-xl bg-white text-zinc-950 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-all duration-200"
              >
                Copy (rich)
              </button>
              <button
                type="button"
                onClick={copyHtml}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-100 hover:border-white/25 hover:bg-white/5 transition-all duration-200"
              >
                Copy HTML
              </button>
              <div className="sm:ml-auto text-xs text-zinc-500 flex items-center">
                {fullName ? `Previewing: ${fullName}` : "Fill fields to preview"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            <SectionTitle
              right={
                <div className="flex items-center gap-3 ml-auto justify-end">
                  <div className="text-xs text-zinc-400">Live preview</div>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme((t) => (t === "dark" ? "light" : "dark"))}
                    className={`${buttonGhost} inline-flex items-center gap-2`}
                    aria-label="Toggle preview theme"
                  >
                    <span className="text-zinc-400">Theme</span>
                    <span
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                        previewTheme === "dark" ? "bg-white/25" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          previewTheme === "dark" ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              }
            >
              Signature live preview
            </SectionTitle>

            <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
              <iframe title="preview" className="w-full h-[420px] bg-transparent" srcDoc={previewDoc} />
            </div>

            <div className="mt-4">
              <SectionTitle right={<button type="button" onClick={copyHtml} className={buttonGhost}>Copy</button>}>
                Generated HTML
              </SectionTitle>
              <pre className="mt-3 max-h-56 overflow-auto rounded-2xl border border-white/10 bg-zinc-950/50 p-3 text-[11px] leading-4 text-zinc-200 whitespace-pre-wrap break-words">
                {signatureHtml}
              </pre>
            </div>
          </div>
          </div>
        )}

        {toastMsg ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-2 text-sm text-zinc-100 shadow-lg">
            {toastMsg}
          </div>
        ) : null}
      </div>
    </div>
  );
}
