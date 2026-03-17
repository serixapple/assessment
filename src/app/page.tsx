"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

type Media = {
  id: number;
  type: string;
  url: string;
  filename: string;
};

type Case = {
  id: number;
  reviewNumber: string;
  gameTitle: string;
  caseTitle: string;
  summary: string;
  ceroRating: string;
  createdAt: string;
  media: Media[];
};

type SearchResult = {
  case: Case;
  reason: string;
};

const CERO_RATINGS = ["A", "B", "C", "D", "Z"] as const;

const CERO_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-300",
  B: "bg-blue-100 text-blue-800 border-blue-300",
  C: "bg-yellow-100 text-yellow-800 border-yellow-300",
  D: "bg-orange-100 text-orange-800 border-orange-300",
  Z: "bg-red-100 text-red-800 border-red-300",
};

const CERO_LABELS: Record<string, string> = {
  A: "A (全年齢)",
  B: "B (12才以上)",
  C: "C (15才以上)",
  D: "D (17才以上)",
  Z: "Z (18才以上)",
};

function CeroRatingBadge({ rating }: { rating: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CERO_COLORS[rating] ?? "bg-gray-100 text-gray-800"}`}
    >
      CERO {rating}
    </span>
  );
}

function CaseCard({ caseData, reason }: { caseData: Case; reason?: string }) {
  const thumbnail = caseData.media.find((m) => m.type === "image");
  const hasVideo = caseData.media.some((m) => m.type === "video");
  const hasMedia = caseData.media.length > 0;

  return (
    <Link href={`/cases/${caseData.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
        {thumbnail ? (
          <div className="relative h-40 w-full rounded-t-xl overflow-hidden bg-gray-100">
            <Image
              src={thumbnail.url}
              alt={caseData.gameTitle}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : hasVideo ? (
          <div className="h-40 w-full rounded-t-xl bg-gray-800 flex items-center justify-center">
            <span className="text-gray-300 text-5xl">▶</span>
          </div>
        ) : null}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CeroRatingBadge rating={caseData.ceroRating} />
            <span className="text-xs text-gray-400 font-mono">{caseData.reviewNumber}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
            {caseData.gameTitle}
          </h3>
          <p className="text-xs text-indigo-600 font-medium mb-2 line-clamp-1">
            {caseData.caseTitle}
          </p>
          <p className="text-xs text-gray-500 line-clamp-3 flex-1">{caseData.summary}</p>
          {reason && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg p-2 line-clamp-2">
                💡 {reason}
              </p>
            </div>
          )}
          {hasMedia && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              {caseData.media.filter((m) => m.type === "image").length > 0 && (
                <span>📷 {caseData.media.filter((m) => m.type === "image").length}</span>
              )}
              {caseData.media.filter((m) => m.type === "video").length > 0 && (
                <span>🎬 {caseData.media.filter((m) => m.type === "video").length}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredRating, setFilteredRating] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchExplanation, setSearchExplanation] = useState("");
  const [searchError, setSearchError] = useState("");

  const fetchCases = useCallback(async (rating?: string) => {
    setLoading(true);
    try {
      const url =
        rating && rating !== "ALL"
          ? `/api/cases?rating=${rating}`
          : "/api/cases";
      const res = await fetch(url);
      const data = await res.json();
      setCases(data);
    } catch {
      console.error("Failed to fetch cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases(filteredRating);
    setSearchResults(null);
    setSearchQuery("");
  }, [filteredRating, fetchCases]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchResults(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          rating: filteredRating !== "ALL" ? filteredRating : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || "検索に失敗しました");
      } else {
        setSearchResults(data.results);
        setSearchExplanation(data.explanation);
      }
    } catch {
      setSearchError("検索に失敗しました");
    } finally {
      setSearchLoading(false);
    }
  };

  const displayCases = searchResults
    ? searchResults.map((r) => ({ case: r.case, reason: r.reason }))
    : cases.map((c) => ({ case: c, reason: undefined }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CERO 審査事例集</h1>
        <p className="text-gray-500 text-sm">
          ゲームソフトの審査事例データベース。自然言語でAIが類似事例を検索します。
        </p>
      </div>

      {/* AI Search */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-100">
        <h2 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
          <span>🤖</span> AI 類似事例検索 (Claude)
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="例：暴力描写や流血シーンに関する事例はある？"
            className="flex-1 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {searchLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                検索中…
              </>
            ) : (
              "検索"
            )}
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={() => { setSearchResults(null); setSearchQuery(""); setSearchExplanation(""); }}
              className="text-gray-500 hover:text-gray-700 text-sm px-3 whitespace-nowrap"
            >
              ✕ クリア
            </button>
          )}
        </form>
        {searchError && (
          <p className="mt-2 text-sm text-red-600">{searchError}</p>
        )}
        {searchExplanation && searchResults && (
          <div className="mt-3 text-xs text-indigo-700 bg-white rounded-xl px-4 py-3 border border-indigo-100">
            {searchExplanation}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">CEROフィルター：</span>
        <button
          onClick={() => setFilteredRating("ALL")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            filteredRating === "ALL"
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
          }`}
        >
          すべて
        </button>
        {CERO_RATINGS.map((r) => (
          <button
            key={r}
            onClick={() => setFilteredRating(r)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filteredRating === r
                ? `${CERO_COLORS[r]} border-current font-bold`
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            {CERO_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          {searchResults
            ? `AI検索結果: ${displayCases.length}件`
            : loading
            ? "読み込み中…"
            : `${displayCases.length}件の事例`}
        </p>
      </div>

      {/* Case Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-40 bg-gray-100 rounded-lg mb-4" />
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : displayCases.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg font-medium">
            {searchResults ? "該当する事例が見つかりませんでした" : "事例が登録されていません"}
          </p>
          {!searchResults && (
            <p className="text-sm mt-2">
              <Link href="/cases/new" className="text-indigo-600 hover:underline">
                最初の事例を登録してみましょう →
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCases.map(({ case: c, reason }) => (
            <CaseCard key={c.id} caseData={c} reason={reason} />
          ))}
        </div>
      )}
    </div>
  );
}
