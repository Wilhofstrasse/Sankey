/**
 * Tests for sankeymatic.js - Input parsing and validation
 *
 * Tests cover:
 * - Input parsing and validation
 * - Node name parsing
 * - Flow parsing
 * - Settings validation
 * - Utility functions
 */

// ============================================================================
// Utility Functions (extracted from sankeymatic.js for testing)
// ============================================================================

function flatten(s) {
  return s.replaceAll('\\n', ' ');
}

function singleQuote(s) {
  return `'${s}'`;
}

function isNumeric(n) {
  return !Number.isNaN(n - parseFloat(n));
}

function clamp(n, min, max) {
  return isNumeric(n) ? Math.min(Math.max(Number(n), min), max) : min;
}

function escapeHTML(unsafeString) {
  return unsafeString
    .replaceAll('→', '&#8594;')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll(''', '&lsquo;')
    .replaceAll(''', '&rsquo;')
    .replaceAll('\n', '<br>');
}

function ep(x) {
  return Number(x.toFixed(5)).toString();
}

function updateMarks(stringIn, numberMarks) {
  if (numberMarks.group === ',') {
    return stringIn;
  }
  return stringIn
    .replaceAll(',', '!')
    .replaceAll('.', numberMarks.decimal)
    .replaceAll('!', numberMarks.group);
}

// Node name parsing function
function parseNodeName(rawName) {
  const hiddenNameMatches = rawName.match(/^-(.*)-$/);
  const hideThisLabel = hiddenNameMatches !== null;
  const trueName = hideThisLabel ? hiddenNameMatches[1] : rawName;
  return { trueName, hideWholeLabel: hideThisLabel };
}

