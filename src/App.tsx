import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, CATEGORY_GROUPS } from "./data/questions";
import type { DiffFilter, Question } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useQuestionMeta } from "./hooks/useQuestionMeta";
import { useReveal } from "./hooks/useReveal";
import { TopBar } from "./components/TopBar";
import { Sidebar, NEEDS_INVESTIGATION_ID } from "./components/Sidebar";
import { QuestionCard } from "./components/QuestionCard";
import { HelpModal } from "./components/HelpModal";
import { HomeScreen } from "./components/HomeScreen";
import { FocusSession } from "./components/FocusSession";
import { IconZap, IconMenu } from "./components/icons";

const STORAGE_KEY = "qa-prep-state-v5";
const HELP_SEEN_KEY = "qa-prep-help-seen-v1";

type Screen = "home" | "category";

interface PersistedState {
  screen: Screen;
  activeCategoryId: string;
  lastCategoryId: string;
  openIds: Set<string>;
  commentsOpenIds: Set<string>;
}

const defaultState: PersistedState = {
  screen: "home",
  activeCategoryId: CATEGORIES[0]!.id,
  lastCategoryId: CATEGORIES[0]!.id,
  openIds: new Set<string>(),
  commentsOpenIds: new Set<string>(),
};

interface DisplayItem {
  q: Question;
  idx: number;
  categoryLabel: string;
}

