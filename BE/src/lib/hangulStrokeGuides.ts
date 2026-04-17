type GuidePoint = { x: number; y: number };
type RawStroke = GuidePoint[];
type Box = { x: number; y: number; width: number; height: number };

type GuideStroke = {
  order: number;
  color: string;
  labelX: number;
  labelY: number;
  duration: number;
  points: GuidePoint[];
};

type CharacterGuide = {
  canvas: { width: number; height: number };
  strokes: GuideStroke[];
};

type StrokeOrderIssue = {
  id: string;
  severity: number;
  detail: string;
  suggestion: string;
};

const GUIDE_SIZE = 100;
const GUIDE_COLORS = [
  '#4f46e5',
  '#8b5cf6',
  '#db2777',
  '#dc2626',
  '#f59e0b',
  '#22c55e',
  '#10b981',
  '#84cc16',
  '#0ea5e9',
  '#f97316',
];

const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSEONG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSEONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const VERTICAL_VOWELS = new Set(['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅣ']);

const COMPLEX_FINALS: Record<string, string[]> = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

const COMPOUND_VOWELS: Record<string, string[]> = {
  'ㅐ': ['ㅏ', 'ㅣ'],
  'ㅒ': ['ㅑ', 'ㅣ'],
  'ㅔ': ['ㅓ', 'ㅣ'],
  'ㅖ': ['ㅕ', 'ㅣ'],
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

const DOUBLE_CONSONANTS: Record<string, string> = {
  'ㄲ': 'ㄱ',
  'ㄸ': 'ㄷ',
  'ㅃ': 'ㅂ',
  'ㅆ': 'ㅅ',
  'ㅉ': 'ㅈ',
};

const box = (x: number, y: number, width: number, height: number): Box => ({
  x,
  y,
  width,
  height,
});

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(value)));

const circleStroke = (cx: number, cy: number, r: number, segments = 24): RawStroke =>
  Array.from({ length: segments + 1 }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / segments;
    return {
      x: Number((cx + Math.cos(angle) * r).toFixed(2)),
      y: Number((cy + Math.sin(angle) * r).toFixed(2)),
    };
  });

