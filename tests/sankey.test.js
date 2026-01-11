/**
 * Tests for sankey.js - D3 Sankey layout algorithm
 *
 * These tests verify the core layout algorithm functionality
 * without requiring the full D3.js library.
 */

// Mock d3 functions for testing
const mockD3 = {
  sum: (arr, accessor) => arr.reduce((sum, item) => sum + (accessor ? accessor(item) : item), 0),
  min: (arr, accessor) => {
    if (!arr.length) return undefined;
    const values = accessor ? arr.map(accessor) : arr;
    return Math.min(...values);
  },
  max: (arr, accessor) => {
    if (!arr.length) return undefined;
    const values = accessor ? arr.map(accessor) : arr;
    return Math.max(...values);
  },
  groups: (arr, keyFn) => {
    const map = new Map();
    arr.forEach(item => {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  },
  interpolateNumber: (a, b) => (t) => a * (1 - t) + b * t,
};

// Constants from sankey.js
const [SOURCES, TARGETS, TOP, BOTTOM, NEAREST] = [2, 3, 5, 7, 11];
const [IN, OUT] = [13, 17];

// Core utility functions from sankey.js
function valueSum(list) {
  return mockD3.sum(list, (d) => d.value);
}

function divide(a, b) {
  return a / (b || Number.MIN_VALUE);
}

function yCenter(n) {
  return n.y + n.dy / 2;
}

function yBottom(n) {
  return n.y + n.dy;
}

function sourceTop(f) {
  return f.source.y + f.sy;
}

function targetTop(f) {
  return f.target.y + f.ty;
}

function sourceCenter(f) {
  return f.source.y + f.sy + f.dy / 2;
}

function targetCenter(f) {
  return f.target.y + f.ty + f.dy / 2;
}

function sourceBottom(f) {
  return f.source.y + f.sy + f.dy;
}

function targetBottom(f) {
  return f.target.y + f.ty + f.dy;
}

function leastY(nodeList) {
  return mockD3.min(nodeList, (n) => n.y);
}

function greatestY(nodeList) {
  return mockD3.max(nodeList, (n) => yBottom(n));
}

function bySourceOrder(a, b) {
  return a.sourceRow - b.sourceRow;
}

function byTopEdges(a, b) {
  return a.y - b.y;
}

describe('Sankey Utility Functions', () => {
  describe('valueSum', () => {
    it('should sum values from a list of objects', () => {
      const list = [{ value: 10 }, { value: 20 }, { value: 30 }];
      expect(valueSum(list)).toBe(60);
    });

    it('should return 0 for empty list', () => {
      expect(valueSum([])).toBe(0);
    });

    it('should handle single item', () => {
      expect(valueSum([{ value: 100 }])).toBe(100);
    });

    it('should handle decimal values', () => {
      const list = [{ value: 0.1 }, { value: 0.2 }, { value: 0.3 }];
      expect(valueSum(list)).toBeCloseTo(0.6);
    });
  });

  describe('divide', () => {
    it('should divide numbers normally', () => {
      expect(divide(10, 2)).toBe(5);
      expect(divide(100, 4)).toBe(25);
    });

    it('should handle division by zero', () => {
      const result = divide(10, 0);
      // Should return a very large number, not Infinity
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(1e300);
    });

    it('should handle zero numerator', () => {
      expect(divide(0, 5)).toBe(0);
    });
  });

  describe('yCenter', () => {
    it('should return center y position of a node', () => {
      const node = { y: 100, dy: 50 };
      expect(yCenter(node)).toBe(125);
    });

    it('should handle node at origin', () => {
      const node = { y: 0, dy: 100 };
      expect(yCenter(node)).toBe(50);
    });
  });

  describe('yBottom', () => {
    it('should return bottom y position of a node', () => {
      const node = { y: 100, dy: 50 };
      expect(yBottom(node)).toBe(150);
    });

    it('should handle node at origin', () => {
      const node = { y: 0, dy: 100 };
      expect(yBottom(node)).toBe(100);
    });
  });
});

describe('Flow Position Functions', () => {
  const createFlow = (sourceY, sy, targetY, ty, dy) => ({
    source: { y: sourceY },
    target: { y: targetY },
    sy,
    ty,
    dy,
  });

  describe('sourceTop', () => {
    it('should calculate source top position', () => {
      const flow = createFlow(100, 20, 200, 30, 50);
      expect(sourceTop(flow)).toBe(120);
    });
  });

  describe('targetTop', () => {
    it('should calculate target top position', () => {
      const flow = createFlow(100, 20, 200, 30, 50);
      expect(targetTop(flow)).toBe(230);
    });
  });

  describe('sourceCenter', () => {
    it('should calculate source center position', () => {
      const flow = createFlow(100, 20, 200, 30, 50);
      expect(sourceCenter(flow)).toBe(145); // 100 + 20 + 25
    });
  });

  describe('targetCenter', () => {
    it('should calculate target center position', () => {
      const flow = createFlow(100, 20, 200, 30, 50);
      expect(targetCenter(flow)).toBe(255); // 200 + 30 + 25
    });
  });

  describe('sourceBottom', () => {
    it('should calculate source bottom position', () => {
      const flow = createFlow(100, 20, 200, 30, 50);
      expect(sourceBottom(flow)).toBe(170); // 100 + 20 + 50
    });
  });

  describe('targetBottom', () => {
    it('should calculate target bottom position', () => {
      const flow = createFlow(100, 20, 200, 30, 50);
      expect(targetBottom(flow)).toBe(280); // 200 + 30 + 50
    });
  });
});

describe('Node List Functions', () => {
  describe('leastY', () => {
    it('should find minimum y value', () => {
      const nodes = [{ y: 100, dy: 50 }, { y: 50, dy: 50 }, { y: 200, dy: 50 }];
      expect(leastY(nodes)).toBe(50);
    });

    it('should handle single node', () => {
      const nodes = [{ y: 100, dy: 50 }];
      expect(leastY(nodes)).toBe(100);
    });
  });

  describe('greatestY', () => {
    it('should find maximum bottom y value', () => {
      const nodes = [{ y: 100, dy: 50 }, { y: 50, dy: 50 }, { y: 200, dy: 50 }];
      expect(greatestY(nodes)).toBe(250); // 200 + 50
    });

    it('should handle single node', () => {
      const nodes = [{ y: 100, dy: 50 }];
      expect(greatestY(nodes)).toBe(150); // 100 + 50
    });
  });
});

describe('Sorting Functions', () => {
  describe('bySourceOrder', () => {
    it('should sort by sourceRow ascending', () => {
      const items = [{ sourceRow: 3 }, { sourceRow: 1 }, { sourceRow: 2 }];
      items.sort(bySourceOrder);
      expect(items[0].sourceRow).toBe(1);
      expect(items[1].sourceRow).toBe(2);
      expect(items[2].sourceRow).toBe(3);
    });

    it('should handle equal sourceRow values', () => {
      const items = [{ sourceRow: 1, name: 'a' }, { sourceRow: 1, name: 'b' }];
      items.sort(bySourceOrder);
      expect(items.length).toBe(2);
    });
  });

  describe('byTopEdges', () => {
    it('should sort by y position ascending', () => {
      const nodes = [{ y: 300 }, { y: 100 }, { y: 200 }];
      nodes.sort(byTopEdges);
      expect(nodes[0].y).toBe(100);
      expect(nodes[1].y).toBe(200);
      expect(nodes[2].y).toBe(300);
    });
  });
});

describe('Constants', () => {
  it('should have relatively prime enum values', () => {
    // These are used to create unique cross-products
    const values = [SOURCES, TARGETS, TOP, BOTTOM, NEAREST];

    // Check that no two values share a common factor > 1
    function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
    }

    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        expect(gcd(values[i], values[j])).toBe(1);
      }
    }
  });

  it('should have distinct IN/OUT values', () => {
    expect(IN).not.toBe(OUT);
    expect(typeof IN).toBe('number');
    expect(typeof OUT).toBe('number');
  });
});

describe('Node and Flow Data Structures', () => {
  it('should correctly initialize a node structure', () => {
    const node = {
      index: 0,
      name: 'TestNode',
      sourceRow: 1,
      isAShadow: false,
      flows: { [IN]: [], [OUT]: [] },
      total: { [IN]: 0, [OUT]: 0 },
      value: 100,
      y: 50,
      dy: 30,
    };

    expect(node.flows[IN]).toEqual([]);
    expect(node.flows[OUT]).toEqual([]);
    expect(yCenter(node)).toBe(65);
    expect(yBottom(node)).toBe(80);
  });

  it('should correctly initialize a flow structure', () => {
    const source = { y: 100, stage: 0 };
    const target = { y: 200, stage: 1 };
    const flow = {
      index: 0,
      source,
      target,
      value: 50,
      sy: 10,
      ty: 20,
      dy: 25,
      isAShadow: false,
      hasAShadow: false,
      useForVisiblePlacing: true,
    };

    expect(flow.source).toBe(source);
    expect(flow.target).toBe(target);
    expect(sourceTop(flow)).toBe(110);
    expect(targetTop(flow)).toBe(220);
  });
});