export default function App() {
  const [state, setState] = useLocalStorage<PersistedState>(STORAGE_KEY, defaultState);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [focusSessionCatId, setFocusSessionCatId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusedCardRef = useRef<HTMLDivElement>(null);

  const meta = useQuestionMeta();

  useEffect(() => {
    try {
      if (!localStorage.getItem(HELP_SEEN_KEY)) {
        setHelpOpen(true);
        localStorage.setItem(HELP_SEEN_KEY, "1");
      }
    } catch {
      /* localStorage unavailable — silently skip */
    }
  }, []);

  const isHome = state.screen === "home";
  const isInvestigationView =
    state.screen === "category" &&
    state.activeCategoryId === NEEDS_INVESTIGATION_ID;

  const activeCategory = useMemo(() => {
    if (isInvestigationView) return null;
    return CATEGORIES.find((c) => c.id === state.activeCategoryId) ?? CATEGORIES[0]!;
  }, [state.activeCategoryId, isInvestigationView]);

  const reveal = useReveal(state.activeCategoryId);

  const filtered: DisplayItem[] = useMemo(() => {
    const term = search.trim().toLowerCase();

    const source: DisplayItem[] = isInvestigationView
      ? CATEGORIES.flatMap((c) =>
          c.questions
            .map((q, idx): DisplayItem => ({ q, idx, categoryLabel: c.label }))
            .filter(({ q }) => meta.flags.has(q.id)),
        )
      : (activeCategory?.questions ?? []).map((q, idx) => ({
          q,
          idx,
          categoryLabel: activeCategory!.label,
        }));

    return source.filter(({ q }) => {
      if (diffFilter !== "all" && q.diff !== diffFilter) return false;
      if (!term) return true;
      const haystack = `${q.q} ${(q.tags ?? []).join(" ")} ${q.answer}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [activeCategory, search, diffFilter, isInvestigationView, meta.flags]);

  useEffect(() => {
    setFocusedIdx(-1);
  }, [search, diffFilter, state.activeCategoryId, state.screen]);

  // Reset search/filter and close drawer when switching category
  useEffect(() => {
    setSearch("");
    setDiffFilter("all");
    setMobileMenuOpen(false);
  }, [state.activeCategoryId]);

  useEffect(() => {
    if (focusedIdx >= 0 && focusedCardRef.current) {
      focusedCardRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIdx]);

  const totalQuestions = useMemo(
    () => CATEGORIES.reduce((s, c) => s + c.questions.length, 0),
    []
  );
  const totalReviewed = meta.reviewed.size;

  const setActiveCategory = (id: string) => {
    setState((p) => ({
      ...p,
      activeCategoryId: id,
      lastCategoryId: id === NEEDS_INVESTIGATION_ID ? p.lastCategoryId : id,
      screen: "category",
    }));
  };

  const goHome = () => {
    setState((p) => ({ ...p, screen: "home" }));
    setMobileMenuOpen(false);
  };

  const goBrowse = () => {
    setState((p) => {
      const targetId =
        p.activeCategoryId === NEEDS_INVESTIGATION_ID
          ? p.lastCategoryId
          : p.activeCategoryId;
      return {
        ...p,
        screen: "category",
        activeCategoryId: targetId,
        lastCategoryId:
          targetId === NEEDS_INVESTIGATION_ID ? p.lastCategoryId : targetId,
      };
    });
  };

  const goBookmarks = () => {
    setState((p) => ({
      ...p,
      screen: "category",
      activeCategoryId: NEEDS_INVESTIGATION_ID,
    }));
  };

  /** Flips an id in one of the persisted Set fields. */
  const toggleId = (field: "openIds" | "commentsOpenIds", id: string) => {
    setState((p) => {
      const next = new Set(p[field]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...p, [field]: next };
    });
  };

  const toggleOpen = (id: string) => toggleId("openIds", id);
  const toggleComments = (id: string) => toggleId("commentsOpenIds", id);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (focusSessionCatId) return;

      if (e.key === "Escape") {
        if (inField) (target as HTMLInputElement).blur();
        setMobileMenuOpen(false);
        return;
      }

      if (inField) return;

      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      if (/^[1-5]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const group = CATEGORY_GROUPS[idx];
        const firstCategoryId = group?.categoryIds[0];
        if (firstCategoryId) setActiveCategory(firstCategoryId);
        return;
      }

      if (isHome || filtered.length === 0) return;

      if (e.key === "j") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === " " && focusedIdx >= 0) {
        e.preventDefault();
        const item = filtered[focusedIdx];
        if (item) toggleOpen(item.q.id);
        return;
      }
      if (e.key === "r" && focusedIdx >= 0) {
        e.preventDefault();
        const item = filtered[focusedIdx];
        if (item) meta.toggleReviewed(item.q.id);
        return;
      }
      if (e.key === "f" && focusedIdx >= 0) {
        e.preventDefault();
        const item = filtered[focusedIdx];
        if (item) meta.toggleFlag(item.q.id);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    /* The handler also calls setActiveCategory / toggleOpen / meta.*, which are
       re-created each render. They're left out of the deps deliberately: every
       one of them updates through a functional setter, so a stale closure can't
       read stale state, and listing them would rebind the listener constantly. */
  }, [filtered, focusedIdx, isHome, focusSessionCatId]);

  const activeGroup = isInvestigationView
    ? null
    : activeCategory
      ? CATEGORY_GROUPS.find((g) => g.categoryIds.includes(activeCategory.id))
      : null;
  const chapterEyebrow = isInvestigationView
    ? "Bookmarks"
    : `Chapter · ${activeGroup?.label ?? "Topic"}`;
  const headerTitle = isInvestigationView ? "Saved for later" : activeCategory?.label ?? "";
  const headerDesc = isInvestigationView
    ? "Questions you've starred for another pass. Untoggle the star on any card to remove it."
    : activeCategory?.desc ?? "";

  const chapterTotal = activeCategory?.questions.length ?? filtered.length;
  const chapterReviewed = isInvestigationView
    ? filtered.filter(({ q }) => meta.reviewed.has(q.id)).length
    : (activeCategory?.questions.filter((q) => meta.reviewed.has(q.id)).length ?? 0);
  const chapterFlagged = isInvestigationView
    ? filtered.length
    : (activeCategory?.questions.filter((q) => meta.flags.has(q.id)).length ?? 0);
  const chapterPct = chapterTotal ? Math.round((chapterReviewed / chapterTotal) * 100) : 0;

  const focusSessionCategory = focusSessionCatId
    ? CATEGORIES.find((c) => c.id === focusSessionCatId) ?? null
    : null;

  return (
    <div className="app" data-style="modern">
      <TopBar
        totalReviewed={totalReviewed}
        totalQuestions={totalQuestions}
        screen={state.screen}
        isBookmarksActive={isInvestigationView}
        bookmarksCount={meta.flags.size}
        onGoHome={goHome}
        onGoBrowse={goBrowse}
        onGoBookmarks={goBookmarks}
        onOpenHelp={() => setHelpOpen(true)}
      />
      {isHome ? (
        <HomeScreen
          categories={CATEGORIES}
          groups={CATEGORY_GROUPS}
          reviewedIds={meta.reviewed}
          lastCategoryId={state.lastCategoryId}
          onOpenCategory={(id) => setActiveCategory(id)}
          onResume={(id) => setActiveCategory(id)}
        />
      ) : (
        <div className={`layout ${mobileMenuOpen ? "drawer-open" : ""}`}>
          <div
            className="sidebar-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar
            categories={CATEGORIES}
            groups={CATEGORY_GROUPS}
            activeId={state.activeCategoryId}
            reviewedIds={meta.reviewed}
            flaggedCount={meta.flags.size}
            onSelect={setActiveCategory}
            open={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
          <main className="main">
            <div className={`main-inner ${reveal}`}>
              <button
                className="toc-toggle"
                onClick={() => setMobileMenuOpen(true)}
              >
                <IconMenu size={16} /> Contents
              </button>
              <div className="chapter-eyebrow">{chapterEyebrow}</div>
              <h1 className="chapter-title">{headerTitle}</h1>
              <p className="chapter-desc">{headerDesc}</p>
              {chapterTotal > 0 && (
                <div className="chapter-meta" aria-label="Progress in this topic">
                  <span className="chapter-bar" aria-hidden="true">
                    <span style={{ width: `${chapterPct}%` }} />
                  </span>
                  <span className="chapter-counts">
                    <strong>{chapterReviewed}</strong> of {chapterTotal} reviewed
                    {chapterFlagged > 0 && (
                      <> · <strong>{chapterFlagged}</strong> bookmarked</>
                    )}
                  </span>
                  {!isInvestigationView && activeCategory && activeCategory.questions.length > 0 && (
                    <button
                      className="focus-launch"
                      onClick={() => setFocusSessionCatId(activeCategory.id)}
                      title="Start a focus session"
                    >
                      <IconZap size={14} strokeWidth={2} />
                      Focus session
                    </button>
                  )}
                </div>
              )}
              {meta.error && (
                <div className="meta-error">
                  Sync issue: {meta.error}. Changes may not be saved.
                </div>
              )}
              <div className="controls">
                <input
                  ref={searchRef}
                  type="text"
                  className="search"
                  placeholder={
                    isInvestigationView
                      ? "Search bookmarked questions…   (press /)"
                      : "Search this topic…   (press /)"
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="pills" role="tablist" aria-label="Difficulty filter">
                  {(["all", "easy", "mid", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      className={`pill ${diffFilter === d ? "active" : ""}`}
                      onClick={() => setDiffFilter(d)}
                      role="tab"
                      aria-selected={diffFilter === d}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length === 0 ? (
                <div className="empty">
                  {isInvestigationView
                    ? "Nothing bookmarked yet. Star any question to save it here."
                    : "No questions match. Try clearing search or changing difficulty."}
                </div>
              ) : (
                <div className="q-list">
                  {filtered.map((item, i) => {
                    const isFocused = i === focusedIdx;
                    const qid = item.q.id;
                    return (
                      <QuestionCard
                        ref={isFocused ? focusedCardRef : undefined}
                        key={qid}
                        question={item.q}
                        num={item.idx + 1}
                        delay={Math.min(i * 35, 420)}
                        sourceLabel={isInvestigationView ? item.categoryLabel : undefined}
                        isReviewed={meta.reviewed.has(qid)}
                        isOpen={state.openIds.has(qid)}
                        isFocused={isFocused}
                        isFlagged={meta.flags.has(qid)}
                        isCommentsOpen={state.commentsOpenIds.has(qid)}
                        comments={meta.commentsByQuestion.get(qid) ?? []}
                        onToggleOpen={() => toggleOpen(qid)}
                        onToggleReviewed={() => meta.toggleReviewed(qid)}
                        onToggleFlag={() => meta.toggleFlag(qid)}
                        onToggleComments={() => toggleComments(qid)}
                        onAddComment={(body) => meta.addComment(qid, body)}
                        onDeleteComment={(cid) => meta.deleteComment(cid)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      )}
      {focusSessionCategory && (
        <FocusSession
          category={focusSessionCategory}
          reviewedIds={meta.reviewed}
          flaggedIds={meta.flags}
          onMarkReviewed={(id) => meta.toggleReviewed(id)}
          onToggleFlag={(id) => meta.toggleFlag(id)}
          onEnd={() => setFocusSessionCatId(null)}
        />
      )}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