// String unquoting function
function tryUnquotingString(inString) {
  const reFindQuotes = /^(?<quoteChar>['"])(?<innerString>.*)\1$/;
  const matches = inString.match(reFindQuotes);

  if (!matches) {
    return { success: true, data: inString };
  }

  const { quoteChar, innerString } = matches.groups;
  const twoQuotes = quoteChar + quoteChar;

  if (innerString.replaceAll(twoQuotes, '').includes(quoteChar)) {
    return {
      success: false,
      message: 'Use 2 consecutive quotes inside a quoted string',
    };
  }

  return {
    success: true,
    data: innerString.replaceAll(twoQuotes, quoteChar),
  };
}

// Regular expressions for parsing
const reFlowLine = /^(?<sourceNode>.+)\[(?<amount>[\d\s.+-]+|\*|\?|)\](?<targetNodePlus>.+)$/;
const reNodeLineLoose = /^:(.+) #([a-f0-9]{0,6})?(\.\d{1,4})?\s*(>>|<<)*\s*(>>|<<)*$/i;
const reNodeLineStrict = /^node\s+([^ .]+)$/i;
const reCommentLine = /^(?:'|\/\/)/;
const reSettingsValue = /^((?:\w+\s*){1,2}) (#?[\w.-]+)$/;
const reSettingsText = /^((?:\w+\s*){1,2}) '(.*)'$/;
const reMoveLine = /^move (.+) (-?\d(?:.\d+)?), (-?\d(?:.\d+)?)$/;
const reColorPlusOpacity = /^#([a-f0-9]{3,6})?(\.\d{1,4})?$/i;
const reFlowTargetWithSuffix = /^(.+)\s+(#\S+)$/;

// ============================================================================
// Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('flatten', () => {
    it('should replace \\n with spaces', () => {
      expect(flatten('Hello\\nWorld')).toBe('Hello World');
      expect(flatten('Line1\\nLine2\\nLine3')).toBe('Line1 Line2 Line3');
    });

    it('should handle strings without \\n', () => {
      expect(flatten('Hello World')).toBe('Hello World');
      expect(flatten('')).toBe('');
    });
  });

  describe('singleQuote', () => {
    it('should wrap string in single quotes', () => {
      expect(singleQuote('test')).toBe("'test'");
      expect(singleQuote('')).toBe("''");
    });
  });

  describe('isNumeric', () => {
    it('should return true for numbers', () => {
      expect(isNumeric(42)).toBe(true);
      expect(isNumeric(3.14)).toBe(true);
      expect(isNumeric(0)).toBe(true);
      expect(isNumeric(-10)).toBe(true);
    });

    it('should return true for numeric strings', () => {
      expect(isNumeric('42')).toBe(true);
      expect(isNumeric('3.14')).toBe(true);
      expect(isNumeric('0')).toBe(true);
      expect(isNumeric('-10')).toBe(true);
    });

    it('should return false for non-numeric values', () => {
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric('')).toBe(false);
      expect(isNumeric(NaN)).toBe(false);
      expect(isNumeric(undefined)).toBe(false);
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should clamp values below minimum to minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, 0, 10)).toBe(0);
    });

    it('should clamp values above maximum to maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, 0, 10)).toBe(10);
    });

    it('should return minimum for non-numeric values', () => {
      expect(clamp('abc', 0, 10)).toBe(0);
      expect(clamp(NaN, 5, 15)).toBe(5);
    });

    it('should handle numeric strings', () => {
      expect(clamp('5', 0, 10)).toBe(5);
      expect(clamp('15', 0, 10)).toBe(10);
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
      expect(escapeHTML('a & b')).toBe('a &amp; b');
      expect(escapeHTML('"quoted"')).toBe('&quot;quoted&quot;');
    });

    it('should escape arrows', () => {
      expect(escapeHTML('a → b')).toBe('a &#8594; b');
    });

    it('should convert newlines to br tags', () => {
      expect(escapeHTML('line1\nline2')).toBe('line1<br>line2');
    });

    it('should handle empty strings', () => {
      expect(escapeHTML('')).toBe('');
    });
  });

  describe('ep (enough precision)', () => {
    it('should limit decimal places to 5', () => {
      expect(ep(3.141592653589793)).toBe('3.14159');
      expect(ep(1.123456789)).toBe('1.12346');
    });

    it('should not add trailing zeros', () => {
      expect(ep(8)).toBe('8');
      expect(ep(8.0)).toBe('8');
      expect(ep(8.1)).toBe('8.1');
    });

    it('should handle zero', () => {
      expect(ep(0)).toBe('0');
    });
  });

  describe('updateMarks', () => {
    it('should not modify when group mark is comma', () => {
      const marks = { group: ',', decimal: '.' };
      expect(updateMarks('1,000.50', marks)).toBe('1,000.50');
    });

    it('should swap marks for European format', () => {
      const marks = { group: '.', decimal: ',' };
      expect(updateMarks('1,000.50', marks)).toBe('1.000,50');
    });

    it('should handle space as group separator', () => {
      const marks = { group: ' ', decimal: '.' };
      expect(updateMarks('1,000.50', marks)).toBe('1 000.50');
    });
  });
});

describe('Node Name Parsing', () => {
  describe('parseNodeName', () => {
    it('should parse regular node names', () => {
      const result = parseNodeName('MyNode');
      expect(result.trueName).toBe('MyNode');
      expect(result.hideWholeLabel).toBe(false);
    });

    it('should parse struck-through (hidden) node names', () => {
      const result = parseNodeName('-HiddenNode-');
      expect(result.trueName).toBe('HiddenNode');
      expect(result.hideWholeLabel).toBe(true);
    });

    it('should handle empty string between dashes', () => {
      const result = parseNodeName('--');
      expect(result.trueName).toBe('');
      expect(result.hideWholeLabel).toBe(true);
    });

    it('should not treat single dash as hidden', () => {
      const result = parseNodeName('-Node');
      expect(result.trueName).toBe('-Node');
      expect(result.hideWholeLabel).toBe(false);
    });

    it('should handle nodes with internal dashes', () => {
      const result = parseNodeName('My-Node-Name');
      expect(result.trueName).toBe('My-Node-Name');
      expect(result.hideWholeLabel).toBe(false);
    });

    it('should handle hidden nodes with internal dashes', () => {
      const result = parseNodeName('-My-Node-Name-');
      expect(result.trueName).toBe('My-Node-Name');
      expect(result.hideWholeLabel).toBe(true);
    });
  });
});