const BASE_TEMPLATES: Record<string, RawStroke[]> = {
  'ㄱ': [[{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 40 }]],
  'ㄴ': [[
    { x: 28, y: 15 },
    { x: 28, y: 75 },
    { x: 32, y: 82 },
    { x: 85, y: 82 },
  ]],
  'ㄷ': [
    [{ x: 25, y: 20 }, { x: 75, y: 20 }],
    [{ x: 25, y: 20 }, { x: 25, y: 80 }, { x: 75, y: 80 }],
  ],
  'ㄹ': [
    [{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 40 }],
    [{ x: 20, y: 50 }, { x: 80, y: 50 }],
    [{ x: 20, y: 50 }, { x: 20, y: 80 }, { x: 80, y: 80 }],
  ],
  'ㅁ': [
    [{ x: 25, y: 20 }, { x: 25, y: 80 }],
    [{ x: 25, y: 20 }, { x: 75, y: 20 }, { x: 75, y: 80 }],
    [{ x: 25, y: 80 }, { x: 75, y: 80 }],
  ],
  'ㅂ': [
    [{ x: 30, y: 20 }, { x: 30, y: 80 }],
    [{ x: 70, y: 20 }, { x: 70, y: 80 }],
    [{ x: 30, y: 50 }, { x: 70, y: 50 }],
    [{ x: 30, y: 80 }, { x: 70, y: 80 }],
  ],
  'ㅅ': [
  [{ x: 45, y: 15 }, { x: 15, y: 85 }], // Nét xiên trái: bắt đầu hơi lệch trái một chút
  [{ x: 55, y: 15 }, { x: 85, y: 85 }], // Nét xiên phải: bắt đầu hơi lệch phải một chút
],
  'ㅇ': [circleStroke(50, 50, 35, 20)],
  'ㅈ': [
    [{ x: 20, y: 20 }, { x: 80, y: 20 }],
    [{ x: 50, y: 20 }, { x: 20, y: 85 }],
    [{ x: 50, y: 20 }, { x: 80, y: 85 }],
  ],
  'ㅊ': [
    [{ x: 40, y: 5 }, { x: 60, y: 5 }],
    [{ x: 20, y: 25 }, { x: 80, y: 25 }],
    [{ x: 50, y: 25 }, { x: 20, y: 85 }],
    [{ x: 50, y: 25 }, { x: 80, y: 85 }],
  ],
  'ㅋ': [
    [{ x: 20, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 80 }],
    [{ x: 20, y: 50 }, { x: 80, y: 50 }],
  ],
  'ㅌ': [
    [{ x: 20, y: 20 }, { x: 80, y: 20 }],
    [{ x: 20, y: 50 }, { x: 70, y: 50 }],
    [{ x: 20, y: 80 }, { x: 80, y: 80 }],
    [{ x: 20, y: 20 }, { x: 20, y: 80 }],
  ],
  'ㅍ': [
    [{ x: 20, y: 20 }, { x: 80, y: 20 }],
    [{ x: 35, y: 20 }, { x: 35, y: 80 }],
    [{ x: 65, y: 20 }, { x: 65, y: 80 }],
    [{ x: 20, y: 80 }, { x: 80, y: 80 }],
  ],
  'ㅎ': [
    [{ x: 40, y: 10 }, { x: 60, y: 10 }],
    [{ x: 20, y: 30 }, { x: 80, y: 30 }],
    circleStroke(50, 65, 25, 20),
  ],

  'ㅏ': [
    [{ x: 30, y: 10 }, { x: 30, y: 90 }],
    [{ x: 30, y: 50 }, { x: 80, y: 50 }],
  ],
  'ㅑ': [
    [{ x: 30, y: 10 }, { x: 30, y: 90 }],
    [{ x: 30, y: 35 }, { x: 80, y: 35 }],
    [{ x: 30, y: 65 }, { x: 80, y: 65 }],
  ],
  'ㅓ': [
    [{ x: 70, y: 10 }, { x: 70, y: 90 }],
    [{ x: 20, y: 50 }, { x: 70, y: 50 }],
  ],
  'ㅕ': [
    [{ x: 70, y: 10 }, { x: 70, y: 90 }],
    [{ x: 20, y: 35 }, { x: 70, y: 35 }],
    [{ x: 20, y: 65 }, { x: 70, y: 65 }],
  ],
  'ㅣ': [[{ x: 50, y: 10 }, { x: 50, y: 90 }]],
  'ㅗ': [
    [{ x: 50, y: 15 }, { x: 50, y: 50 }],
    [{ x: 10, y: 50 }, { x: 90, y: 50 }],
  ],
  'ㅛ': [
    [{ x: 35, y: 15 }, { x: 35, y: 50 }],
    [{ x: 65, y: 15 }, { x: 65, y: 50 }],
    [{ x: 10, y: 50 }, { x: 90, y: 50 }],
  ],
  'ㅜ': [
    [{ x: 10, y: 40 }, { x: 90, y: 40 }],
    [{ x: 50, y: 40 }, { x: 50, y: 85 }],
  ],
  'ㅠ': [
    [{ x: 10, y: 40 }, { x: 90, y: 40 }],
    [{ x: 35, y: 40 }, { x: 35, y: 85 }],
    [{ x: 65, y: 40 }, { x: 65, y: 85 }],
  ],
  'ㅡ': [[{ x: 10, y: 50 }, { x: 90, y: 50 }]],
};

function getBounds(strokes: RawStroke[]) {
  const points = strokes.flat();

  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function fitStrokesToBox(strokes: RawStroke[], target: Box, padding = 0): RawStroke[] {
  if (!strokes.length) return [];

  const bounds = getBounds(strokes);
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);

  const innerWidth = Math.max(target.width - padding * 2, 1);
  const innerHeight = Math.max(target.height - padding * 2, 1);

  const scale = Math.min(innerWidth / width, innerHeight / height);
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  const offsetX = target.x + (target.width - scaledWidth) / 2 - bounds.minX * scale;
  const offsetY = target.y + (target.height - scaledHeight) / 2 - bounds.minY * scale;

  return strokes.map((stroke) =>
    stroke.map((point) => ({
      x: Number((point.x * scale + offsetX).toFixed(2)),
      y: Number((point.y * scale + offsetY).toFixed(2)),
    }))
  );
}

