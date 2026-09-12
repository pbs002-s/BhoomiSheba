/**
 * High-fidelity, isolated printing utility for official Bangladesh Land documents (দাখিলা, অনাপত্তি সনদ).
 * Uses a detached iframe to avoid modal clipping, scroll lock, dark theme, or Chromium print preview bugs.
 */

export function printDocument(elementId: string, title = 'Document') {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  // Clone element to avoid touching the live DOM
  const clone = elem.cloneNode(true) as HTMLElement;
  clone.style.margin = '0 auto';
  clone.style.boxShadow = 'none';

  // Create an invisible iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Extract all existing style sheets and link tags from main document
  const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        ${headStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0b0d0c !important;
            font-family: 'Anek Bangla', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
            overflow: visible !important;
          }
          .mono {
            font-family: 'IBM Plex Mono', monospace !important;
          }
          #print-root {
            width: 100% !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 4px !important;
            background: #ffffff !important;
            color: #0b0d0c !important;
          }
          #printable-dakhila,
          #printable-clearance-certificate {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px 20px !important;
            background: #ffffff !important;
            color: #0b0d0c !important;
            border: 1.5px solid #1e3a5f !important;
            border-radius: 4px !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div id="print-root">
          ${clone.outerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Allow styles and webfonts to execute before triggering print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

export function openPrintWindow(elementId: string, title = 'Document') {
  const elem = document.getElementById(elementId);
  if (!elem) return;

  const printWin = window.open('', '_blank', 'width=900,height=800');
  if (!printWin) {
    printDocument(elementId, title);
    return;
  }

  const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        ${headStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 24px;
            background: #f1f5f9;
            color: #0f172a;
            font-family: 'Anek Bangla', 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .action-bar {
            width: 100%;
            max-width: 800px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ffffff;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .doc-container {
            width: 100%;
            max-width: 800px;
            background: #ffffff;
            border: 1.5px solid #1e3a5f;
            border-radius: 4px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          }
          @media print {
            body {
              padding: 0 !important;
              background: #ffffff !important;
            }
            .action-bar {
              display: none !important;
            }
            .doc-container {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
          }
          .btn {
            background: #1e3a5f;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
          }
          .btn:hover {
            background: #162c46;
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <div>
            <strong>${title}</strong>
            <span style="font-size:12px; color:#64748b; margin-left:8px;">A4 Single Page Format</span>
          </div>
          <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>
        <div class="doc-container">
          ${elem.outerHTML}
        </div>
      </body>
    </html>
  `);
  printWin.document.close();
}