describe('String Unquoting', () => {
  describe('tryUnquotingString', () => {
    it('should return unquoted strings unchanged', () => {
      const result = tryUnquotingString('hello');
      expect(result.success).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should unquote single-quoted strings', () => {
      const result = tryUnquotingString("'hello'");
      expect(result.success).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should unquote double-quoted strings', () => {
      const result = tryUnquotingString('"hello"');
      expect(result.success).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should handle escaped quotes', () => {
      const result = tryUnquotingString("'Al''s Share'");
      expect(result.success).toBe(true);
      expect(result.data).toBe("Al's Share");
    });

    it('should fail on unescaped internal quotes', () => {
      const result = tryUnquotingString("'Al's Share'");
      expect(result.success).toBe(false);
      expect(result.message).toContain('2 consecutive quotes');
    });

    it('should handle empty quoted strings', () => {
      const result = tryUnquotingString("''");
      expect(result.success).toBe(true);
      expect(result.data).toBe('');
    });
  });
});

describe('Flow Line Parsing', () => {
  describe('reFlowLine regex', () => {
    it('should match simple flow lines', () => {
      const match = 'Source [100] Target'.match(reFlowLine);
      expect(match).not.toBeNull();
      expect(match.groups.sourceNode).toBe('Source ');
      expect(match.groups.amount).toBe('100');
      expect(match.groups.targetNodePlus).toBe(' Target');
    });

    it('should match flow lines with decimal amounts', () => {
      const match = 'Source [99.5] Target'.match(reFlowLine);
      expect(match).not.toBeNull();
      expect(match.groups.amount).toBe('99.5');
    });

    it('should match flow lines with wildcard *', () => {
      const match = 'Source [*] Target'.match(reFlowLine);
      expect(match).not.toBeNull();
      expect(match.groups.amount).toBe('*');
    });

    it('should match flow lines with wildcard ?', () => {
      const match = 'Source [?] Target'.match(reFlowLine);
      expect(match).not.toBeNull();
      expect(match.groups.amount).toBe('?');
    });

    it('should match flow lines with empty amount', () => {
      const match = 'Source [] Target'.match(reFlowLine);
      expect(match).not.toBeNull();
      expect(match.groups.amount).toBe('');
    });

    it('should match flow lines with spaces in amounts', () => {
      const match = 'Source [1 000] Target'.match(reFlowLine);
      expect(match).not.toBeNull();
      expect(match.groups.amount).toBe('1 000');
    });

    it('should not match non-flow lines', () => {
      expect(':Node #fff'.match(reFlowLine)).toBeNull();
      expect('// comment'.match(reFlowLine)).toBeNull();
      expect('size w 600'.match(reFlowLine)).toBeNull();
    });
  });
});

describe('Node Line Parsing', () => {
  describe('reNodeLineLoose regex', () => {
    it('should match node with color', () => {
      const match = ':Budget #057'.match(reNodeLineLoose);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('Budget');
      expect(match[2]).toBe('057');
    });

    it('should match node with full color', () => {
      const match = ':MyNode #aabbcc'.match(reNodeLineLoose);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('MyNode');
      expect(match[2]).toBe('aabbcc');
    });

    it('should match node with color and opacity', () => {
      const match = ':MyNode #abc.75'.match(reNodeLineLoose);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('MyNode');
      expect(match[2]).toBe('abc');
      expect(match[3]).toBe('.75');
    });

    it('should match node with paint direction <<', () => {
      const match = ':MyNode #fff <<'.match(reNodeLineLoose);
      expect(match).not.toBeNull();
      expect(match[4]).toBe('<<');
    });

    it('should match node with paint direction >>', () => {
      const match = ':MyNode #fff >>'.match(reNodeLineLoose);
      expect(match).not.toBeNull();
      expect(match[4]).toBe('>>');
    });
  });

  describe('reNodeLineStrict regex', () => {
    it('should match simple node declaration', () => {
      const match = 'node MyNode'.match(reNodeLineStrict);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('MyNode');
    });

    it('should be case insensitive', () => {
      expect('NODE MyNode'.match(reNodeLineStrict)).not.toBeNull();
      expect('Node MyNode'.match(reNodeLineStrict)).not.toBeNull();
    });

    it('should not match node names with spaces', () => {
      expect('node My Node'.match(reNodeLineStrict)).toBeNull();
    });

    it('should not match node names with dots', () => {
      expect('node My.Node'.match(reNodeLineStrict)).toBeNull();
    });
  });
});