function mergeTemplates(items: Array<{ strokes: RawStroke[]; target: Box; padding?: number }>) {
  return items.flatMap((item) =>
    fitStrokesToBox(item.strokes, item.target, item.padding || 0)
  );
}

function shiftStrokes(strokes: RawStroke[], offsetX: number, offsetY: number): RawStroke[] {
  return strokes.map((stroke) =>
    stroke.map((point) => ({
      x: Number((point.x + offsetX).toFixed(2)),
      y: Number((point.y + offsetY).toFixed(2)),
    }))
  );
}

function getJamoTemplate(jamo: string): RawStroke[] {
  if (BASE_TEMPLATES[jamo]) {
    return BASE_TEMPLATES[jamo];
  }

  if (DOUBLE_CONSONANTS[jamo]) {
    const base = getJamoTemplate(DOUBLE_CONSONANTS[jamo]);
    return mergeTemplates([
      { strokes: base, target: box(0, 0, 46, 100), padding: 2 },
      { strokes: base, target: box(54, 0, 46, 100), padding: 2 },
    ]);
  }

  if (COMPLEX_FINALS[jamo]) {
    const [left, right] = COMPLEX_FINALS[jamo];
    return mergeTemplates([
      { strokes: getJamoTemplate(left), target: box(0, 0, 48, 100), padding: 2 },
      { strokes: getJamoTemplate(right), target: box(52, 0, 48, 100), padding: 2 },
    ]);
  }

  if (COMPOUND_VOWELS[jamo]) {
    const [left, right] = COMPOUND_VOWELS[jamo];

    if (['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ'].includes(jamo)) {
      return mergeTemplates([
        { strokes: getJamoTemplate(left), target: box(0, 0, 54, 100), padding: 2 },
        { strokes: getJamoTemplate(right), target: box(46, 0, 54, 100), padding: 2 },
      ]);
    }

    if (['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅢ'].includes(jamo)) {
      return mergeTemplates([
        { strokes: getJamoTemplate(left), target: box(0, 0, 66, 100), padding: 2 },
        { strokes: getJamoTemplate(right), target: box(62, 0, 38, 100), padding: 2 },
      ]);
    }
  }

  return [[
    { x: 20, y: 20 },
    { x: 80, y: 20 },
    { x: 80, y: 80 },
    { x: 20, y: 80 },
    { x: 20, y: 20 },
  ]];
}

function decomposeHangulSyllable(character: string) {
  const code = String(character || '').charCodeAt(0);

  if (!code || code < 0xac00 || code > 0xd7a3) {
    return null;
  }

  const syllableIndex = code - 0xac00;
  const choseongIndex = Math.floor(syllableIndex / 588);
  const jungseongIndex = Math.floor((syllableIndex % 588) / 28);
  const jongseongIndex = syllableIndex % 28;

  return {
    choseong: CHOSEONG[choseongIndex],
    jungseong: JUNGSEONG[jungseongIndex],
    jongseong: JONGSEONG[jongseongIndex],
  };
}

