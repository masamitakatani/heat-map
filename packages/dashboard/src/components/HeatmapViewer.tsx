/**
 * HeatmapViewer Component
 * ヒートマップを表示するコンポーネント
 */

import { useState, useEffect, useRef } from 'react';
import {
  fetchClickHeatmap,
  fetchScrollStats,
  fetchMouseMoveHeatmap,
} from '../api/heatmap';
import type {
  ClickHeatmapData,
  ScrollStats,
  MouseMoveHeatmapData,
} from '../types/api';

interface HeatmapViewerProps {
  pageUrl: string;
  onBack: () => void;
}

type HeatmapType = 'click' | 'scroll' | 'mousemove';

export function HeatmapViewer({ pageUrl, onBack }: HeatmapViewerProps) {
  const [heatmapType, setHeatmapType] = useState<HeatmapType>('click');
  const [clickData, setClickData] = useState<ClickHeatmapData | null>(null);
  const [scrollData, setScrollData] = useState<ScrollStats | null>(null);
  const [mouseMoveData, setMouseMoveData] = useState<MouseMoveHeatmapData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadHeatmapData();
  }, [pageUrl, heatmapType]);

  const loadHeatmapData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (heatmapType === 'click') {
        const data = await fetchClickHeatmap(pageUrl);
        if (data) {
          setClickData(data);
        } else {
          setError('クリックヒートマップの取得に失敗しました');
        }
      } else if (heatmapType === 'scroll') {
        const data = await fetchScrollStats(pageUrl);
        if (data) {
          setScrollData(data);
        } else {
          setError('スクロール統計の取得に失敗しました');
        }
      } else if (heatmapType === 'mousemove') {
        const data = await fetchMouseMoveHeatmap(pageUrl);
        if (data) {
          setMouseMoveData(data);
        } else {
          setError('マウスムーブヒートマップの取得に失敗しました');
        }
      }
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
      console.error('[HeatmapViewer] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderClickHeatmap = () => {
    if (!clickData || clickData.clicks.length === 0) {
      return <div className="no-data">クリックデータがありません</div>;
    }

    return (
      <div className="heatmap-container">
        <div className="iframe-wrapper">
          <iframe
            ref={iframeRef}
            src={pageUrl}
            className="page-iframe"
            title="ページプレビュー"
          />
          <canvas
            className="heatmap-canvas"
            width={1200}
            height={800}
          ></canvas>
        </div>
        <div className="heatmap-info">
          <p>総クリック数: {clickData.total_count}</p>
          <p>ユニークポイント数: {clickData.clicks.length}</p>
        </div>
      </div>
    );
  };

  const renderScrollStats = () => {
    if (!scrollData) {
      return <div className="no-data">スクロールデータがありません</div>;
    }

    const depths = Object.keys(scrollData.scroll_distribution).map(Number);
    const maxCount = Math.max(...Object.values(scrollData.scroll_distribution));

    return (
      <div className="scroll-stats-container">
        <div className="scroll-summary">
          <div className="stat-card">
            <h3>平均スクロール深度</h3>
            <p className="stat-value">{scrollData.avg_scroll_depth.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h3>最大スクロール深度</h3>
            <p className="stat-value">{scrollData.max_scroll_depth.toFixed(1)}%</p>
          </div>
          <div className="stat-card">
            <h3>総スクロール数</h3>
            <p className="stat-value">{scrollData.total_count}</p>
          </div>
        </div>

        <div className="scroll-chart">
          <h3>スクロール深度分布</h3>
          <div className="chart-bars">
            {depths.map((depth) => {
              const count = scrollData.scroll_distribution[depth];
              const percentage = (count / maxCount) * 100;

              return (
                <div key={depth} className="chart-bar-item">
                  <div className="bar-label">{depth}%</div>
                  <div className="bar-container">
                    <div
                      className="bar-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMouseMoveHeatmap = () => {
    if (!mouseMoveData || Object.keys(mouseMoveData.grid_data).length === 0) {
      return <div className="no-data">マウスムーブデータがありません</div>;
    }

    return (
      <div className="heatmap-container">
        <div className="iframe-wrapper">
          <iframe
            src={pageUrl}
            className="page-iframe"
            title="ページプレビュー"
          />
          <canvas
            className="heatmap-canvas"
            width={1200}
            height={800}
          ></canvas>
        </div>
        <div className="heatmap-info">
          <p>総マウスムーブ数: {mouseMoveData.total_count}</p>
          <p>グリッドサイズ: {mouseMoveData.grid_size}px</p>
        </div>
      </div>
    );
  };

  return (
    <div className="heatmap-viewer">
      <div className="viewer-header">
        <button onClick={onBack} className="back-button">
          ← 戻る
        </button>
        <h2>ヒートマップ表示</h2>
      </div>

      <div className="page-info">
        <h3>ページURL</h3>
        <a href={pageUrl} target="_blank" rel="noopener noreferrer">
          {pageUrl}
        </a>
      </div>

      <div className="heatmap-type-selector">
        <button
          className={heatmapType === 'click' ? 'active' : ''}
          onClick={() => setHeatmapType('click')}
        >
          クリックヒートマップ
        </button>
        <button
          className={heatmapType === 'scroll' ? 'active' : ''}
          onClick={() => setHeatmapType('scroll')}
        >
          スクロール深度
        </button>
        <button
          className={heatmapType === 'mousemove' ? 'active' : ''}
          onClick={() => setHeatmapType('mousemove')}
        >
          マウスムーブ
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p className="error-message">{error}</p>
          <button onClick={loadHeatmapData} className="retry-button">
            再試行
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {heatmapType === 'click' && renderClickHeatmap()}
          {heatmapType === 'scroll' && renderScrollStats()}
          {heatmapType === 'mousemove' && renderMouseMoveHeatmap()}
        </>
      )}
    </div>
  );
}
