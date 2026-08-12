/* QA Interview Prep — standalone app logic.
   Reads window.__ROUNDS__ (injected by scripts/build-standalone.mjs).
   No dependencies, no network. */
(function () {
  "use strict";

  var ROUNDS = window.__ROUNDS__ || [];
  var ALL = ROUNDS.reduce(function (acc, r) {
    return acc.concat(
      r.questions.map(function (q) {
        return { q: q, round: r };
      })
    );
  }, []);

  var LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
  var DIFF_LABEL = { easy: "Easy", mid: "Medium", hard: "Hard" };
  var DIFFS = ["all", "easy", "mid", "hard"];

  /* ------------------------------------------------------------- storage */

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem("qa-prep:" + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem("qa-prep:" + key, JSON.stringify(value));
    } catch (e) {
      /* private mode — state still lives in memory */
    }
  }

  var state = {
    round: load("round", ROUNDS[0] && ROUNDS[0].id),
    known: new Set(load("known", [])),
    open: new Set(load("open", [])),
    query: "",
    diff: "all",
    hideKnown: false,
    night: load("night", false),
  };

  function persistSets() {
    save("known", Array.from(state.known));
    save("open", Array.from(state.open));
  }

  /* --------------------------------------------------------------- utils */

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function plain(q) {
    var sol = (q.solution || [])
      .map(function (s) {
        return s.src;
      })
      .join(" ");
    return (
      q.q +
      " " +
      (q.tags || []).join(" ") +
      " " +
      (q.prompt ? q.prompt.src : "") +
      " " +
      q.answer.replace(/<[^>]+>/g, " ") +
      " " +
      sol
    ).toLowerCase();
  }

  ALL.forEach(function (item) {
    item.text = plain(item.q);
  });

  function roundById(id) {
    for (var i = 0; i < ROUNDS.length; i++) {
      if (ROUNDS[i].id === id) return ROUNDS[i];
    }
    return ROUNDS[0];
  }

  function visible() {
    var q = state.query.trim().toLowerCase();
    var pool = q
      ? ALL
      : ALL.filter(function (it) {
          return it.round.id === state.round;
        });

    return pool.filter(function (it) {
      if (state.diff !== "all" && it.q.diff !== state.diff) return false;
      if (state.hideKnown && state.known.has(it.q.id)) return false;
      if (q && it.text.indexOf(q) === -1) return false;
      return true;
    });
  }

  /* ------------------------------------------------------------ rendering */

  function figure(block, kind) {
    return (
      '<figure class="fig">' +
      '<figcaption class="fig-cap">' +
      '<span class="label">' +
      esc(block.lang) +
      "</span>" +
      (block.caption ? '<span class="note">' + esc(block.caption) + "</span>" : "") +
      '<button class="copy" data-copy="' +
      esc(block.src) +
      '">' +
      (kind === "prompt" ? "copy" : "copy") +
      "</button>" +
      "</figcaption>" +
      "<pre><code>" +
      esc(block.src) +
      "</code></pre>" +
      "</figure>"
    );
  }

  function dataTable(t) {
    return (
      '<figure class="fig">' +
      (t.caption
        ? '<figcaption class="fig-cap"><span class="note">' +
          esc(t.caption) +
          "</span></figcaption>"
        : "") +
      '<div class="scroll"><table class="data"><thead><tr>' +
      t.columns
        .map(function (c) {
          return "<th>" + esc(c) + "</th>";
        })
        .join("") +
      "</tr></thead><tbody>" +
      t.rows
        .map(function (row) {
          return (
            "<tr>" +
            row
              .map(function (cell) {
                return "<td>" + esc(cell) + "</td>";
              })
              .join("") +
            "</tr>"
          );
        })
        .join("") +
      "</tbody></table></div></figure>"
    );
  }

  function entryHtml(item, n, showRound) {
    var q = item.q;
    var isOpen = state.open.has(q.id);
    var isKnown = state.known.has(q.id);
    var tags = (q.tags || [])
      .map(function (t) {
        return "<span>" + esc(t) + "</span>";
      })
      .join("");

    var body = "";
    if (isOpen) {
      body =
        '<div class="entry-body">' +
        (q.table ? dataTable(q.table) : "") +
        (q.prompt ? figure(q.prompt, "prompt") : "") +
        '<div class="prose">' +
        q.answer +
        "</div>" +
        (q.solution || [])
          .map(function (b) {
            return figure(b, "solution");
          })
          .join("") +
        "</div>" +
        '<div class="entry-foot">' +
        '<button class="mark' +
        (isKnown ? " is-on" : "") +
        '" data-mark="' +
        q.id +
        '">' +
        (isKnown ? "✓ known" : "mark as known") +
        "</button>" +
        "</div>";
    }

    return (
      '<li class="entry' +
      (isKnown ? " is-known" : "") +
      '" id="q-' +
      q.id +
      '">' +
      (showRound
        ? '<p class="result-of">' + esc(item.round.label) + "</p>"
        : "") +
      '<button class="entry-head" data-open="' +
      q.id +
      '" aria-expanded="' +
      isOpen +
      '">' +
      '<span class="entry-num">' +
      n +
      ".</span>" +
      '<span class="entry-main">' +
      '<span class="entry-q">' +
      esc(q.q) +
      "</span>" +
      '<span class="entry-meta">' +
      '<span class="diff diff-' +
      q.diff +
      '">' +
      DIFF_LABEL[q.diff] +
      "</span>" +
      tags +
      (isKnown ? "<span>✓ known</span>" : "") +
      '<span class="entry-cue">' +
      (isOpen ? "hide answer" : "answer it out loud first, then reveal") +
      "</span>" +
      "</span>" +
      "</span>" +
      "</button>" +
      body +
      "</li>"
    );
  }

  function renderContents() {
    var el = document.getElementById("toc");
    el.innerHTML = ROUNDS.map(function (r, i) {
      var done = r.questions.filter(function (q) {
        return state.known.has(q.id);
      }).length;
      var pct = Math.round((done / r.questions.length) * 100);
      var name = r.label.replace(/^Round [A-Z]\s*—\s*/, "");
      return (
        "<li>" +
        '<button class="toc-item" data-round="' +
        r.id +
        '" aria-current="' +
        (r.id === state.round && !state.query.trim()) +
        '">' +
        '<span class="toc-line">' +
        '<span class="toc-letter">' +
        LETTERS[i] +
        "</span>" +
        '<span class="toc-name">' +
        esc(name) +
        "</span>" +
        '<span class="toc-count">' +
        done +
        "/" +
        r.questions.length +
        "</span>" +
        "</span>" +
        '<span class="toc-rule"><span style="width:' +
        pct +
        '%"></span></span>' +
        "</button>" +
        "</li>"
      );
    }).join("");

    document.getElementById("tally").innerHTML =
      "<b>" +
      state.known.size +
      "</b> of <b>" +
      ALL.length +
      "</b> marked known" +
      (state.known.size
        ? ' &middot; <button id="reset">reset</button>'
        : "");
  }

  function renderMain() {
    var searching = state.query.trim().length > 0;
    var items = visible();
    var round = roundById(state.round);
    var head = document.getElementById("round-head");
    var list = document.getElementById("entries");

    if (searching) {
      head.innerHTML =
        '<span class="kicker">Search</span>' +
        "<h2>“" +
        esc(state.query.trim()) +
        "”</h2>" +
        "<p>" +
        items.length +
        (items.length === 1 ? " question" : " questions") +
        " across all four rounds.</p>";
    } else {
      var i = ROUNDS.indexOf(round);
      head.innerHTML =
        '<span class="kicker">Round ' +
        LETTERS[i] +
        " &middot; " +
        round.questions.length +
        " questions</span>" +
        "<h2>" +
        esc(round.label.replace(/^Round [A-Z]\s*—\s*/, "")) +
        "</h2>" +
        "<p>" +
        esc(round.desc) +
        "</p>";
    }

    if (!items.length) {
      list.innerHTML =
        '<li class="empty">Nothing here under those filters. Clear the search, or set difficulty back to all.</li>';
      return;
    }

    list.innerHTML = items
      .map(function (item, n) {
        return entryHtml(item, n + 1, searching);
      })
      .join("");
  }

  function render() {
    renderContents();
    renderMain();
    DIFFS.forEach(function (d) {
      var b = document.querySelector('[data-diff="' + d + '"]');
      if (b) b.setAttribute("aria-pressed", String(state.diff === d));
    });
    var hk = document.getElementById("hide-known");
    hk.classList.toggle("is-on", state.hideKnown);
    var anyClosed = visible().some(function (it) {
      return !state.open.has(it.q.id);
    });
    document.getElementById("expand").textContent = anyClosed
      ? "expand all"
      : "collapse all";
  }

  /* --------------------------------------------------------------- events */

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open],[data-mark],[data-round],[data-copy]");
    if (!t) return;

    if (t.hasAttribute("data-copy")) {
      var text = t.getAttribute("data-copy");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          t.textContent = "copied";
          setTimeout(function () {
            t.textContent = "copy";
          }, 1400);
        });
      }
      return;
    }

    if (t.hasAttribute("data-round")) {
      state.round = t.getAttribute("data-round");
      state.query = "";
      document.getElementById("search").value = "";
      save("round", state.round);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (t.hasAttribute("data-mark")) {
      var mid = t.getAttribute("data-mark");
      if (state.known.has(mid)) state.known.delete(mid);
      else state.known.add(mid);
      persistSets();
      render();
      return;
    }

    var id = t.getAttribute("data-open");
    if (state.open.has(id)) state.open.delete(id);
    else state.open.add(id);
    persistSets();
    render();
  });

  document.getElementById("search").addEventListener("input", function (e) {
    state.query = e.target.value;
    render();
  });

  DIFFS.forEach(function (d) {
    document
      .querySelector('[data-diff="' + d + '"]')
      .addEventListener("click", function () {
        state.diff = d;
        render();
      });
  });

  document.getElementById("hide-known").addEventListener("click", function () {
    state.hideKnown = !state.hideKnown;
    render();
  });

  document.getElementById("expand").addEventListener("click", function () {
    var items = visible();
    var anyClosed = items.some(function (it) {
      return !state.open.has(it.q.id);
    });
    items.forEach(function (it) {
      if (anyClosed) state.open.add(it.q.id);
      else state.open.delete(it.q.id);
    });
    persistSets();
    render();
  });

  var nightBtn = document.getElementById("night");
  function applyNight() {
    document.documentElement.setAttribute(
      "data-night",
      state.night ? "on" : "off"
    );
    nightBtn.classList.toggle("is-on", state.night);
    nightBtn.textContent = state.night ? "day" : "night";
  }
  nightBtn.addEventListener("click", function () {
    state.night = !state.night;
    save("night", state.night);
    applyNight();
  });

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "reset") {
      state.known.clear();
      persistSets();
      render();
    }
  });

  document.addEventListener("keydown", function (e) {
    var typing =
      e.target &&
      (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");

    if (e.key === "/" && !typing) {
      e.preventDefault();
      document.getElementById("search").focus();
      return;
    }
    if (e.key === "Escape" && typing) {
      e.target.value = "";
      state.query = "";
      e.target.blur();
      render();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key >= "1" && e.key <= String(ROUNDS.length)) {
      state.round = ROUNDS[Number(e.key) - 1].id;
      state.query = "";
      document.getElementById("search").value = "";
      save("round", state.round);
      render();
      window.scrollTo({ top: 0 });
    } else if (e.key === "e") {
      document.getElementById("expand").click();
    } else if (e.key === "n") {
      nightBtn.click();
    }
  });

  /* Printing: an answer only exists in the DOM while it is open, so expand
     everything for the print run and put the reading state back afterwards. */
  var printBackup = null;
  window.addEventListener("beforeprint", function () {
    printBackup = new Set(state.open);
    ALL.forEach(function (it) {
      state.open.add(it.q.id);
    });
    renderMain();
  });
  window.addEventListener("afterprint", function () {
    if (!printBackup) return;
    state.open = printBackup;
    printBackup = null;
    render();
  });

  applyNight();
  render();
})();
