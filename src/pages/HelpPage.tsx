import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Mail,
  Phone,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { mailtoHref, telHref, whatsappHref } from '../lib/contact';
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

function ArticleBody({ article }: { article: HelpArticle }) {
  return (
    <div className="space-y-4">
      {article.body.map((p, i) => (
        <p key={i} className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {p}
        </p>
      ))}
      {article.steps && article.steps.length > 0 && (
        <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
          {article.steps.map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      )}
      {article.cta && (
        <Link
          to={article.cta.to}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-500 hover:text-rose-600"
        >
          {article.cta.label}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    setIsMenuOpen(false);
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
    [activeTab, searchQuery]
  );

  const articlesById = useMemo(() => {
    const map = new Map<string, HelpArticle>();
    for (const a of [...popular, ...categories.flatMap((c) =>
      c.articleIds.map((id) => getArticle(id)).filter(Boolean) as HelpArticle[]
    )]) {
      map.set(a.id, a);
    }
    return map;
  }, [popular, categories]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {activeArticle && (
                <button
                  type="button"
                  onClick={clearArticle}
                  className="p-2 -ml-2 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  aria-label="Back to help topics"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PartyStorm Help Center
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <a
                href={whatsappHref('Hi PartyStorm, I need help with…')}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" className="text-gray-700 dark:text-gray-300 gap-2">
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  WhatsApp
                </Button>
              </a>
              <Button
                variant="ghost"
                className="text-gray-700 dark:text-gray-300"
                onClick={() => navigate('/contact')}
              >
                Contact Support
              </Button>
            </div>
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href={whatsappHref('Hi PartyStorm, I need help with…')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </a>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/contact');
              }}
            >
              Contact Support
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeArticle ? (
          <article className="max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">
              {activeArticle.category}
            </p>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
              {activeArticle.title}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">{activeArticle.summary}</p>
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-150 dark:border-neutral-800 shadow-sm p-6 md:p-8">
              <ArticleBody article={activeArticle} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="outline" onClick={clearArticle} className="rounded-full">
                ← All help topics
              </Button>
              <a
                href={whatsappHref(`Hi PartyStorm, I have a question about: ${activeArticle.title}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="rounded-full gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white border-0">
                  <WhatsAppIcon className="h-4 w-4" />
                  Ask on WhatsApp
                </Button>
              </a>
            </div>
          </article>
        ) : (
          <>
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-100 dark:bg-gray-800">
                {(['user', 'organizer', 'vendor'] as HelpRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveTab(role)}
                    className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all ${
                      activeTab === role
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {role === 'user' ? 'For Guests' : role === 'organizer' ? 'For Hosts' : 'For Vendors'}
                  </button>
                ))}
              </div>
            </div>

            <section className="mb-12">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  How can we help you?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  Search for answers or browse topics for {ROLE_LABEL[activeTab]}s
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${ROLE_LABEL[activeTab]} help…`}
                    className="block w-full pl-12 pr-4 py-4 border border-neutral-200 dark:border-neutral-800 rounded-full bg-white dark:bg-gray-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base shadow-sm"
                  />
                </div>
              </div>

              <div className="max-w-3xl mx-auto mt-8 p-6 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/10 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                    Lost your tickets?
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Recover valid tickets with the email or phone used at checkout.
                  </p>
                </div>
                <Link
                  to="/recover-ticket"
                  className="shrink-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-xs font-bold px-5 py-3 shadow-md hover:shadow-lg hover:opacity-95 transition-all active:scale-[0.98]"
                >
                  Recover Tickets
                </Link>
              </div>

              {searchQuery && filteredArticles.length > 0 && (
                <div className="mt-8 max-w-4xl mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Search Results ({filteredArticles.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => openArticle(article.id)}
                        className="text-left bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {article.title}
                          </h4>
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {article.category}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{article.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && filteredArticles.length === 0 && (
                <div className="mt-8 max-w-4xl mx-auto text-center space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    No results for &ldquo;{searchQuery}&rdquo;. Try different keywords or contact us.
                  </p>
                  <a
                    href={whatsappHref(`Hi PartyStorm, I need help with: ${searchQuery}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button className="rounded-full gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white border-0">
                      <WhatsAppIcon className="h-4 w-4" />
                      Ask on WhatsApp
                    </Button>
                  </a>
                </div>
              )}
            </section>

            {!searchQuery && (
              <>
                <section className="mb-16">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">
                    Popular Articles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popular.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => openArticle(article.id)}
                        className="text-left bg-white dark:bg-gray-900 rounded-3xl p-6 hover:shadow-md transition-shadow border border-neutral-150 dark:border-neutral-800 shadow-sm"
                      >
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mb-3">
                          {article.category}
                        </span>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
                          {article.title}
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                          {article.summary}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-0.5 text-xs font-bold text-rose-500">
                          Read article <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mb-16">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">
                    Browse by Category
                  </h2>
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isOpen = expandedCategoryId === category.id;
                      const catArticles = category.articleIds
                        .map((id) => articlesById.get(id) || getArticle(id))
                        .filter(Boolean) as HelpArticle[];

                      return (
                        <div
                          key={category.id}
                          className="bg-white dark:bg-gray-900 rounded-3xl border border-neutral-150 dark:border-neutral-800 shadow-sm overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCategoryId(isOpen ? null : category.id)
                            }
                            className="w-full flex items-center gap-4 p-5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 shrink-0">
                              <Icon className="h-6 w-6 text-rose-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                {category.title}
                              </h3>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {category.description} · {catArticles.length} article
                                {catArticles.length === 1 ? '' : 's'}
                              </p>
                            </div>
                            <ChevronDown
                              className={`h-5 w-5 text-neutral-400 shrink-0 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <ul className="border-t border-neutral-100 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800">
                              {catArticles.map((article) => (
                                <li key={article.id}>
                                  <button
                                    type="button"
                                    onClick={() => openArticle(article.id)}
                                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-rose-50/50 dark:hover:bg-rose-950/10"
                                  >
                                    {article.title}
                                    <ChevronRight className="h-4 w-4 text-rose-500 shrink-0" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="mb-16">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6 tracking-tight">
                    Frequently Asked Questions
                  </h2>
                  <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-neutral-150 dark:border-neutral-800 divide-y divide-neutral-150 dark:divide-neutral-800">
                    {faqs.map((item) => {
                      const open = openFaqId === item.id;
                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(open ? null : item.id)}
                            className="w-full flex items-start justify-between gap-4 p-6 text-left"
                          >
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                              {item.question}
                            </h3>
                            <ChevronDown
                              className={`h-5 w-5 text-neutral-400 shrink-0 mt-0.5 transition-transform ${
                                open ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {open && (
                            <div className="px-6 pb-6 space-y-3">
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                {item.answer}
                              </p>
                              {item.relatedArticleId && (
                                <button
                                  type="button"
                                  onClick={() => openArticle(item.relatedArticleId!)}
                                  className="text-xs font-bold text-rose-500 hover:underline inline-flex items-center gap-0.5"
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
                </section>
              </>
            )}

            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700">
              <WhatsAppIcon className="h-12 w-12 text-[#25D366] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Still need help?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Chat with us on WhatsApp, email support, or call during business hours.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <WhatsAppIcon className="h-8 w-8 text-[#25D366] mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">WhatsApp</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Fastest way to reach us
                  </p>
                  <a
                    href={whatsappHref('Hi PartyStorm, I need help with…')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366]/10"
                    >
                      <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                      Open WhatsApp
                    </Button>
                  </a>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Email Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Send a detailed message
                  </p>
                  <div className="flex flex-col gap-2">
                    <a href={mailtoHref('PartyStorm support request')} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        Email Us
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/contact')}
                    >
                      Contact form
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Call Us</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    During business hours
                  </p>
                  <a href={telHref()} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Call Now
                    </Button>
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default HelpPage;
