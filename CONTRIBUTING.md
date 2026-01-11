# Contributing to SankeyMATIC

Thank you for your interest in contributing to SankeyMATIC! This document provides guidelines and information for contributors.

## Project Structure

```
/home/user/Sankey/
├── build/
│   ├── index.html          # Main UI structure
│   ├── build.css           # Styling
│   ├── sankeymatic.js      # Main application logic
│   ├── sankey.js           # D3 Sankey layout algorithm
│   ├── constants.js        # Configuration and validation rules
│   └── lz-string.min.js    # URL compression library
├── tests/                   # Unit tests
│   ├── constants.test.js   # Tests for validation rules
│   ├── sankey.test.js      # Tests for layout algorithm
│   └── sankeymatic.test.js # Tests for input parsing
├── package.json            # npm configuration
├── jest.config.js          # Test configuration
└── Dockerfile              # Container configuration
```

## Architecture Overview

### Core Modules

1. **constants.js** - Configuration, validation rules, sample diagrams
   - `skmSettings`: Map of all configurable settings with types and constraints
   - Regular expressions for parsing input
   - Sample diagram recipes

2. **sankey.js** - D3-based Sankey layout algorithm
   - Computes node positions (stages) based on graph structure
   - Calculates node heights proportional to flow values
   - Uses iterative relaxation to minimize flow crossings
   - See the file header for detailed algorithm documentation

3. **sankeymatic.js** - Main application logic
   - Input parsing and validation
   - Settings management
   - Diagram rendering with D3
   - Export functionality (PNG, SVG)
   - User interaction handling

### Data Flow

1. User enters flows in textarea (e.g., `Source [100] Target`)
2. `process_sankey()` parses input lines
3. Settings are validated and applied
4. Sankey layout calculates positions
5. D3 renders the SVG diagram
6. Export functions convert to PNG/SVG

## Development Guidelines

### Code Style

- Use ES2020+ features (const/let, arrow functions, template literals)
- Follow existing naming conventions:
  - camelCase for functions and variables
  - UPPER_CASE for constants
  - snake_case for some configuration keys (legacy)
- Add JSDoc comments for public functions
- Use `escapeHTML()` for any user-provided content in HTML

### Testing

Run tests with:
```bash
npm install
npm test
```

Add tests for:
- New parsing patterns
- Validation rules
- Layout algorithm changes

### Security Considerations

- Always escape user input with `escapeHTML()` before rendering
- Use `textContent` instead of `innerHTML` when possible
- Validate all settings before applying

### Accessibility

- Add `aria-label` to interactive elements
- Use `aria-live` for dynamic content updates
- Ensure keyboard navigation works
- Maintain color contrast ratios

## Making Changes

1. Create a feature branch
2. Make your changes
3. Add/update tests as needed
4. Ensure all tests pass
5. Submit a pull request

## Common Tasks

### Adding a New Setting

1. Add to `skmSettings` Map in constants.js
2. Add validation in `settingIsValid()` if needed
3. Add HTML controls in index.html
4. Handle in `process_sankey()` if needed
5. Add tests in constants.test.js

### Modifying Input Parsing

1. Update regex patterns in constants.js
2. Update parsing logic in `process_sankey()`
3. Add tests in sankeymatic.test.js

### Changing the Layout Algorithm

1. Modify sankey.js
2. Update documentation header
3. Add tests in sankey.test.js

## Questions?

Open an issue on GitHub for questions or bug reports.
