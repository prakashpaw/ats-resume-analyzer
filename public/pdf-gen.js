/**
 * MiniPDF v2 — zero-dependency, binary-safe PDF generator
 * Uses Uint8Array so xref byte offsets are always exact.
 */
(function (global) {
  'use strict';
  var A4W = 595.28, A4H = 841.89;

  function strToBytes(s) {
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xFF;
    return b;
  }

  function concatBytes(arrs) {
    var tot = 0;
    for (var i = 0; i < arrs.length; i++) tot += arrs[i].length;
    var out = new Uint8Array(tot), off = 0;
    for (var i = 0; i < arrs.length; i++) { out.set(arrs[i], off); off += arrs[i].length; }
    return out;
  }

  var HV_W = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
    556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,
    667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,
    611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,
    278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,
    500,500,500,334,260,334,584];

  function glyphW(ch, sz, bold) {
    var c = ch.charCodeAt(0);
    if (c < 32 || c > 126) return sz * 278 / 1000;
    return sz * (HV_W[c - 32] || 556) / 1000 * (bold ? 1.05 : 1);
  }
  function strW(s, sz, bold) {
    var w = 0;
    for (var i = 0; i < s.length; i++) w += glyphW(s[i], sz, bold);
    return w;
  }

  function pdfEsc(s) {
    var o = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 40)  { o += '\\('; continue; }
      if (c === 41)  { o += '\\)'; continue; }
      if (c === 92)  { o += '\\\\'; continue; }
      if (c === 0x2022 || c === 0x2024) { o += '\xb7'; continue; }
      if (c === 0x2014 || c === 0x2013) { o += '-'; continue; }
      if (c === 0x2019 || c === 0x2018) { o += "'"; continue; }
      if (c === 0x201C || c === 0x201D) { o += '"'; continue; }
      if (c === 0x2192) { o += '->'; continue; }
      if (c < 32 || (c > 126 && c < 160)) { o += ' '; continue; }
      if (c > 255) { o += '?'; continue; }
      o += String.fromCharCode(c);
    }
    return o;
  }

  function splitLines(text, maxW, sz, bold) {
    var words = String(text).replace(/\r?\n/g,' ').split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    var lines = [], line = '';
    for (var wi = 0; wi < words.length; wi++) {
      var word = words[wi];
      var test = line ? line + ' ' + word : word;
      if (strW(test, sz, bold) <= maxW) { line = test; }
      else {
        if (line) lines.push(line);
        if (strW(word, sz, bold) > maxW) {
          var chunk = '';
          for (var ci = 0; ci < word.length; ci++) {
            if (strW(chunk + word[ci], sz, bold) <= maxW) chunk += word[ci];
            else { lines.push(chunk); chunk = word[ci]; }
          }
          line = chunk;
        } else { line = word; }
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  // ── MiniPDF ───────────────────────────────────────────────────────────────
  function MiniPDF() {
    this.pages  = [];
    this._sz    = 10;
    this._style = 'normal';
    this._newPage();
  }

  MiniPDF.prototype._newPage = function () {
    this._cur = [];
    this.pages.push(this._cur);
    this._emitFont();
  };
  MiniPDF.prototype._emitFont = function () {
    var m = { normal:'Helv', bold:'HelvB', italic:'HelvO', bolditalic:'HelvBO' };
    this._cur.push('/' + (m[this._style]||'Helv') + ' ' + this._sz + ' Tf');
  };
  MiniPDF.prototype.addPage    = function ()   { this._newPage(); };
  MiniPDF.prototype.setFontSize= function (sz) { this._sz = sz;    this._emitFont(); };
  MiniPDF.prototype.setFont    = function (st) { this._style = st; this._emitFont(); };
  MiniPDF.prototype.setColor   = function (r,g,b) {
    var s = (r/255).toFixed(3)+' '+(g/255).toFixed(3)+' '+(b/255).toFixed(3);
    this._cur.push(s+' rg '+s+' RG');
  };
  MiniPDF.prototype.setLineColor = function (r,g,b) {
    this._cur.push((r/255).toFixed(3)+' '+(g/255).toFixed(3)+' '+(b/255).toFixed(3)+' RG');
  };
  MiniPDF.prototype.setLineWidth = function (w) { this._cur.push(w+' w'); };
  MiniPDF.prototype.setFillColor = function (r,g,b) {
    this._cur.push((r/255).toFixed(3)+' '+(g/255).toFixed(3)+' '+(b/255).toFixed(3)+' rg');
  };
  MiniPDF.prototype._py = function (y) { return (A4H - y).toFixed(2); };
  MiniPDF.prototype.text = function (str, x, y) {
    this._cur.push('BT '+x.toFixed(2)+' '+this._py(y)+' Td ('+pdfEsc(String(str))+') Tj ET');
  };
  MiniPDF.prototype.fillRect = function (x,y,w,h,r,g,b) {
    if (r !== undefined) this.setFillColor(r,g,b);
    this._cur.push(x.toFixed(2)+' '+this._py(y+h)+' '+w.toFixed(2)+' '+h.toFixed(2)+' re f');
  };
  MiniPDF.prototype.hline = function (x1,y,x2) {
    var py = this._py(y);
    this._cur.push(x1.toFixed(2)+' '+py+' m '+x2.toFixed(2)+' '+py+' l S');
  };
  MiniPDF.prototype.getTextWidth  = function (s) {
    return strW(String(s), this._sz, this._style==='bold'||this._style==='bolditalic');
  };
  MiniPDF.prototype.splitTextToSize = function (s, mW) {
    return splitLines(String(s), mW, this._sz, this._style==='bold'||this._style==='bolditalic');
  };

  // ── Build binary ──────────────────────────────────────────────────────────
  MiniPDF.prototype._build = function () {
    var parts = [], pos = 0;
    function w(s) {
      // s must be Latin-1 (all chars 0-255) — guaranteed by our escaping above
      var b = strToBytes(s + '\n');
      parts.push(b);
      pos += b.length;
    }

    w('%PDF-1.4');

    var fontDefs = [
      {id:2,name:'Helv',  base:'Helvetica'},
      {id:3,name:'HelvB', base:'Helvetica-Bold'},
      {id:4,name:'HelvO', base:'Helvetica-Oblique'},
      {id:5,name:'HelvBO',base:'Helvetica-BoldOblique'}
    ];
    var offsets = {};
    for (var fi = 0; fi < fontDefs.length; fi++) {
      var fd = fontDefs[fi];
      offsets[fd.id] = pos;
      w(fd.id+' 0 obj');
      w('<< /Type /Font /Subtype /Type1 /BaseFont /'+fd.base);
      w('/Encoding /WinAnsiEncoding >>');
      w('endobj');
    }

    var cStart = 6, cIds = [];
    for (var pi = 0; pi < this.pages.length; pi++) {
      var oid = cStart + pi;
      cIds.push(oid);
      offsets[oid] = pos;
      var stream = this.pages[pi].join('\n');
      var sb = strToBytes(stream);
      w(oid+' 0 obj');
      w('<< /Length '+sb.length+' >>');
      w('stream');
      parts.push(sb); pos += sb.length;
      w('\nendstream');
      w('endobj');
    }

    var pStart = cStart + this.pages.length, pIds = [];
    var fontRes = fontDefs.map(function(f){ return '/'+f.name+' '+f.id+' 0 R'; }).join(' ');
    for (var pi = 0; pi < this.pages.length; pi++) {
      var oid = pStart + pi;
      pIds.push(oid);
      offsets[oid] = pos;
      w(oid+' 0 obj');
      w('<< /Type /Page /Parent 1 0 R');
      w('/MediaBox [0 0 '+A4W+' '+A4H+']');
      w('/Contents '+cIds[pi]+' 0 R');
      w('/Resources << /Font << '+fontRes+' >> >>');
      w('>>');
      w('endobj');
    }

    offsets[1] = pos;
    w('1 0 obj');
    w('<< /Type /Pages /Kids ['+pIds.map(function(id){ return id+' 0 R'; }).join(' ')+']');
    w('/Count '+this.pages.length+' >>');
    w('endobj');

    var catId = pStart + this.pages.length;
    offsets[catId] = pos;
    w(catId+' 0 obj');
    w('<< /Type /Catalog /Pages 1 0 R >>');
    w('endobj');

    var xrefPos = pos;
    var maxId = catId;
    w('xref');
    w('0 '+(maxId+1));
    w('0000000000 65535 f ');
    for (var i = 1; i <= maxId; i++) {
      var o = offsets[i] !== undefined ? offsets[i] : 0;
      w(String(o).padStart(10,'0')+' 00000 n ');
    }
    w('trailer');
    w('<< /Size '+(maxId+1)+' /Root '+catId+' 0 R >>');
    w('startxref');
    w(String(xrefPos));
    w('%%EOF');

    return concatBytes(parts);
  };

  MiniPDF.prototype.save = function (filename) {
    var bytes = this._build();
    var blob  = new Blob([bytes], { type: 'application/pdf' });
    var url   = URL.createObjectURL(blob);
    var a     = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 3000);
  };

  global.MiniPDF     = MiniPDF;
  global.MiniPDF.A4W = A4W;
  global.MiniPDF.A4H = A4H;

}(typeof window !== 'undefined' ? window : global));
