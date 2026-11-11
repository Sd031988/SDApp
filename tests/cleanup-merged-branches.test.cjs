'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const cleanup = require('../scripts/cleanup-merged-branches-2026-11-11.cjs');
function fixture(dryRun) {
  const deleted = [], compared = [];
  const names = ['main', 'protected', 'open', 'new-pr', 'changed', 'merged', 'squashed', 'identical', 'bad-base'];
  const branches = names.map(name => ({ name, protected: name === 'protected', commit: { sha: name + '-sha' } }));
  const repos = {
    get: async () => ({ data: { default_branch: 'main' } }),
    listBranches: Symbol('branches'),
    getBranch: async ({ branch }) => ({ data: { name: branch, protected: false, commit: { sha: branch === 'changed' ? 'new-sha' : branch + '-sha' } } }),
    compareCommitsWithBasehead: async ({ basehead }) => {
      const name = basehead.split('-sha')[0]; compared.push(name);
      return { data: { status: name === 'squashed' ? 'diverged' : name === 'identical' ? 'identical' : 'ahead',
        behind_by: name === 'squashed' ? 2 : 0, merge_base_commit: { sha: name === 'bad-base' ? 'other' : name + '-sha' } } };
    }
  };
  const pulls = { list: Symbol('pulls') };
  const github = { rest: { repos, pulls, git: { deleteRef: async ({ ref }) => deleted.push(ref) } },
    paginate: async (method, args) => method === repos.listBranches ? branches : args.base ? [] : args.head
      ? (args.head.endsWith(':new-pr') ? [{}] : [])
      : [{ head: { ref: 'open', repo: { full_name: 'Sd031988/SDApp' } } }]
  };
  const summary = { addHeading() { return this; }, addRaw() { return this; }, addCodeBlock() { return this; }, async write() {} };
  return { args: { github, context: { repo: { owner: 'Sd031988', repo: 'SDApp' } }, core: { info() {}, summary, setFailed(message) { throw Error(message); } }, dryRun }, deleted, compared };
}
test('dry run makes no deletions and proves exact commit containment', async () => {
  const f = fixture(true), result = await cleanup(f.args);
  assert.deepEqual(f.deleted, []);
  assert.deepEqual(result.eligible.map(x => x.name), ['merged', 'identical']);
  for (const name of ['main', 'protected', 'open', 'new-pr', 'changed']) assert(!f.compared.includes(name));
  assert(result.skipped.some(x => x.name === 'squashed'));
  assert(result.skipped.some(x => x.name === 'bad-base'));
});
test('deletion respects open PRs, changed heads, protected branches and squash ancestry', async () => {
  const f = fixture(false), result = await cleanup(f.args);
  assert.deepEqual(f.deleted, ['heads/merged', 'heads/identical']);
  assert.deepEqual(result.deleted, ['merged', 'identical']);
});
test('unexpected repository aborts before deletion', async () => {
  const f = fixture(false); f.args.context.repo.repo = 'other';
  await assert.rejects(cleanup(f.args), /Unexpected repository/); assert.deepEqual(f.deleted, []);
});

test('head moved immediately before deletion is retained', async () => {
  const f = fixture(false), original = f.args.github.rest.repos.getBranch; let reads = 0;
  f.args.github.rest.repos.getBranch = async args => args.branch === 'merged' && ++reads === 2
    ? { data: { protected: false, commit: { sha: 'moved-head' } } } : original(args);
  const result = await cleanup(f.args);
  assert(!result.deleted.includes('merged')); assert(!f.deleted.includes('heads/merged'));
});
test('branch serving as base of an open PR is retained', async () => {
  const f = fixture(false), original = f.args.github.paginate;
  f.args.github.paginate = async (method, args) => args.base === 'merged' ? [{}] : original(method, args);
  const result = await cleanup(f.args);
  assert(!result.deleted.includes('merged'));
});
