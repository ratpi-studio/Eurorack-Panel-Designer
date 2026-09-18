// The opentype.js build that ships with three (used by its TTFLoader) has no type declarations.
// Only the parts the text layout uses are declared.
declare module "three/examples/jsm/libs/opentype.module.js" {
  export interface OpentypePathCommand {
    type: "M" | "L" | "Q" | "C" | "Z";
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  /** Outline in font units, with y pointing up. */
  export interface OpentypePath {
    commands: OpentypePathCommand[];
  }

  export interface OpentypeGlyph {
    index: number;
    advanceWidth?: number;
    path: OpentypePath;
  }

  export interface OpentypeFont {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    tables: {
      os2?: { sCapHeight?: number };
    };
    glyphs: {
      length: number;
      get(index: number): OpentypeGlyph;
    };
    /** 0 when the font has no glyph for the character. */
    charToGlyphIndex(char: string): number;
    charToGlyph(char: string): OpentypeGlyph;
    getKerningValue(left: OpentypeGlyph | number, right: OpentypeGlyph | number): number;
  }

  const opentype: {
    parse(buffer: ArrayBuffer): OpentypeFont;
  };

  export default opentype;
}
