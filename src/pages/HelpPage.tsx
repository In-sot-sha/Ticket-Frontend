import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { whatsappHref } from '../lib/contact';
import {
  type HelpArticle,
  type HelpRole,
  categoriesForRole,
  faqsForRole,
  getArticle,
  popularArticles,
  searchArticles,
} from '../lib/helpContent';

const ROLE_LABEL: Record<HelpRole, string> = {
  user: 'guest',
  organizer: 'host',
  vendor: 'vendor',
};

const ROLE_SHORT: Record<HelpRole, string> = {
  user: 'Guests',
  organizer: 'Hosts',
  vendor: 'Vendors',
};

function ArticleBody({ article }: { article: HelpArticle }) {
  return (
    <div className="space-y-4">
      {article.body.map((p, i) => (
        <p key={i} className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {p}
        </p>
      ))}
      {article.steps && article.steps.length > 0 && (
        <ol className="space-y-2.5">
          {article.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}
      {article.cta && (
        <Link
          to={article.cta.to}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50"
        >
          {article.cta.label}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function RoleTabs({
  activeTab,
  onChange,
}: {
  activeTab: HelpRole;
  onChange: (tab: HelpRole) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Help audience"
      className="flex w-full rounded-lg border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-100 dark:bg-neutral-800/80"
    >
      {(['user', 'organizer', 'vendor'] as HelpRole[]).map((role) => {
        const selected = activeTab === role;
        return (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(role)}
            className={`flex-1 px-2 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-sm font-bold rounded-md transition-colors ${
              selected
                ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {ROLE_SHORT[role]}
          </button>
        );
      })}
    </div>
  );
}

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = (searchParams.get('role') as HelpRole) || 'user';
  const articleId = searchParams.get('article');
  const activeArticle = getArticle(articleId);

  const setActiveTab = (tab: HelpRole) => {
    setSearchParams({ role: tab });
    setSearchQuery('');
    setOpenFaqId(null);
    setExpandedCategoryId(null);
  };

  const openArticle = (id: string) => {
    setSearchParams({ role: activeTab, article: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearArticle = () => {
    setSearchParams({ role: activeTab });
  };

  useEffect(() => {
    if (articleId && !getArticle(articleId)) {
      setSearchParams({ role: activeTab }, { replace: true });
    }
  }, [articleId, activeTab, setSearchParams]);

  const categories = useMemo(() => categoriesForRole(activeTab), [activeTab]);
  const popular = useMemo(() => popularArticles(activeTab), [activeTab]);
  const faqs = useMemo(() => faqsForRole(activeTab), [activeTab]);
  const filteredArticles = useMemo(
    () => searchArticles(activeTab, searchQuery),
    [activeTab, searchQuery],
  );

  const articlesById = useMemo(() => {
    const map = new Map<string, HelpArticle>();
    for (const a of [
      ...popular,
      ...categories.flatMap(
        (c) => c.articleIds.map((id) => getArticle(id)).filter(Boolean) as HelpArticle[],
      ),
    ]) {
      map.set(a.id, a);
    }
    return map;
  }, [popular, categories]);

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-20 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex h-12 sm:h-14 max-w-5xl items-center gap-1.5 px-3 sm:px-6">
          {activeArticle ? (
            <button
              type="button"
              onClick={clearArticle}
              className="rounded-lg p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Back to help topics"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <h1 className="truncate text-sm sm:text-base font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Help Center
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-3 sm:px-6 py-3 sm:py-5 pb-24 md:pb-10">
        {activeArticle ? (
          <article className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
              <div className="border-b border-neutral-100 dark:border-neutral-800 px-4 sm:px-5 py-4">
                <span className="inline-flex rounded-md bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  {activeArticle.category}
                </span>
                <h2 className="mt-2 text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-snug">
                  {activeArticle.title}
                </h2>
                {activeArticle.summary ? (
                  <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {activeArticle.summary}
                  </p>
                ) : null}
              </div>

              <div className="px-4 sm:px-5 py-4 sm:py-5">
                <ArticleBody article={activeArticle} />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-neutral-100 dark:border-neutral-800 px-4 sm:px-5 py-3 bg-neutral-50/80 dark:bg-neutral-950/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearArticle}
                  className="rounded-full h-8 text-xs"
                >
                  ← All topics
                </Button>
                <a
                  href={whatsappHref(
                    `Hi PartyStorm, I have a question about: ${activeArticle.title}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="rounded-full h-8 text-xs gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white border-0"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    Ask on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </article>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                to="/recover-ticket"
                className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 px-3.5 py-2.5"
              >
                <span>
                  <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                    Lost a ticket?
                  </span>
                  <span className="block text-[11px] text-neutral-500">Recover by email</span>
                </span>
                <span className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white">
                  Recover
                </span>
              </Link>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-left"
              >
                <span>
                  <span className="block text-sm font-bold text-neutral-900 dark:text-white">
                    Still need help?
                  </span>
                  <span className="block text-[11px] text-neutral-500">WhatsApp, email, or call</span>
                </span>
                <span className="flex items-center gap-2 text-neutral-400">
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  <Mail className="h-4 w-4" />
                  <Phone className="h-4 w-4" />
                </span>
              </button>
            </div>

            {/* One card: search → tabs → articles (no gap above tabs) */}
            <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
              <div className="border-b border-neutral-100 dark:border-neutral-800 px-2.5 sm:px-3 pt-2.5 pb-2 space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${ROLE_LABEL[activeTab]} help…`}
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 py-2 pl-9 pr-3 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>
                {!searchQuery && <RoleTabs activeTab={activeTab} onChange={setActiveTab} />}
              </div>

              {searchQuery ? (
                <div className="p-2.5 sm:p-3">
                  {filteredArticles.length > 0 ? (
                    <>
                      <p className="mb-2 px-0.5 text-xs font-semibold text-neutral-500">
                        {filteredArticles.length} result
                        {filteredArticles.length === 1 ? '' : 's'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredArticles.map((article) => (
                          <button
                            key={article.id}
                            type="button"
                            onClick={() => openArticle(article.id)}
                            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/50 p-3 text-left hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">
                              {article.category}
                            </p>
                            <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                              {article.title}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500 line-clamp-2">
                              {article.summary}
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-8 text-center">
                      <p className="text-sm text-neutral-500 mb-3">
                        No results for &ldquo;{searchQuery}&rdquo;
                      </p>
                      <a
                        href={whatsappHref(`Hi PartyStorm, I need help with: ${searchQuery}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <Button
                          size="sm"
                          className="rounded-full gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white border-0"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5" />
                          Ask on WhatsApp
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 sm:p-3 space-y-4 sm:space-y-5">
                  <div>
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Popular for {ROLE_SHORT[activeTab].toLowerCase()}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {popular.map((article) => (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => openArticle(article.id)}
                          className="rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/50 p-3 text-left hover:border-rose-200 dark:hover:border-rose-900/40 transition-colors"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500/80 mb-1">
                            {article.category}
                          </p>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                            {article.title}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                            {article.summary}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Browse by category
                    </h2>
                    <div className="space-y-1.5">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        const isOpen = expandedCategoryId === category.id;
                        const catArticles = category.articleIds
                          .map((id) => articlesById.get(id) || getArticle(id))
                          .filter(Boolean) as HelpArticle[];

                        return (
                          <div
                            key={category.id}
                            className="rounded-xl border border-neutral-150 dark:border-neutral-800 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedCategoryId(isOpen ? null : category.id)}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30">
                                <Icon className="h-4 w-4 text-rose-500" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-neutral-900 dark:text-white truncate">
                                  {category.title}
                                </span>
                                <span className="block text-[11px] text-neutral-500 truncate">
                                  {catArticles.length} article
                                  {catArticles.length === 1 ? '' : 's'}
                                </span>
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <ul className="border-t border-neutral-100 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/40">
                                {catArticles.map((article) => (
                                  <li key={article.id}>
                                    <button
                                      type="button"
                                      onClick={() => openArticle(article.id)}
                                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-400"
                                    >
                                      <span className="min-w-0 truncate">{article.title}</span>
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {faqs.length > 0 && (
                    <div>
                      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                        FAQ
                      </h2>
                      <div className="rounded-xl border border-neutral-150 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden">
                        {faqs.map((item) => {
                          const open = openFaqId === item.id;
                          return (
                            <div key={item.id}>
                              <button
                                type="button"
                                onClick={() => setOpenFaqId(open ? null : item.id)}
                                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
                              >
                                <span className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                                  {item.question}
                                </span>
                                <ChevronDown
                                  className={`mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                                    open ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {open && (
                                <div className="px-3 pb-3 space-y-2">
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    {item.answer}
                                  </p>
                                  {item.relatedArticleId && (
                                    <button
                                      type="button"
                                      onClick={() => openArticle(item.relatedArticleId!)}
                                      className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-500 hover:underline"
                                    >
                                      Read full guide <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default HelpPage;
