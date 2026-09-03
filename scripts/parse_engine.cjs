#!/usr/bin/env node
'use strict';

// Same source scope as render_parallel.sh's existing syntax-only esbuild loop.
// One Node invocation and one installed esbuild service; transformed code stays
// in memory. This helper does not bundle, typecheck, or change render receipts.
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {performance} = require('node:perf_hooks');

const repo = path.resolve(__dirname, '..');
const engine = path.join(repo, 'video-engine');

function collectSources(engineDir = engine) {
  function matching(directory, extension) {
    try {
      return fs.readdirSync(directory).filter(name => name.endsWith(extension))
        .sort().map(name => path.join(directory, name));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }
  const src = path.join(engineDir, 'src');
  return [...matching(src, '.tsx'), ...matching(src, '.ts'),
    ...matching(path.join(src, 'lib'), '.tsx')];
}

async function parseFiles(files, esbuild) {
  const failures = [];
  for (const file of files) {
    const extension = path.extname(file);
    try {
      if (extension !== '.ts' && extension !== '.tsx') {
        throw new Error(`unsupported source extension ${extension || '(none)'}`);
      }
      await esbuild.transform(fs.readFileSync(file, 'utf8'), {
        sourcefile: file,
        loader: extension.slice(1),
        logLevel: 'silent',
      });
    } catch (error) {
      const detail = error.errors?.length
        ? (await esbuild.formatMessages(error.errors, {kind: 'error', color: false})).join('\n')
        : error.message;
      failures.push({file, detail});
    }
  }
  return failures;
}

async function main(args = process.argv.slice(2)) {
  const started = performance.now();
  let esbuild;
  try {
    // Resolve only the already-installed engine dependency. Never invoke npx or
    // install anything, including when called from another working directory.
    esbuild = createRequire(path.join(engine, 'package.json'))('esbuild');
    const files = args.length ? args.map(file => path.resolve(file)) : collectSources();
    if (!files.length) throw new Error('ZERO TS/TSX sources found; nothing was checked');
    const failures = await parseFiles(files, esbuild);
    for (const failure of failures) {
      console.error(`FAIL ${failure.file}\n${failure.detail}`);
    }
    const elapsed = ((performance.now() - started) / 1000).toFixed(3);
    console.log(`parse_engine: ${files.length} source file(s), ${failures.length} failure(s), ` +
      `${elapsed}s (syntax only; no files written)`);
    return failures.length ? 1 : 0;
  } catch (error) {
    console.error(`parse_engine: ${error.message}`);
    return 2;
  } finally {
    await esbuild?.stop();
  }
}

module.exports = {collectSources, parseFiles, main};
if (require.main === module) main().then(code => { process.exitCode = code; });
