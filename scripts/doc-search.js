#!/usr/bin/env node

/**
 * Documentation Search Index Generator
 *
 * Creates a searchable index from TypeDoc JSON output
 * Generates both JSON and Lunr.js compatible formats
 */

const fs = require('fs');
const path = require('path');

const TYPEDOC_JSON_PATH = 'docs/api.json';
const SEARCH_INDEX_PATH = 'docs/search-index.json';
const SEARCH_INDEX_JS_PATH = 'docs/search-index.js';

function loadTypeDocJson() {
  if (!fs.existsSync(TYPEDOC_JSON_PATH)) {
    throw new Error(`TypeDoc JSON not found at ${TYPEDOC_JSON_PATH}. Run 'pnpm docs:coverage' first.`);
  }

  return JSON.parse(fs.readFileSync(TYPEDOC_JSON_PATH, 'utf8'));
}

function extractSearchableContent(symbol, basePath = '') {
  const content = {
    id: symbol.id,
    name: symbol.name,
    kind: symbol.kind,
    kindString: symbol.kindString,
    path: basePath,
    url: symbol.url || '',
    summary: '',
    description: '',
    examples: [],
    parameters: [],
    returns: '',
    throws: [],
    since: '',
    deprecated: false,
    tags: [],
    package: '',
    module: ''
  };

  // Extract package and module info
  if (symbol.sources && symbol.sources.length > 0) {
    const source = symbol.sources[0];
    const filePath = source.fileName;

    // Extract package name from path
    const packageMatch = filePath.match(/packages\/([^/]+)/);
    if (packageMatch) {
      content.package = packageMatch[1];
    }

    // Extract module name
    const moduleMatch = filePath.match(/packages\/[^/]+\/src\/([^/]+)/);
    if (moduleMatch) {
      content.module = moduleMatch[1];
    }
  }

  // Extract comment content
  if (symbol.comment) {
    if (symbol.comment.summary && symbol.comment.summary.length > 0) {
      content.summary = symbol.comment.summary
        .map(item => item.kind === 'text' ? item.text : '')
        .join('')
        .trim();
    }

    if (symbol.comment.description && symbol.comment.description.length > 0) {
      content.description = symbol.comment.description
        .map(item => item.kind === 'text' ? item.text : '')
        .join('')
        .trim();
    }

    // Extract examples
    if (symbol.comment.tags) {
      symbol.comment.tags.forEach(tag => {
        if (tag.tag === 'example' && tag.content) {
          const exampleText = tag.content
            .map(item => item.kind === 'text' ? item.text : '')
            .join('')
            .trim();
          if (exampleText) {
            content.examples.push(exampleText);
          }
        }

        if (tag.tag === 'since' && tag.content) {
          content.since = tag.content
            .map(item => item.kind === 'text' ? item.text : '')
            .join('')
            .trim();
        }

        if (tag.tag === 'deprecated') {
          content.deprecated = true;
        }

        if (tag.tag === 'throws' && tag.content) {
          const throwText = tag.content
            .map(item => item.kind === 'text' ? item.text : '')
            .join('')
            .trim();
          if (throwText) {
            content.throws.push(throwText);
          }
        }

        if (tag.tag === 'param' && tag.content) {
          const paramText = tag.content
            .map(item => item.kind === 'text' ? item.text : '')
            .join('')
            .trim();
          if (paramText) {
            content.parameters.push(paramText);
          }
        }

        if (tag.tag === 'returns' && tag.content) {
          content.returns = tag.content
            .map(item => item.kind === 'text' ? item.text : '')
            .join('')
            .trim();
        }
      });
    }
  }

  // Extract parameter information
  if (symbol.signatures && symbol.signatures.length > 0) {
    const signature = symbol.signatures[0];
    if (signature.parameters) {
      signature.parameters.forEach(param => {
        content.parameters.push(`${param.name}: ${param.type?.name || 'any'}`);
      });
    }
  }

  // Extract return type
  if (symbol.signatures && symbol.signatures.length > 0) {
    const signature = symbol.signatures[0];
    if (signature.type) {
      content.returns = signature.type.name || 'void';
    }
  }

  // Create searchable text
  const searchableText = [
    content.name,
    content.summary,
    content.description,
    ...content.examples,
    ...content.parameters,
    content.returns,
    ...content.throws,
    content.package,
    content.module,
    content.kindString
  ].filter(Boolean).join(' ');

  content.searchableText = searchableText;

  return content;
}

