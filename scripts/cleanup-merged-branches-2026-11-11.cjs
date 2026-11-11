'use strict';
// One-time cleanup. Never delete by PR merge state: squash merges do not prove ancestry.
module.exports = async function cleanup({ github, context, core, dryRun = true }) {
  const { owner, repo } = context.repo;
  if (owner !== 'Sd031988' || repo !== 'SDApp') throw new Error('Unexpected repository');
  const api = github.rest;
  const { data: metadata } = await api.repos.get({ owner, repo });
  if (metadata.default_branch !== 'main') throw new Error('Unexpected default branch');
  const branches = await github.paginate(api.repos.listBranches, { owner, repo, per_page: 100 });
  const open = await github.paginate(api.pulls.list, { owner, repo, state: 'open', per_page: 100 });
  const protectedHeads = new Set(open.flatMap(p => [p.head, p.base].filter(ref => ref?.repo?.full_name === owner + '/' + repo).map(ref => ref.ref)));
  const result = { dryRun, deleted: [], eligible: [], skipped: [], failed: [] };
  const skip = (name, reason) => result.skipped.push({ name, reason });
  for (const branch of branches) {
    const name = branch.name;
    if (name === 'main' || branch.protected || protectedHeads.has(name)) { skip(name, 'main, protected or open PR'); continue; }
    try {
      // Recheck both the branch head and open PRs immediately before comparing.
      const { data: current } = await api.repos.getBranch({ owner, repo, branch: name });
      if (current.protected || current.commit.sha !== branch.commit.sha) { skip(name, 'protected or changed during audit'); continue; }
      const prs = await github.paginate(api.pulls.list, { owner, repo, state: 'open', head: owner + ':' + name, per_page: 100 });
      const basePrs = await github.paginate(api.pulls.list, { owner, repo, state: 'open', base: name, per_page: 100 });
      if (prs.length || basePrs.length) { skip(name, 'open PR'); continue; }
      const { data: main } = await api.repos.getBranch({ owner, repo, branch: 'main' });
      const { data: comparison } = await api.repos.compareCommitsWithBasehead({
        owner, repo, basehead: current.commit.sha + '...' + main.commit.sha, per_page: 1
      });
      const contained = ['ahead', 'identical'].includes(comparison.status) &&
        comparison.behind_by === 0 && comparison.merge_base_commit?.sha === current.commit.sha;
      if (!contained) { skip(name, 'not fully contained in main'); continue; }
      result.eligible.push({ name, sha: current.commit.sha, main: main.commit.sha });
      if (!dryRun) {
        const [{ data: finalHead }, finalPrs, finalBasePrs] = await Promise.all([
          api.repos.getBranch({ owner, repo, branch: name }),
          github.paginate(api.pulls.list, { owner, repo, state: 'open', head: owner + ':' + name, per_page: 100 }),
          github.paginate(api.pulls.list, { owner, repo, state: 'open', base: name, per_page: 100 })
        ]);
        if (finalHead.protected || finalHead.commit.sha !== current.commit.sha || finalPrs.length || finalBasePrs.length) {
          skip(name, 'changed, protected or open PR before deletion'); continue;
        }
        await api.git.deleteRef({ owner, repo, ref: 'heads/' + name });
        result.deleted.push(name);
      }
    } catch (error) {
      result.failed.push({ name, message: String(error.message) });
    }
  }
  core.info(JSON.stringify(result, null, 2));
  await core.summary.addHeading(dryRun ? 'Branch cleanup: dry run' : 'Branch cleanup: deletion report')
    .addRaw('Deleted: ' + result.deleted.length + '; eligible: ' + result.eligible.length + '; failed: ' + result.failed.length + '\n')
    .addCodeBlock(JSON.stringify(result, null, 2), 'json').write();
  if (result.failed.length) core.setFailed('Some branches could not be checked or deleted; inspect the report.');
  return result;
};
