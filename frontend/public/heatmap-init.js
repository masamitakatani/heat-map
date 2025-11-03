/**
 * ヒートマップライブラリ初期化スクリプト
 * Connected One統合用
 */
(function() {
  'use strict';

  // ライブラリが読み込まれるまで待機
  var checkInterval = setInterval(function() {
    if (window.HeatmapAnalytics) {
      clearInterval(checkInterval);

      try {
        // 初期化
        var tracker = new window.HeatmapAnalytics({
          api: {
            apiKey: 'connected-one-odayaka',
            projectId: 'funnel-odayaka',
            baseUrl: 'https://api.connected-one.com/v1'
          },
          debug: true,
          autoStart: true,
        });

        tracker.init();
        window.heatmapTracker = tracker;

        console.log('✅ ヒートマップ初期化完了');
        console.log('📊 Session ID:', tracker.getSessionId());
        console.log('👤 Anonymous ID:', tracker.getAnonymousId());

        // ボタンクリック追跡
        document.addEventListener('click', function(e) {
          var button = e.target.closest('button, a.button, .btn, [role="button"], input[type="submit"]');
          if (button) {
            var buttonText = button.textContent.trim() || button.value || button.getAttribute('aria-label') || 'ボタン';
            console.log('🖱️ ボタンクリック:', buttonText);
          }
        });

        console.log('✅ イベント追跡を開始しました');

      } catch (error) {
        console.error('❌ ヒートマップ初期化エラー:', error);
      }
    }
  }, 100);

  // 10秒経ってもライブラリが読み込まれない場合はタイムアウト
  setTimeout(function() {
    if (!window.HeatmapAnalytics) {
      clearInterval(checkInterval);
      console.error('❌ ヒートマップライブラリが読み込まれませんでした');
    }
  }, 10000);

})();
