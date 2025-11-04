/**
 * PageList Component
 * ページ一覧を表示するコンポーネント
 */

import { useState, useEffect } from 'react';
import { fetchPageStats } from '../api/heatmap';
import type { PageStats } from '../types/api';

interface PageListProps {
  onSelectPage: (pageUrl: string) => void;
}

export function PageList({ onSelectPage }: PageListProps) {
  const [pages, setPages] = useState<PageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    setError(null);

    const response = await fetchPageStats();

    if (response) {
      setPages(response.stats);
    } else {
      setError('ページ統計の取得に失敗しました');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="page-list-loading">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-list-error">
        <p className="error-message">{error}</p>
        <button onClick={loadPages} className="retry-button">
          再試行
        </button>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="page-list-empty">
        <p>まだデータがありません</p>
        <p className="empty-hint">
          LPにヒートマップツールを設置すると、ここにページが表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="page-list">
      <div className="page-list-header">
        <h2>ページ一覧</h2>
        <button onClick={loadPages} className="refresh-button">
          更新
        </button>
      </div>

      <div className="page-list-table">
        <table>
          <thead>
            <tr>
              <th>ページURL</th>
              <th>タイトル</th>
              <th>クリック数</th>
              <th>セッション数</th>
              <th>最終アクティビティ</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.page_id}>
                <td className="page-url">
                  <a
                    href={page.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {page.page_url}
                  </a>
                </td>
                <td className="page-title">
                  {page.page_title || '(タイトルなし)'}
                </td>
                <td className="stat-number">{page.total_clicks}</td>
                <td className="stat-number">{page.unique_sessions}</td>
                <td className="last-activity">
                  {formatDate(page.last_activity)}
                </td>
                <td className="actions">
                  <button
                    onClick={() => onSelectPage(page.page_url)}
                    className="view-button"
                  >
                    詳細を見る
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * 日時フォーマット
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