function buildCharacterGuide(character: string): CharacterGuide | null {
  const decomposed = decomposeHangulSyllable(character);
  if (!decomposed) return null;

  const isVertical = VERTICAL_VOWELS.has(decomposed.jungseong);
  const hasBatchim = decomposed.jongseong !== '';

  let choseongBox: Box;
  let jungseongBox: Box;
  let jongseongBox: Box;

  if (isVertical) {
    choseongBox = hasBatchim ? box(10, 5, 40, 45) : box(12, 15, 38, 70);
    jungseongBox = hasBatchim ? box(60, 5, 30, 50) : box(60, 10, 30, 80);
    jongseongBox = box(20, 60, 60, 32);
  } else {
    choseongBox = hasBatchim ? box(25, 5, 50, 30) : box(20, 10, 60, 40);
    jungseongBox = hasBatchim ? box(10, 40, 80, 20) : box(10, 55, 80, 30);
    jongseongBox = box(20, 65, 60, 30);
  }

  const strokes: RawStroke[] = [
    ...fitStrokesToBox(getJamoTemplate(decomposed.choseong), choseongBox, 2),
    ...fitStrokesToBox(getJamoTemplate(decomposed.jungseong), jungseongBox, 0),
  ];

  if (hasBatchim) {
    strokes.push(...fitStrokesToBox(getJamoTemplate(decomposed.jongseong), jongseongBox, 2));
  }

  return {
    canvas: { width: GUIDE_SIZE, height: GUIDE_SIZE },
    strokes: strokes.map((points, index) => ({
      order: index + 1,
      color: GUIDE_COLORS[index % GUIDE_COLORS.length],
      labelX: clamp(points[0].x - 4, 5, 95),
      labelY: clamp(points[0].y - 4, 5, 95),
      duration: 0.55,
      points,
    })),
  };
}

function extractHangulSyllables(text: string) {
  return Array.from(String(text || '')).filter((char) => /[가-힣]/.test(char));
}

function buildWordGuide(text: string): CharacterGuide | null {
  const characters = extractHangulSyllables(text);

  if (!characters.length) {
    return null;
  }

  if (characters.length === 1) {
    return buildCharacterGuide(characters[0]);
  }

  const composed: RawStroke[] = [];
  const charGap = characters.length >= 3 ? 10 : 14;
  let cursorX = 0;

  characters.forEach((char) => {
    const guide = buildCharacterGuide(char);

    if (!guide) {
      return;
    }

    const rawStrokes = guide.strokes.map((stroke) => stroke.points);
    const bounds = getBounds(rawStrokes);
    const shifted = shiftStrokes(rawStrokes, cursorX - bounds.minX, 0);

    composed.push(...shifted);
    cursorX += Math.max(bounds.maxX - bounds.minX, 1) + charGap;
  });

  if (!composed.length) {
    return null;
  }

  const fitted = fitStrokesToBox(composed, box(8, 10, 84, 80), 0);

  return {
    canvas: { width: GUIDE_SIZE, height: GUIDE_SIZE },
    strokes: fitted.map((points, index) => ({
      order: index + 1,
      color: GUIDE_COLORS[index % GUIDE_COLORS.length],
      labelX: clamp((points[0]?.x || 10) - 4, 5, 95),
      labelY: clamp((points[0]?.y || 12) - 4, 5, 95),
      duration: 0.55,
      points,
    })),
  };
}

function buildGuidesFromWords(words: string[]) {
  const uniqueCharacters = Array.from(
    new Set(words.flatMap((word) => extractHangulSyllables(word)))
  );

  return uniqueCharacters.reduce<Record<string, CharacterGuide>>((result, character) => {
    const guide = buildCharacterGuide(character);

    if (guide) {
      result[character] = guide;
    }

    return result;
  }, {});
}

function getExpectedStrokeCount(text: string) {
  return (
    buildWordGuide(text)?.strokes.length ||
    buildCharacterGuide(text)?.strokes.length ||
    0
  );
}

function normalizePoint(point: any, width: number, height: number) {
  return {
    x: Number(point?.x || 0) / Math.max(width, 1),
    y: Number(point?.y || 0) / Math.max(height, 1),
  };
}

function pointDistance(a: any, b: any) {
  if (!a || !b) return 1;

  const dx = Number(a.x || 0) - Number(b.x || 0);
  const dy = Number(a.y || 0) - Number(b.y || 0);

  return Math.sqrt(dx * dx + dy * dy);
}

function cosineSimilarity(ax: number, ay: number, bx: number, by: number) {
  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);

  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

function strokeLength(points: any[], width: number, height: number) {
  if (!Array.isArray(points) || points.length < 2) return 0;

  let total = 0;

  for (let i = 1; i < points.length; i += 1) {
    const left = normalizePoint(points[i - 1], width, height);
    const right = normalizePoint(points[i], width, height);
    total += pointDistance(left, right);
  }

  return total;
}