function buildSearchIndex(jsonData) {
  console.log('🔍 Building search index...');

  const searchIndex = {
    version: '1.0',
    generated: new Date().toISOString(),
    totalSymbols: 0,
    symbols: []
  };

  function processChildren(children, basePath = '') {
    if (!children) return;

    children.forEach(child => {
      // Skip internal/private symbols
      if (child.flags?.isPrivate || child.flags?.isInternal) {
        return;
      }

      // Skip test files
      if (child.sources && child.sources.some(source =>
        source.fileName.includes('.test.') ||
        source.fileName.includes('.spec.') ||
        source.fileName.includes('/test/') ||
        source.fileName.includes('/tests/')
      )) {
        return;
      }

      // Extract searchable content
      const searchableContent = extractSearchableContent(child, basePath);

      // Only include symbols with meaningful content
      if (searchableContent.name && searchableContent.searchableText) {
        searchIndex.symbols.push(searchableContent);
        searchIndex.totalSymbols++;
      }

      // Process children recursively
      if (child.children) {
        const childPath = basePath ? `${basePath}.${child.name}` : child.name;
        processChildren(child.children, childPath);
      }
    });
  }

  // Process all packages
  if (jsonData.children) {
    processChildren(jsonData.children);
  }

  console.log(`✅ Search index built with ${searchIndex.totalSymbols} symbols`);
  return searchIndex;
}

function generateLunrIndex(searchIndex) {
  console.log('🔍 Generating Lunr.js index...');

  const lunrIndex = {
    version: '1.0',
    generated: new Date().toISOString(),
    fields: [
      'name',
      'summary',
      'description',
      'searchableText',
      'package',
      'module',
      'kindString'
    ],
    symbols: searchIndex.symbols.map(symbol => ({
      id: symbol.id,
      name: symbol.name,
      summary: symbol.summary,
      description: symbol.description,
      searchableText: symbol.searchableText,
      package: symbol.package,
      module: symbol.module,
      kindString: symbol.kindString,
      url: symbol.url,
      kind: symbol.kind,
      deprecated: symbol.deprecated,
      since: symbol.since
    }))
  };

  return lunrIndex;
}

function writeSearchIndex(searchIndex) {
  console.log('💾 Writing search index...');

  // Write JSON index
  fs.writeFileSync(SEARCH_INDEX_PATH, JSON.stringify(searchIndex, null, 2));

  // Write JavaScript index for browser use
  const jsContent = `// AI-BOS Accounts API Documentation Search Index
// Generated: ${new Date().toISOString()}
// Total Symbols: ${searchIndex.totalSymbols}

window.AIBOS_DOCS_SEARCH_INDEX = ${JSON.stringify(searchIndex, null, 2)};

// Lunr.js compatible index
window.AIBOS_DOCS_LUNR_INDEX = ${JSON.stringify(generateLunrIndex(searchIndex), null, 2)};
`;

  fs.writeFileSync(SEARCH_INDEX_JS_PATH, jsContent);

  console.log(`✅ Search index written to ${SEARCH_INDEX_PATH}`);
  console.log(`✅ JavaScript index written to ${SEARCH_INDEX_JS_PATH}`);
}