describe('Comment Line Detection', () => {
  describe('reCommentLine regex', () => {
    it('should match // comments', () => {
      expect(reCommentLine.test('// This is a comment')).toBe(true);
      expect(reCommentLine.test('//')).toBe(true);
    });

    it("should match ' comments", () => {
      expect(reCommentLine.test("' This is a comment")).toBe(true);
      expect(reCommentLine.test("'")).toBe(true);
    });

    it('should not match regular lines', () => {
      expect(reCommentLine.test('Source [100] Target')).toBe(false);
      expect(reCommentLine.test(':Node #fff')).toBe(false);
    });
  });
});

describe('Settings Line Parsing', () => {
  describe('reSettingsValue regex', () => {
    it('should match simple settings', () => {
      const match = 'size w 600'.match(reSettingsValue);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('size w');
      expect(match[2]).toBe('600');
    });

    it('should match color settings', () => {
      const match = 'bg color #ffffff'.match(reSettingsValue);
      expect(match).not.toBeNull();
      expect(match[2]).toBe('#ffffff');
    });

    it('should match single-word settings', () => {
      const match = 'opacity 0.5'.match(reSettingsValue);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('opacity');
      expect(match[2]).toBe('0.5');
    });
  });

  describe('reSettingsText regex', () => {
    it('should match text settings with quotes', () => {
      const match = "value prefix '$'".match(reSettingsText);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('value prefix');
      expect(match[2]).toBe('$');
    });

    it('should match empty quoted strings', () => {
      const match = "value suffix ''".match(reSettingsText);
      expect(match).not.toBeNull();
      expect(match[2]).toBe('');
    });
  });
});

describe('Move Line Parsing', () => {
  describe('reMoveLine regex', () => {
    it('should match move lines', () => {
      const match = 'move MyNode 0.5, 0.3'.match(reMoveLine);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('MyNode');
      expect(match[2]).toBe('0.5');
      expect(match[3]).toBe('0.3');
    });

    it('should match negative moves', () => {
      const match = 'move MyNode -0.5, -0.3'.match(reMoveLine);
      expect(match).not.toBeNull();
      expect(match[2]).toBe('-0.5');
      expect(match[3]).toBe('-0.3');
    });

    it('should match integer moves', () => {
      const match = 'move MyNode 1, 0'.match(reMoveLine);
      expect(match).not.toBeNull();
      expect(match[2]).toBe('1');
      expect(match[3]).toBe('0');
    });
  });
});

describe('Color and Opacity Parsing', () => {
  describe('reColorPlusOpacity regex', () => {
    it('should match color only', () => {
      const match = '#fff'.match(reColorPlusOpacity);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('fff');
      expect(match[2]).toBeUndefined();
    });

    it('should match color with opacity', () => {
      const match = '#fff.5'.match(reColorPlusOpacity);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('fff');
      expect(match[2]).toBe('.5');
    });

    it('should match opacity only', () => {
      const match = '#.75'.match(reColorPlusOpacity);
      expect(match).not.toBeNull();
      expect(match[1]).toBeUndefined();
      expect(match[2]).toBe('.75');
    });

    it('should match 6-digit colors', () => {
      const match = '#aabbcc'.match(reColorPlusOpacity);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('aabbcc');
    });
  });

  describe('reFlowTargetWithSuffix regex', () => {
    it('should extract target name and color suffix', () => {
      const match = 'My Target #fff'.match(reFlowTargetWithSuffix);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('My Target');
      expect(match[2]).toBe('#fff');
    });

    it('should extract target name and color+opacity', () => {
      const match = 'Target Node #abc.5'.match(reFlowTargetWithSuffix);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('Target Node');
      expect(match[2]).toBe('#abc.5');
    });
  });
});
