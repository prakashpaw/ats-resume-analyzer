/**
 * MiniPDF — zero-dependency PDF generator
 * Produces a valid single or multi-page A4 PDF using raw PDF syntax.
 * Supports: text, font styles (normal/bold/italic), colour, lines, rects.
 */
(function (global) {
  'use strict';

  // ── A4 dimensions in points (72 pt = 1 inch) ─────────────────────────────
  const A4W = 595.28, A4H = 841.89;

  // ── PDF string helpers ────────────────────────────────────────────────────
  function esc(s) {
    // Map common Unicode typographic chars → WinAnsiEncoding byte equivalents
    // (Helvetica uses /WinAnsiEncoding, so byte 0x95 = bullet •, 0x97 = em dash — etc.)
    return String(s)
      .replace(/\u2022/g, '\x95')   // bullet •
      .replace(/\u2014/g, '\x97')   // em dash —
      .replace(/\u2013/g, '\x96')   // en dash –
      .replace(/\u2018|\u2019/g, "'") // curly single quotes
      .replace(/\u201C|\u201D/g, '"') // curly double quotes
      .replace(/[^\x20-\xFF]/g, ' ') // strip any remaining non-Latin-1
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  // ── Helvetica widths table (scaled /1000) ─────────────────────────────────
  // Widths for chars 32–126 in Helvetica (standard PDF Type1 font)
  const HV_W = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,
    278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,
    556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,
    667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,
    556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,
    333,500,278,556,500,722,500,500,500,334,260,334,584];

  function charWidth(c, size, bold) {
    const code = c.charCodeAt(0);
    if (code < 32 || code > 126) return size * 278 / 1000;
    const w = HV_W[code - 32] || 556;
    return size * w / 1000 * (bold ? 1.05 : 1);
  }

  function textWidth(str, size, bold) {
    let w = 0;
    for (const c of String(str)) w += charWidth(c, size, bold);
    return w;
  }

  function splitLines(text, maxW, size, bold) {
    const words = String(text).replace(/\r/g, '').split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (textWidth(test, size, bold) <= maxW) {
        line = test;
      } else {
        if (line) lines.push(line);
        // Handle very long single words
        if (textWidth(word, size, bold) > maxW) {
          let chunk = '';
          for (const ch of word) {
            if (textWidth(chunk + ch, size, bold) <= maxW) chunk += ch;
            else { lines.push(chunk); chunk = ch; }
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  // ── MiniPDF class ─────────────────────────────────────────────────────────
  function MiniPDF() {
    this.pages    = [];          // array of page stream strings
    this.curPage  = null;
    this._fontSize  = 10;
    this._fontStyle = 'normal';  // normal | bold | italic | bolditalic
    this._r = 0; this._g = 0; this._b = 0;  // fill/text colour
    this._lr = 0; this._lg = 0; this._lb = 0; // line colour
    this._lw = 0.5;
    this.addPage();
  }

  MiniPDF.prototype.addPage = function () {
    this.curPage = [];
    this.pages.push(this.curPage);
    this._pushFont();
  };

  MiniPDF.prototype._pushFont = function () {
    const fontName = {
      'normal': 'Helv', 'bold': 'HelvB', 'italic': 'HelvO', 'bolditalic': 'HelvBO'
    }[this._fontStyle] || 'Helv';
    this.curPage.push('/' + fontName + ' ' + this._fontSize + ' Tf');
  };

  MiniPDF.prototype.setFont = function (style) {
    this._fontStyle = style;
    this._pushFont();
  };

  MiniPDF.prototype.setFontSize = function (sz) {
    this._fontSize = sz;
    this._pushFont();
  };

  MiniPDF.prototype.setColor = function (r, g, b) {
    this._r = r / 255; this._g = g / 255; this._b = b / 255;
    // FIX: use the normalised (0-1) values in the PDF stream, not raw 0-255
    this.curPage.push(
      this._r.toFixed(3) + ' ' + this._g.toFixed(3) + ' ' + this._b.toFixed(3) +
      ' rg ' +
      this._r.toFixed(3) + ' ' + this._g.toFixed(3) + ' ' + this._b.toFixed(3) + ' RG'
    );
  };

  MiniPDF.prototype.setLineColor = function (r, g, b) {
    this._lr = r; this._lg = g; this._lb = b;
    this.curPage.push(
      (r/255).toFixed(3) + ' ' + (g/255).toFixed(3) + ' ' + (b/255).toFixed(3) + ' RG'
    );
  };

  MiniPDF.prototype.setLineWidth = function (w) {
    this._lw = w;
    this.curPage.push(w + ' w');
  };

  MiniPDF.prototype.setFillColor = function (r, g, b) {
    this.curPage.push(
      (r/255).toFixed(3) + ' ' + (g/255).toFixed(3) + ' ' + (b/255).toFixed(3) + ' rg'
    );
  };

  // PDF Y is from bottom; we accept top-down Y and flip
  MiniPDF.prototype._py = function (y) { return A4H - y; };

  MiniPDF.prototype.text = function (str, x, y) {
    const py = this._py(y);
    this.curPage.push(
      'BT ' +
      x.toFixed(2) + ' ' + py.toFixed(2) + ' Td ' +
      '(' + esc(str) + ') Tj ' +
      'ET'
    );
  };

  // Draw filled rectangle (top-down coords)
  MiniPDF.prototype.fillRect = function (x, y, w, h, r, g, b) {
    if (r !== undefined) this.setFillColor(r, g, b);
    const py = this._py(y + h);
    this.curPage.push(x.toFixed(2) + ' ' + py.toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2) + ' re f');
  };

  // Draw horizontal line
  MiniPDF.prototype.hline = function (x1, y, x2) {
    const py = this._py(y);
    this.curPage.push(x1.toFixed(2) + ' ' + py.toFixed(2) + ' m ' + x2.toFixed(2) + ' ' + py.toFixed(2) + ' l S');
  };

  MiniPDF.prototype.getTextWidth = function (str) {
    const bold = this._fontStyle === 'bold' || this._fontStyle === 'bolditalic';
    return textWidth(str, this._fontSize, bold);
  };

  MiniPDF.prototype.splitTextToSize = function (str, maxW) {
    const bold = this._fontStyle === 'bold' || this._fontStyle === 'bolditalic';
    return splitLines(String(str), maxW, this._fontSize, bold);
  };

  // ── PDF binary output ─────────────────────────────────────────────────────
  MiniPDF.prototype.save = function (filename) {
    const str  = this._build();
    // Convert to binary byte array (latin-1 / WinAnsi): charCode & 0xFF
    // This preserves WinAnsi chars 0x80-0x9F (bullet=0x95, em-dash=0x97 etc.)
    // that would otherwise be mangled by UTF-8 Blob encoding.
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xFF;
    const blob  = new Blob([bytes], { type: 'application/pdf' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 2000);
  };

  MiniPDF.prototype._build = function () {
    const parts = [];
    const offsets = [];
    let pos = 0;

    function w(s) { parts.push(s + '\n'); pos += s.length + 1; }

    w('%PDF-1.4');

    // ── Font resources (standard Type1 Helvetica family) ─────────────────
    const fontObjStart = 2; // obj IDs: 2=Helv,3=HelvB,4=HelvO,5=HelvBO
    const fontDefs = [
      { id: 2, name: 'Helv',   base: 'Helvetica' },
      { id: 3, name: 'HelvB',  base: 'Helvetica-Bold' },
      { id: 4, name: 'HelvO',  base: 'Helvetica-Oblique' },
      { id: 5, name: 'HelvBO', base: 'Helvetica-BoldOblique' }
    ];

    const fontMap = {};
    for (const f of fontDefs) {
      offsets[f.id] = pos;
      w(f.id + ' 0 obj');
      w('<< /Type /Font /Subtype /Type1 /BaseFont /' + f.base);
      w('/Encoding /WinAnsiEncoding >>');
      w('endobj');
      fontMap[f.name] = f.id;
    }

    // ── Page content streams ──────────────────────────────────────────────
    const pageContentIds = [];
    const pageContentStart = fontDefs.length + 2; // 6+

    for (let i = 0; i < this.pages.length; i++) {
      const oid = pageContentStart + i;
      pageContentIds.push(oid);
      offsets[oid] = pos;
      const stream = this.pages[i].join('\n');
      w(oid + ' 0 obj');
      w('<< /Length ' + stream.length + ' >>');
      w('stream');
      parts.push(stream + '\n'); pos += stream.length + 1;
      w('endstream');
      w('endobj');
    }

    // ── Page objects ──────────────────────────────────────────────────────
    const pageObjStart = pageContentStart + this.pages.length;
    const pageIds = [];

    for (let i = 0; i < this.pages.length; i++) {
      const oid = pageObjStart + i;
      pageIds.push(oid);
      offsets[oid] = pos;
      w(oid + ' 0 obj');
      w('<< /Type /Page /Parent 1 0 R');
      w('/MediaBox [0 0 ' + A4W + ' ' + A4H + ']');
      w('/Contents ' + pageContentIds[i] + ' 0 R');
      w('/Resources << /Font <<');
      for (const [name, fid] of Object.entries(fontMap)) {
        w('  /' + name + ' ' + fid + ' 0 R');
      }
      w('>> >> >>');
      w('endobj');
    }

    // ── Pages dictionary (obj 1) ──────────────────────────────────────────
    offsets[1] = pos;
    w('1 0 obj');
    w('<< /Type /Pages /Kids [' + pageIds.map(id => id + ' 0 R').join(' ') + ']');
    w('/Count ' + this.pages.length + ' >>');
    w('endobj');

    // ── Catalog (obj 0) ───────────────────────────────────────────────────
    const catalogId = pageObjStart + this.pages.length;
    offsets[catalogId] = pos;
    w(catalogId + ' 0 obj');
    w('<< /Type /Catalog /Pages 1 0 R >>');
    w('endobj');

    // ── Cross-reference table ─────────────────────────────────────────────
    const xrefPos = pos;
    const maxId = catalogId;
    w('xref');
    w('0 ' + (maxId + 1));
    w('0000000000 65535 f ');
    for (let i = 1; i <= maxId; i++) {
      const o = offsets[i] || 0;
      w(String(o).padStart(10, '0') + ' 00000 n ');
    }
    w('trailer');
    w('<< /Size ' + (maxId + 1) + ' /Root ' + catalogId + ' 0 R >>');
    w('startxref');
    w(String(xrefPos));
    w('%%EOF');

    return parts.join('');
  };

  global.MiniPDF = MiniPDF;
  global.MiniPDF.A4W = A4W;
  global.MiniPDF.A4H = A4H;

})(window);
