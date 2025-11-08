// app/components/ReportsClient.tsx
"use client";

import { useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Printer, Download, X } from "lucide-react";

type MonthlyRow = {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

type Txn = {
  date: string | null;
  amount: number | null;
  category: string | null;
  description: string | null;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function monthKeyOf(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}
function parseDateLoose(v: string | null): Date | null {
  if (!v) return null;
  const try1 = new Date(v);
  if (!isNaN(+try1)) return try1;
  const parts = v.split(/[/-]/);
  if (parts.length >= 3) {
    const [a, b, c] = parts.map((p) => parseInt(p, 10));
    const guess =
      v.includes("/") || (a <= 12 && b <= 31)
        ? new Date(c, a - 1, b)
        : new Date(a, b - 1, c);
    if (!isNaN(+guess)) return guess;
  }
  return null;
}

export default function ReportsClient({
  monthly,
  txns,
}: {
  monthly: MonthlyRow[];
  txns: Txn[];
}) {
  const [open, setOpen] = useState(false);
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);
  const [detail, setDetail] = useState<{
    monthKey: string;
    label: string;
    mode: "income" | "expense";
  } | null>(null);

  const currency = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const totalIncome = monthly.reduce((s, r) => s + r.income, 0);
  const totalExpense = monthly.reduce((s, r) => s + r.expense, 0);
  const totalNet = totalIncome - totalExpense;

  const txnsWithKey = useMemo(() => {
    return txns
      .map((t) => {
        const d = parseDateLoose(t.date);
        if (!d || isNaN(+d) || t.amount == null) return null;
        return { ...t, _monthKey: monthKeyOf(d) } as Txn & { _monthKey: string };
      })
      .filter(Boolean) as (Txn & { _monthKey: string })[];
  }, [txns]);

  const detailRows = useMemo(() => {
    if (!detail) return [];
    return txnsWithKey
      .filter((t) => {
        if (t._monthKey !== detail.monthKey || t.amount == null) return false;
        return detail.mode === "income" ? t.amount >= 0 : t.amount < 0;
      })
      .map((t) => ({
        date: t.date!,
        description: t.description || "",
        category: t.category || "",
        amount:
          detail.mode === "income"
            ? Number(t.amount)
            : Math.abs(Number(t.amount || 0)),
      }));
  }, [detail, txnsWithKey]);

  // ===== Main Report Actions =====
  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    const el = document.getElementById("report-root");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = 0;
    let remaining = imgH;

    pdf.addImage(img, "PNG", 0, 0, imgW, imgH);
    remaining -= pageH;
    while (remaining > 0) {
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, -y, imgW, imgH);
      remaining -= pageH;
      y += pageH;
    }
    pdf.save("financial-report.pdf");
    setOpen(false);
  };

  const handleExportExcel = () => {
    const rows = monthly.map((m) => ({
      Month: m.label,
      Income: m.income,
      Expense: m.expense,
      Net: m.net,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const array = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([array], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, "financial-report.xlsx");
    setOpen(false);
  };

  const handleExportWord = () => {
    const html = `
      <!doctype html>
      <html><head><meta charset="utf-8"><title>Report</title></head><body>
      <h2>Financial Report</h2>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr>
        ${monthly
          .map(
            (m) =>
              `<tr><td>${m.label}</td><td>${currency(m.income)}</td><td>${currency(
                m.expense
              )}</td><td>${currency(m.net)}</td></tr>`
          )
          .join("")}
        <tr>
          <td><strong>TOTAL</strong></td>
          <td><strong>${currency(totalIncome)}</strong></td>
          <td><strong>${currency(totalExpense)}</strong></td>
          <td><strong>${currency(totalNet)}</strong></td>
        </tr>
      </table>
      </body></html>
    `;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    downloadBlob(blob, "financial-report.doc");
    setOpen(false);
  };

  // ===== Detail Modal Actions =====
  const detailTitle = detail
    ? `${detail.mode === "income" ? "Income" : "Expenses"} — ${detail.label}`
    : "";

  const printDetail = () => {
    if (!detail) return;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${detailTitle}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; }
            h2 { margin: 0 0 16px 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { padding: 8px 10px; border: 1px solid #ddd; font-size: 12px; }
            thead { background: #f7f7f7; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>${detailTitle}</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Category</th><th class="right">${
                detail.mode === "income" ? "Income" : "Expense"
              }</th></tr>
            </thead>
            <tbody>
              ${detailRows
                .map(
                  (r) => `
                <tr>
                  <td>${r.date}</td>
                  <td>${r.description}</td>
                  <td>${r.category}</td>
                  <td class="right">${currency(r.amount)}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 250);
  };

  const exportDetailPDF = async () => {
    const el = document.getElementById("detail-root");
    if (!el || !detail) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = 0;
    let remaining = imgH;

    pdf.addImage(img, "PNG", 0, 0, imgW, imgH);
    remaining -= pageH;
    while (remaining > 0) {
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, -y, imgW, imgH);
      remaining -= pageH;
      y += pageH;
    }
    pdf.save(
      `${detail.mode === "income" ? "income" : "expenses"}-${detail.label
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`
    );
    setDetailMenuOpen(false);
  };

  const exportDetailExcel = () => {
    if (!detail) return;
    const rows = detailRows.map((r) => ({
      Date: r.date,
      Description: r.description,
      Category: r.category,
      Amount: r.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Details");
    const array = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([array], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(
      blob,
      `${detail.mode === "income" ? "income" : "expenses"}-${detail.label
        .toLowerCase()
        .replace(/\s+/g, "-")}.xlsx`
    );
    setDetailMenuOpen(false);
  };

  const exportDetailWord = () => {
    if (!detail) return;
    const html = `
      <!doctype html>
      <html><head><meta charset="utf-8"><title>${detailTitle}</title></head><body>
      <h2>${detailTitle}</h2>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>Date</th><th>Description</th><th>Category</th><th>${
          detail.mode === "income" ? "Income" : "Expense"
        }</th></tr>
        ${detailRows
          .map(
            (r) =>
              `<tr><td>${r.date}</td><td>${r.description}</td><td>${r.category}</td><td>${currency(
                r.amount
              )}</td></tr>`
          )
          .join("")}
      </table>
      </body></html>
    `;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    downloadBlob(
      blob,
      `${detail.mode === "income" ? "income" : "expenses"}-${detail.label
        .toLowerCase()
        .replace(/\s+/g, "-")}.doc`
    );
    setDetailMenuOpen(false);
  };

  return (
    <div className="px-6 py-6">
      {/* header (excluded by print via CSS below) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
          {open && (
            <div className="absolute right-0 top-10 w-56 bg-white border rounded-md shadow-lg z-10">
              <button
                onClick={handleExportPDF}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Download as PDF
              </button>
              <button
                onClick={handleExportWord}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Download as Word
              </button>
              <button
                onClick={handleExportExcel}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Download as Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* print target */}
      <div id="report-root" className="space-y-6">
        {/* tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 avoid-break">
          <div className="rounded-xl border bg-blue-50 p-4">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Income (12 mo)
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-700">
              {currency(totalIncome)}
            </div>
          </div>
        <div className="rounded-xl border bg-red-50 p-4">
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">
              Expenses (12 mo)
            </div>
            <div className="mt-2 text-2xl font-bold text-red-600">
              {currency(totalExpense)}
            </div>
          </div>
          <div className="rounded-xl border bg-green-50 p-4">
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Net (12 mo)
            </div>
            <div className="mt-2 text-2xl font-bold text-green-700">
              {currency(totalNet)}
            </div>
          </div>
        </div>

        {/* monthly table */}
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b avoid-break">
            <h2 className="font-semibold">Monthly Summary (last 12 months)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr className="text-left">
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3 text-blue-700">Income</th>
                  <th className="px-4 py-3 text-red-700">Expense</th>
                  <th className="px-4 py-3 text-green-700">Net</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m, i) => (
                  <tr key={m.monthKey} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 font-medium">{m.label}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setDetail({ monthKey: m.monthKey, label: m.label, mode: "income" })
                        }
                        className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
                      >
                        {currency(m.income)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setDetail({ monthKey: m.monthKey, label: m.label, mode: "expense" })
                        }
                        className="text-red-600 underline underline-offset-2 hover:text-red-700"
                      >
                        {currency(m.expense)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-green-700">{currency(m.net)}</td>
                  </tr>
                ))}
                <tr className="bg-white border-t">
                  <td className="px-4 py-3 font-bold">TOTAL</td>
                  <td className="px-4 py-3 font-bold text-blue-700">
                    {currency(totalIncome)}
                  </td>
                  <td className="px-4 py-3 font-bold text-red-600">
                    {currency(totalExpense)}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-700">
                    {currency(totalNet)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold">
                {detail.mode === "income" ? "Income" : "Expenses"} — {detail.label}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={printDetail}
                  className="hidden md:flex items-center px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
                  title="Print details"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
                <div className="relative">
                  <button
                    onClick={() => setDetailMenuOpen((v) => !v)}
                    className="hidden md:flex items-center px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    title="Download details"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  {detailMenuOpen && (
                    <div className="absolute right-0 top-10 w-56 bg-white border rounded-md shadow-lg z-10">
                      <button
                        onClick={exportDetailPDF}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Download as PDF
                      </button>
                      <button
                        onClick={exportDetailWord}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Download as Word
                      </button>
                      <button
                        onClick={exportDetailExcel}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Download as Excel
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setDetail(null);
                    setDetailMenuOpen(false);
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div id="detail-root" className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="px-4 py-2 w-28">Date</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2 text-right">
                      {detail.mode === "income" ? "Income" : "Expense"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    detailRows.map((r, idx) => (
                      <tr key={idx} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-4 py-2">{r.date}</td>
                        <td className="px-4 py-2">{r.description}</td>
                        <td className="px-4 py-2">{r.category}</td>
                        <td className="px-4 py-2 text-right">{currency(r.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button
                onClick={printDetail}
                className="md:hidden px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                Print
              </button>
              <button
                onClick={() => setDetailMenuOpen((v) => !v)}
                className="md:hidden px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setDetail(null);
                  setDetailMenuOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STRONG print styles to isolate the report area */}
      <style jsx global>{`
        @media print {
          html, body { background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          /* Hide EVERYTHING by default… */
          body * { visibility: hidden !important; }

          /* …except the report root */
          #report-root, #report-root * { visibility: visible !important; }

          /* Make the report fill the page */
          #report-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 12mm !important; /* nice printable margins */
            background: #fff !important;
          }

          /* Avoid breaking tiles/headers across pages */
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }

          /* Hide action bars / menus */
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
