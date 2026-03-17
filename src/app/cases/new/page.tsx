"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const CERO_RATINGS = ["A", "B", "C", "D", "Z"] as const;

const CERO_LABELS: Record<string, string> = {
  A: "A — 全年齢対象",
  B: "B — 12才以上対象",
  C: "C — 15才以上対象",
  D: "D — 17才以上対象",
  Z: "Z — 18才以上のみ対象",
};

const CERO_COLORS: Record<string, string> = {
  A: "border-green-400 bg-green-50 text-green-700",
  B: "border-blue-400 bg-blue-50 text-blue-700",
  C: "border-yellow-400 bg-yellow-50 text-yellow-700",
  D: "border-orange-400 bg-orange-50 text-orange-700",
  Z: "border-red-400 bg-red-50 text-red-700",
};

type UploadedFile = {
  type: string;
  filename: string;
  url: string;
  originalName: string;
};

export default function NewCasePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    reviewNumber: "",
    gameTitle: "",
    caseTitle: "",
    summary: "",
    ceroRating: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "アップロードに失敗しました");
      } else {
        setUploadedFiles((prev) => [...prev, ...data.files]);
      }
    } catch {
      setUploadError("アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.ceroRating) {
      setError("CEROレーティングを選択してください");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          media: uploadedFiles.map((f) => ({
            type: f.type,
            filename: f.filename,
            url: f.url,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
        setSubmitting(false);
      } else {
        router.push(`/cases/${data.id}`);
      }
    } catch {
      setError("登録に失敗しました");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          事例一覧
        </Link>
        <span>/</span>
        <span className="text-gray-700">新規事例登録</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">新規事例登録</h1>
        <p className="text-sm text-gray-500 mb-8">
          CERO審査事例を登録します。すべての必須項目を入力してください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CERO Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              CEROレーティング <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {CERO_RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, ceroRating: r }))}
                  className={`py-3 rounded-xl border-2 text-center font-bold text-sm transition-all ${
                    form.ceroRating === r
                      ? `${CERO_COLORS[r]} border-current shadow-md scale-105`
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {form.ceroRating && (
              <p className="mt-2 text-xs text-gray-500">{CERO_LABELS[form.ceroRating]}</p>
            )}
          </div>

          {/* Review Number */}
          <div>
            <label htmlFor="reviewNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              審査番号 <span className="text-red-500">*</span>
            </label>
            <input
              id="reviewNumber"
              name="reviewNumber"
              type="text"
              required
              value={form.reviewNumber}
              onChange={handleChange}
              placeholder="例: CERO-2024-001234"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent font-mono"
            />
          </div>

          {/* Game Title */}
          <div>
            <label htmlFor="gameTitle" className="block text-sm font-semibold text-gray-700 mb-2">
              タイトル名 <span className="text-red-500">*</span>
            </label>
            <input
              id="gameTitle"
              name="gameTitle"
              type="text"
              required
              value={form.gameTitle}
              onChange={handleChange}
              placeholder="例: ○○ロールプレイングゲーム"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          {/* Case Title */}
          <div>
            <label htmlFor="caseTitle" className="block text-sm font-semibold text-gray-700 mb-2">
              事例タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="caseTitle"
              name="caseTitle"
              type="text"
              required
              value={form.caseTitle}
              onChange={handleChange}
              placeholder="例: 戦闘シーンにおける流血表現について"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-semibold text-gray-700 mb-2">
              事例概要 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="summary"
              name="summary"
              required
              rows={6}
              value={form.summary}
              onChange={handleChange}
              placeholder="事例の詳細な説明を記述してください。どのような表現が問題となったか、どのような基準で審査されたかなどを含めてください。"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none leading-relaxed"
            />
            <p className="mt-1 text-xs text-gray-400 text-right">
              {form.summary.length}文字
            </p>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              参考資料（動画・写真）
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">アップロード中…</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl mb-2">📁</p>
                  <p className="text-sm text-gray-500">
                    クリックしてファイルを選択
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    画像 (JPG, PNG, GIF) または 動画 (MP4, MOV) を複数選択可能
                  </p>
                </>
              )}
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}

            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <div className="relative h-24 bg-gray-100 rounded-xl overflow-hidden">
                      {f.type === "image" ? (
                        <Image
                          src={f.url}
                          alt={f.originalName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <span className="text-white text-2xl">🎬</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{f.originalName}</p>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登録中（AI処理中）…
                </>
              ) : (
                "事例を登録する"
              )}
            </button>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:border-gray-400 text-sm font-medium transition-colors text-center"
            >
              キャンセル
            </Link>
          </div>

          {!submitting && (
            <p className="text-xs text-gray-400 text-center">
              ※ 登録時にClaudeがAI検索用のデータを自動生成します
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
