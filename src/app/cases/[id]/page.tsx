"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  updatedAt: string;
  media: Media[];
};

const CERO_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-300",
  B: "bg-blue-100 text-blue-800 border-blue-300",
  C: "bg-yellow-100 text-yellow-800 border-yellow-300",
  D: "bg-orange-100 text-orange-800 border-orange-300",
  Z: "bg-red-100 text-red-800 border-red-300",
};

const CERO_LABELS: Record<string, string> = {
  A: "全年齢対象",
  B: "12才以上対象",
  C: "15才以上対象",
  D: "17才以上対象",
  Z: "18才以上のみ対象",
};

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const res = await fetch(`/api/cases/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setCaseData(data);
        if (data.media.length > 0) setSelectedMedia(data.media[0]);
      } catch {
        setError("事例が見つかりません");
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("この事例を削除しますか？この操作は取り消せません。")) return;
    setDeleting(true);
    try {
      await fetch(`/api/cases/${params.id}`, { method: "DELETE" });
      router.push("/");
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-100 rounded-xl mb-6" />
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-600">{error || "事例が見つかりません"}</p>
        <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const images = caseData.media.filter((m) => m.type === "image");
  const videos = caseData.media.filter((m) => m.type === "video");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          事例一覧
        </Link>
        <span>/</span>
        <span className="text-gray-700">{caseData.reviewNumber}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${CERO_COLORS[caseData.ceroRating] ?? "bg-gray-100"}`}
              >
                CERO {caseData.ceroRating}
              </span>
              <span className="text-sm text-gray-500">
                {CERO_LABELS[caseData.ceroRating]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {caseData.gameTitle}
            </h1>
            <p className="text-indigo-600 font-medium">{caseData.caseTitle}</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {deleting ? "削除中…" : "🗑 削除"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 mb-1">審査番号</p>
            <p className="text-sm font-mono font-medium text-gray-800">
              {caseData.reviewNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">登録日時</p>
            <p className="text-sm text-gray-800">
              {new Date(caseData.createdAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            事例概要
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {caseData.summary}
          </p>
        </div>
      </div>

      {/* Media Section */}
      {caseData.media.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            参考資料
            <span className="text-sm font-normal text-gray-400">
              ({caseData.media.length}件)
            </span>
          </h2>

          {/* Main viewer */}
          {selectedMedia && (
            <div className="mb-6 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center min-h-64">
              {selectedMedia.type === "image" ? (
                <div className="relative w-full" style={{ minHeight: "300px" }}>
                  <Image
                    src={selectedMedia.url}
                    alt={selectedMedia.filename}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <video
                  key={selectedMedia.url}
                  controls
                  className="max-w-full max-h-96 w-full"
                  preload="metadata"
                >
                  <source src={selectedMedia.url} />
                  お使いのブラウザは動画再生に対応していません
                </video>
              )}
            </div>
          )}

          {/* Thumbnails */}
          {caseData.media.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {caseData.media.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMedia(m)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedMedia?.id === m.id
                      ? "border-indigo-500 shadow-md"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {m.type === "image" ? (
                    <Image
                      src={m.url}
                      alt={m.filename}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-white text-2xl">▶</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* File list */}
          <div className="mt-6 space-y-2">
            {images.length > 0 && (
              <p className="text-xs text-gray-400">
                📷 画像 {images.length}件 · 🎬 動画 {videos.length}件
              </p>
            )}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
        >
          ← 事例一覧に戻る
        </Link>
      </div>
    </div>
  );
}