function createSearchHTML() {
  console.log('🌐 Creating search HTML...');

  const searchHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-BOS Accounts API Documentation Search</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .search-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .search-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .search-input:focus {
            outline: none;
            border-color: #007bff;
        }
        .results {
            display: none;
        }
        .result-item {
            background: white;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: box-shadow 0.2s;
        }
        .result-item:hover {
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .result-name {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 4px;
        }
        .result-kind {
            font-size: 12px;
            color: #6c757d;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            display: inline-block;
            margin-bottom: 8px;
        }
        .result-summary {
            color: #495057;
            margin-bottom: 8px;
        }
        .result-package {
            font-size: 12px;
            color: #6c757d;
        }
        .no-results {
            text-align: center;
            color: #6c757d;
            padding: 40px;
        }
        .stats {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="search-container">
        <h1>🔍 AI-BOS Accounts API Documentation Search</h1>
        <div class="stats" id="stats">Loading search index...</div>
        <input type="text" class="search-input" id="searchInput" placeholder="Search for functions, classes, interfaces...">
        <div class="results" id="results"></div>
        <div class="no-results" id="noResults" style="display: none;">
            No results found. Try different keywords.
        </div>
    </div>

    <script src="search-index.js"></script>
    <script>
        let searchIndex = null;
        let lunrIndex = null;

        // Load search index
        if (window.AIBOS_DOCS_SEARCH_INDEX) {
            searchIndex = window.AIBOS_DOCS_SEARCH_INDEX;
            lunrIndex = window.AIBOS_DOCS_LUNR_INDEX;
            document.getElementById('stats').textContent = \`Search index loaded with \${searchIndex.totalSymbols} symbols\`;
        } else {
            document.getElementById('stats').textContent = 'Search index not found. Run "pnpm docs:search" first.';
        }

        // Search function
        function search(query) {
            if (!searchIndex || !query.trim()) {
                document.getElementById('results').style.display = 'none';
                document.getElementById('noResults').style.display = 'none';
                return;
            }

            const results = searchIndex.symbols.filter(symbol =>
                symbol.searchableText.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 20); // Limit to 20 results

            const resultsContainer = document.getElementById('results');
            const noResults = document.getElementById('noResults');

            if (results.length === 0) {
                resultsContainer.style.display = 'none';
                noResults.style.display = 'block';
                return;
            }

            resultsContainer.style.display = 'block';
            noResults.style.display = 'none';

            resultsContainer.innerHTML = results.map(symbol => \`
                <div class="result-item" onclick="window.open('\${symbol.url}', '_blank')">
                    <div class="result-name">\${symbol.name}</div>
                    <div class="result-kind">\${symbol.kindString}</div>
                    <div class="result-summary">\${symbol.summary || symbol.description || 'No description available'}</div>
                    <div class="result-package">\${symbol.package} • \${symbol.module}</div>
                </div>
            \`).join('');
        }

        // Event listener
        document.getElementById('searchInput').addEventListener('input', (e) => {
            search(e.target.value);
        });

        // Initial search
        const urlParams = new URLSearchParams(window.location.search);
        const initialQuery = urlParams.get('q');
        if (initialQuery) {
            document.getElementById('searchInput').value = initialQuery;
            search(initialQuery);
        }
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join('docs', 'search.html'), searchHTML);
  console.log('✅ Search HTML created at docs/search.html');
}

function main() {
  console.log('🔍 Documentation Search Index Generator');
  console.log('========================================');

  try {
    // Load TypeDoc JSON
    const jsonData = loadTypeDocJson();

    // Build search index
    const searchIndex = buildSearchIndex(jsonData);

    // Write search index
    writeSearchIndex(searchIndex);

    // Create search HTML
    createSearchHTML();

    console.log('\n✅ Search index generation completed!');
    console.log(`📁 JSON index: ${SEARCH_INDEX_PATH}`);
    console.log(`📁 JS index: ${SEARCH_INDEX_JS_PATH}`);
    console.log(`🌐 Search page: docs/search.html`);

  } catch (error) {
    console.error('❌ Search index generation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildSearchIndex, generateLunrIndex };
