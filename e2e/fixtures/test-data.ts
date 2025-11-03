/**
 * E2Eテスト用のテストデータ
 */

export const testUrls = {
  landingPage: 'http://localhost:5173',
  optinPage: 'http://localhost:5173/optin',
  thanksPage: 'http://localhost:5173/thanks',
};

export const testFunnel = {
  name: 'テストファネル',
  steps: [
    {
      name: 'ランディングページ',
      url: testUrls.landingPage,
      order: 1,
    },
    {
      name: 'オプトインページ',
      url: testUrls.optinPage,
      order: 2,
    },
    {
      name: 'サンクスページ',
      url: testUrls.thanksPage,
      order: 3,
    },
  ],
};

export const clickTestData = {
  clicks: [
    { x: 100, y: 200, timestamp: Date.now() },
    { x: 150, y: 250, timestamp: Date.now() + 1000 },
    { x: 200, y: 300, timestamp: Date.now() + 2000 },
  ],
};

export const scrollTestData = {
  scrolls: [
    { depth: 10, timestamp: Date.now() },
    { depth: 50, timestamp: Date.now() + 1000 },
    { depth: 100, timestamp: Date.now() + 2000 },
  ],
};

export const mouseMoveTestData = {
  moves: [
    { x: 50, y: 100, timestamp: Date.now() },
    { x: 100, y: 150, timestamp: Date.now() + 100 },
    { x: 150, y: 200, timestamp: Date.now() + 200 },
  ],
};

export const viewportSizes = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  minWidth: { width: 320, height: 568 },
};
