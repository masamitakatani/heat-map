/**
 * LocalStorage管理モジュール
 * 要件: 5MB制限、容量超過時の自動削除（FIFO）
 */
/** LocalStorageキー */
const STORAGE_KEY = 'heatmap_analytics_data';
/** LocalStorage容量制限（バイト） */
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
/** 警告しきい値（60%） */
const WARNING_THRESHOLD = MAX_STORAGE_SIZE * 0.6;
/**
 * LocalStorageに保存されているデータサイズを計算（バイト）
 */
export function getStorageSize() {
    let totalSize = 0;
    for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    return totalSize;
}
/**
 * データをLocalStorageから読み込む
 */
export function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    catch (error) {
        console.error('[Heatmap] LocalStorage読み込みエラー:', error);
        // データ破損時は削除して初期化
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}
/**
 * データをLocalStorageに保存
 * 容量超過時は古いイベントを削除（FIFO）
 */
export function saveData(data) {
    try {
        const jsonString = JSON.stringify(data);
        const dataSize = jsonString.length;
        // 容量チェック
        if (dataSize > MAX_STORAGE_SIZE) {
            console.warn('[Heatmap] データサイズが5MBを超えています。古いイベントを削除します。');
            // 古いイベントを削除
            const reducedData = reduceEventData(data);
            return saveData(reducedData);
        }
        // 警告しきい値チェック
        if (dataSize > WARNING_THRESHOLD) {
            console.warn(`[Heatmap] LocalStorage使用量が60%を超えました（${(dataSize / 1024 / 1024).toFixed(2)}MB）`);
            // ユーザーに警告表示（Phase 4で実装）
            showStorageWarning();
        }
        localStorage.setItem(STORAGE_KEY, jsonString);
        return true;
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.error('[Heatmap] LocalStorage容量超過');
            // 古いデータを削除してリトライ
            const reducedData = reduceEventData(data);
            return saveData(reducedData);
        }
        console.error('[Heatmap] LocalStorage保存エラー:', error);
        return false;
    }
}
/**
 * 古いイベントデータを削除（FIFO方式）
 */
function reduceEventData(data) {
    const pendingEvents = {
        clicks: data.pendingEvents.clicks.slice(-50), // 最新50件のみ保持
        scrolls: data.pendingEvents.scrolls.slice(-50),
        mouseMoves: data.pendingEvents.mouseMoves.slice(-100), // マウス移動は多めに保持
    };
    return {
        ...data,
        pendingEvents,
    };
}
/**
 * 容量警告を表示（Phase 4で実装予定）
 */
function showStorageWarning() {
    // Phase 4でオーバーレイUIに警告メッセージを表示
    console.warn('[Heatmap] LocalStorage容量が不足しています。古いデータを削除することをおすすめします。');
}
/**
 * 全データをクリア
 */
export function clearData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[Heatmap] LocalStorageをクリアしました');
    }
    catch (error) {
        console.error('[Heatmap] LocalStorageクリアエラー:', error);
    }
}
/**
 * 初期データを作成
 */
export function createInitialData(anonymousId, sessionId) {
    return {
        overlayState: {
            isVisible: false,
            mode: 'click',
        },
        sessionId,
        anonymousId,
        pendingEvents: {
            clicks: [],
            scrolls: [],
            mouseMoves: [],
        },
        overlayPosition: {
            x: window.innerWidth - 320, // 右下に配置
            y: window.innerHeight - 200,
        },
    };
}
/**
 * データの整合性チェック
 */
export function validateData(data) {
    if (typeof data !== 'object' || data === null)
        return false;
    const d = data;
    return (typeof d.sessionId === 'string' &&
        typeof d.anonymousId === 'string' &&
        typeof d.overlayState === 'object' &&
        typeof d.pendingEvents === 'object');
}
