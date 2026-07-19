/* ============================================================
   GitHub repo stats for .ghbtn elements
   - one request per unique repo
   - localStorage cache (30 min TTL) to stay under the
     unauthenticated GitHub API rate limit (60 req/hour/IP)
   - on API failure, falls back to stale cache; otherwise the
     placeholder " ..." remains (layout is unaffected)
   ============================================================ */

function initGitHubButtons() {
  var CACHE_KEY = 'gh_repo_stats_v1';
  var TTL = 30 * 60 * 1000; // 30 minutes

  var repos = [];
  $('.ghbtn').each(function () {
    var user = $(this).attr('user');
    var repo = $(this).attr('repo');
    if (user && repo && repos.indexOf(user + '/' + repo) === -1) {
      repos.push(user + '/' + repo);
    }
  });

  var cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch (e) { /* ignore */ }

  function apply(full, d) {
    var name = full.split('/')[1];
    var $el = $("div[repo='" + name + "']");
    $el.find("span.star").html("&nbsp;" + d.stargazers_count);
    $el.find("span.fork").html("&nbsp;" + d.forks_count);
    // watchers_count mirrors stargazers on the REST API; subscribers is the real watch count
    $el.find("span.watchers").html("&nbsp;" + (d.subscribers_count != null ? d.subscribers_count : d.watchers_count));
  }

  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* ignore */ }
  }

  repos.forEach(function (full) {
    var cached = cache[full];
    var fresh = cached && (Date.now() - cached.t) < TTL;

    if (fresh) {
      apply(full, cached.d);
      return;
    }

    $.ajax({
      type: 'GET',
      url: 'https://api.github.com/repos/' + full,
      dataType: 'json',
      success: function (d) {
        cache[full] = {
          t: Date.now(),
          d: {
            stargazers_count: d.stargazers_count,
            forks_count: d.forks_count,
            watchers_count: d.watchers_count,
            subscribers_count: d.subscribers_count
          }
        };
        saveCache();
        apply(full, cache[full].d);
      },
      error: function () {
        // rate-limited or offline: show stale data if we have any
        if (cached) apply(full, cached.d);
      }
    });
  });
}

$(document).ready(function () {
  initGitHubButtons();
});