function strokeSignature(points: any[], width: number, height: number) {
  if (!Array.isArray(points) || !points.length) return null;

  const midIndex = Math.floor(points.length / 2);
  const start = normalizePoint(points[0], width, height);
  const mid = normalizePoint(points[midIndex], width, height);
  const end = normalizePoint(points[points.length - 1], width, height);

  return {
    start,
    mid,
    end,
    dx: end.x - start.x,
    dy: end.y - start.y,
    length: strokeLength(points, width, height),
  };
}

function scoreStrokeOrder(text: string, strokeGroups: any[], canvasWidth = 650, canvasHeight = 600) {
  const guide = buildWordGuide(text) || buildCharacterGuide(text);

  if (!guide?.strokes?.length) {
    return { score: 100, issues: [] as StrokeOrderIssue[], guideData: null };
  }

  const actualStrokes = Array.isArray(strokeGroups)
    ? strokeGroups.filter((stroke) => Array.isArray(stroke) && stroke.length > 0)
    : [];

  if (!actualStrokes.length) {
    return {
      score: 0,
      issues: [
        {
          id: 'missing_strokes_for_order',
          severity: 96,
          detail: 'Chưa có đủ nét viết để đối chiếu với thứ tự nét chuẩn.',
          suggestion: 'Viết đủ từng nét theo hình mẫu rồi chấm lại.',
        },
      ],
      guideData: guide,
    };
  }

  const commonCount = Math.min(actualStrokes.length, guide.strokes.length);
  const issues: StrokeOrderIssue[] = [];
  let totalScore = 0;

  for (let i = 0; i < commonCount; i += 1) {
    const actual = strokeSignature(actualStrokes[i], canvasWidth, canvasHeight);
    const expected = strokeSignature(
      guide.strokes[i].points,
      guide.canvas.width,
      guide.canvas.height
    );

    if (!actual || !expected) {
      continue;
    }

    const startScore = clamp(100 - pointDistance(actual.start, expected.start) * 240);
    const midScore = clamp(100 - pointDistance(actual.mid, expected.mid) * 200);
    const endScore = clamp(100 - pointDistance(actual.end, expected.end) * 220);
    const directionScore = clamp(
      Math.max(0, cosineSimilarity(actual.dx, actual.dy, expected.dx, expected.dy)) * 100
    );

    const ratio =
      actual.length > 0 && expected.length > 0
        ? Math.min(actual.length, expected.length) / Math.max(actual.length, expected.length)
        : 0;

    const lengthScore = clamp(ratio * 100);

    const strokeScore = clamp(
      startScore * 0.3 +
        midScore * 0.2 +
        endScore * 0.2 +
        directionScore * 0.2 +
        lengthScore * 0.1
    );

    totalScore += strokeScore;

    if (strokeScore < 60) {
      issues.push({
        id: `wrong_stroke_order_${i + 1}`,
        severity: 90 - i,
        detail: `Nét ${i + 1} đang sai thứ tự hoặc sai hướng so với mẫu chuẩn.`,
        suggestion: `Viết lại nét ${i + 1} theo đúng điểm bắt đầu và hướng kéo bút trên hình mẫu.`,
      });
    }
  }

  const countDiff = Math.abs(actualStrokes.length - guide.strokes.length);

  if (countDiff > 0) {
    issues.push({
      id: 'stroke_count_mismatch_for_order',
      severity: 94,
      detail: `Bạn viết ${actualStrokes.length} nét trong khi mẫu chuẩn có ${guide.strokes.length} nét, nên thứ tự nét hiện chưa đúng hoàn toàn.`,
      suggestion: `Viết lại đủ đúng ${guide.strokes.length} nét theo số thứ tự trên card hướng dẫn.`,
    });
  }

  const baseScore = commonCount > 0 ? totalScore / commonCount : 0;

  return {
    score: clamp(baseScore - countDiff * 12),
    issues,
    guideData: guide,
  };
}

module.exports = {
  buildCharacterGuide,
  buildWordGuide,
  buildWritingGuide: buildWordGuide,
  buildGuidesFromWords,
  extractHangulSyllables,
  getExpectedStrokeCount,
  scoreStrokeOrder,
};
