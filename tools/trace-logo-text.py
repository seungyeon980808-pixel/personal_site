"""
trace-logo-text.py — 5E 마크와 인트로에 쓰는 글자를 벡터 패스로 뽑는다.

왜 필요한가:
  SVG/CSS 에 "5E" 를 글자로 두면 Georgia 가 설치된 기기(Windows·macOS)에서만
  의도한 모양이 나온다. 안드로이드에는 Georgia 가 없어 전혀 다른 폰트로 대체되고,
  아이콘과 인트로 영상의 글자가 기기마다 딴판이 된다.
  글자를 미리 패스로 떠 두면 폰트 설치 여부와 무관하게 어디서나 같게 그려진다.

만드는 것:
  assets/logo-5e.svg   의 <path>  (아이콘 안의 5E)
  assets/glyphs-5e.js  E · 2 · 3 · 4 · 5 글리프 (인트로 애니메이션)

logo-hwp.svg(Segoe UI) 와 logo-modipdf.svg(Helvetica Neue→Arial) 도 같은 병이
있었지만 글자가 하나씩뿐이라 여기서 뽑은 패스를 직접 붙여 넣었다.
다시 뽑을 일이 있으면 --labels 로 출력만 받는다.

사용: python tools/trace-logo-text.py     (Windows 에서, Georgia 설치 상태로 실행)
"""
import io
import os

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONT = "C:/Windows/Fonts/georgiaz.ttf"  # Georgia Bold Italic (CSS 의 italic + 600 이 고르는 것)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

font = TTFont(FONT)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
UPM = font["head"].unitsPerEm
ASC = font["OS/2"].usWinAscent
DESC = font["OS/2"].usWinDescent


