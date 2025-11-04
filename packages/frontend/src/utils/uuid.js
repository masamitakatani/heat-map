/**
 * UUID v4生成ユーティリティ
 * crypto.randomUUID()が使えない環境でも動作
 */
/**
 * UUID v4を生成
 */
export function generateUUID() {
    // 最新ブラウザではcrypto.randomUUID()を使用
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // フォールバック実装
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