def num(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")


def advance(text):
    return sum(hmtx[cmap[ord(c)]][0] for c in text)


def outline(text, scale=1.0, x0=0.0, baseline=0.0):
    """text 를 패스 문자열로. scale/x0/baseline 은 결과 좌표계 기준."""
    pen = SVGPathPen(glyphs, ntos=num)
    x = x0
    for ch in text:
        g = cmap[ord(ch)]
        glyphs[g].draw(TransformPen(pen, Transform(scale, 0, 0, -scale, x, baseline)))
        x += hmtx[g][0] * scale
    return pen.getCommands()


# ---- 1) 아이콘 --------------------------------------------------------------
# 원래 마크업: <text x=49 y=49 font-size=54 text-anchor=middle dominant-baseline=central>
# 브라우저가 실제로 그리던 위치를 그대로 재현한다 (out/bb2.js 로 잉크 박스 대조 확인).
SIZE, BOX = 54.0, 96.0
s = SIZE / UPM
x0 = 49.0 - advance("5E") * s / 2.0
baseline = 67.77  # 레이아웃 박스 상단 18 + winAscent — 픽셀 대조로 확정
icon_path = outline("5E", s, x0, baseline)

svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="5E">
  <defs>
    <radialGradient id="bg" cx="50%%" cy="60%%" r="72%%">
      <stop offset="0%%" stop-color="#1f5fc4"/>
      <stop offset="66%%" stop-color="#08142e"/>
    </radialGradient>
  </defs>
  <rect width="96" height="96" rx="20" fill="url(#bg)"/>
  <!-- "5E" 는 글자가 아니라 벡터 패스다. 텍스트로 두면 Georgia 가 없는 기기에서
       다른 폰트로 대체돼 아이콘 모양이 완전히 달라진다.
       원본: Georgia Bold Italic 54px / 재생성: python tools/trace-logo-text.py -->
  <path d="%s" fill="#f5f8ff"/>
</svg>
""" % icon_path
io.open(os.path.join(ROOT, "assets/logo-5e.svg"), "w", encoding="utf-8").write(svg)

# ---- 2) 인트로용 글리프 -----------------------------------------------------
# 인트로는 E 와 2·3·4·5 만 쓴다. 글자 대신 인라인 SVG 를 넣기 위해 패스만 뽑는다.
# viewBox 는 폰트 단위 그대로 — 높이가 텍스트 한 줄 상자와 같아 배치가 안 틀어진다.
CHARS = ["E", "2", "3", "4", "5"]
entries = []
for ch in CHARS:
    entries.append('  "%s": { w: %d, d: "%s" }'
                   % (ch, advance(ch), outline(ch, 1.0, 0.0, ASC)))

js = """/* =========================================================================
   glyphs-5e.js — 인트로에 쓰는 글자를 벡터 패스로 갖고 있다.

   Georgia 는 안드로이드에 없다. 글자로 두면 기기마다 다른 폰트로 대체돼
   아이콘·인트로의 5E 가 딴 모양이 된다. 미리 떠 둔 패스를 인라인 SVG 로
   넣으면 어디서나 똑같이 그려진다.

   자동 생성: python tools/trace-logo-text.py — 직접 고치지 말 것.
   ========================================================================= */
(function (root) {
  "use strict";
  var UPM = %d, ASC = %d, DESC = %d, H = ASC + DESC;
  var G = {
%s
  };

  /* 문자열 하나를 인라인 SVG 마크업으로. 색은 fill:currentColor 라
     기존의 element.style.color 지정이 그대로 먹는다. */
  root.k5glyph = function (text) {
    var x = 0, d = "";
    for (var i = 0; i < text.length; i++) {
      var g = G[text[i]];
      if (!g) continue;
      d += x ? ' <path transform="translate(' + x + ' 0)" d="' + g.d + '"/>'
             : ' <path d="' + g.d + '"/>';
      x += g.w;
    }
    return '<svg viewBox="0 0 ' + x + ' ' + H + '" height="' + (H / UPM).toFixed(4) + 'em"'
         + ' width="' + (x / UPM).toFixed(4) + 'em" fill="currentColor"'
         + ' aria-hidden="true" focusable="false">' + d + '</svg>';
  };
})(window);
""" % (UPM, ASC, DESC, ",\n".join(entries))
io.open(os.path.join(ROOT, "assets/glyphs-5e.js"), "w", encoding="utf-8").write(js)

print("assets/logo-5e.svg   %d bytes" % len(svg))
print("assets/glyphs-5e.js  %d bytes" % len(js))


# ---- 3) 다른 아이콘의 작은 라벨 ---------------------------------------------
# hwp_palette 의 h·w·p (Segoe UI Bold) 와 ModiPdf 의 PDF (Arial Bold).
# 글자가 몇 개 안 되므로 여기서 뽑아 SVG 에 손으로 붙였다. 아래는 재생성용.
def label(fontfile, text, size, cx, cy, central=True, tracking=0.0):
    ft = TTFont(fontfile)
    gsx, cmx, hmx = ft.getGlyphSet(), ft.getBestCmap(), ft["hmtx"]
    upm, o = ft["head"].unitsPerEm, ft["OS/2"]
    sc = size / upm
    adv = sum(hmx[cmx[ord(c)]][0] * sc + tracking for c in text)
    x = cx - adv / 2.0
    base = cy + (o.usWinAscent - o.usWinDescent) / 2.0 * sc if central else cy
    pen = SVGPathPen(gsx, ntos=num)
    for c in text:
        g = cmx[ord(c)]
        gsx[g].draw(TransformPen(pen, Transform(sc, 0, 0, -sc, x, base)))
        x += hmx[g][0] * sc + tracking
    return pen.getCommands()


SEGOE, ARIAL = "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"
print("\n-- logo-hwp.svg --")
for ch, cx, cy in [("h", 27.5, 35.7), ("w", 50.5, 30.7), ("p", 42.5, 54.7)]:
    print('%s: %s' % (ch, label(SEGOE, ch, 14, cx, cy)))
print("\n-- logo-modipdf.svg --")
print('PDF: %s' % label(ARIAL, "PDF", 14, 48, 35, central=False, tracking=0.5))
