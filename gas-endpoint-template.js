/**
 * ============================================================================
 * YESS 開発案内登録＆タップ即時集計 Google Apps Script (GAS) 連携スクリプト
 * ============================================================================
 * 
 * 【特徴】
 * 1. 【タップ即時集計（パターンB）】:
 *    訪問者が選択肢（職種、悩み、味、価格帯など）をタップした瞬間に、
 *    自動で「タップ即時集計ログ」シートへ1行ずつリアルタイム記録されます。
 *    メールアドレスを入力せずに離脱したユーザーのタップデータも100%収集できます。
 * 
 * 2. 【通常アンケート送信】:
 *    フォームの「送信」ボタンを押した完全な回答データは
 *    「アンケート回答」シートへ綺麗に整理されて保存されます。
 * 
 * 【更新・デプロイ手順（約1分）】
 * 1. 既存のGoogleスプレッドシートを開き、「拡張機能」 > 「Apps Script」を開きます。
 * 2. 表示されているコードを全削除し、本ファイルのコードをすべて貼り付けます。
 * 3. 右上の「デプロイ」 > 「デプロイを管理」をクリックします。
 * 4. 左側のウェブアプリの横にある「鉛筆アイコン（編集）」をクリックします。
 * 5. バージョン欄で「新バージョン」を選択し、右下の「デプロイ」をクリックすれば完了です！
 *    （※URLは以前と同じものが維持されます）
 */

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // リクエストデータのパース
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }
    
    // 日本時間のフォーマット
    const now = new Date();
    const jstDate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    
    // スプレッドシート数式インジェクション防止用サニタイズ関数
    function sanitize(val) {
      if (typeof val !== 'string') return val;
      const trimmed = val.trim();
      if (/^[=+@-]/.test(trimmed)) {
        return "'" + trimmed;
      }
      return trimmed;
    }

    // =========================================================================
    // 1. タップ即時集計イベントの記録（1タップごとに自動保存）
    // =========================================================================
    if (data && data.type === 'tap_event') {
      let tapSheet = ss.getSheetByName('タップ即時集計ログ');
      if (!tapSheet) {
        tapSheet = ss.insertSheet('タップ即時集計ログ');
      }
      
      // シートが空の場合はヘッダーを作成
      if (tapSheet.getLastRow() === 0) {
        const tapHeaders = [
          'タップ日時 (JST)',
          '設問・カテゴリ',
          '選択項目',
          '操作 (選択/解除)',
          'セッションID',
          '流入元 (Referrer)',
          '端末情報 (UserAgent)'
        ];
        tapSheet.appendRow(tapHeaders);
        const headerRange = tapSheet.getRange(1, 1, 1, tapHeaders.length);
        headerRange.setBackground('#1C1B18');
        headerRange.setFontColor('#C6A87C');
        headerRange.setFontWeight('bold');
        tapSheet.setFrozenRows(1);
      }
      
      const tapRow = [
        jstDate,
        sanitize(data.category || ''),
        sanitize(data.value || ''),
        sanitize(data.action || '選択'),
        sanitize(data.sessionId || ''),
        sanitize(data.referrer || ''),
        sanitize(data.userAgent || '')
      ];
      tapSheet.appendRow(tapRow);

      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', event: 'tap_logged' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 2. 通常アンケート送信の記録（送信ボタン押下時）
    // =========================================================================
    let mainSheet = ss.getSheetByName('アンケート回答') || ss.getActiveSheet();
    
    // スプレッドシートが空の場合はヘッダー行を自動生成
    if (mainSheet.getLastRow() === 0) {
      const headers = [
        '受信日時 (JST)',
        'お仕事内容 (Q1)',
        'PC作業時間 (Q2)',
        '間食で困っていること (Q3)',
        '希望フレーバー (Q4)',
        'リクエスト味 (Q4自由記述)',
        '継続価格帯・PSM (Q5)',
        '健康食品・ヒアリング協力 (Q6)',
        'メールアドレス (Q7)',
        'セッションID',
        '流入元 (Referrer)',
        '端末情報 (UserAgent)'
      ];
      mainSheet.appendRow(headers);
      
      // ヘッダー行のデザイン（背景色・太字）
      const headerRange = mainSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1C1B18');
      headerRange.setFontColor('#C6A87C');
      headerRange.setFontWeight('bold');
      mainSheet.setFrozenRows(1);
    }
    
    // 行データの追加
    const row = [
      jstDate,
      sanitize(data.role || ''),
      data.pcHours || '',
      Array.isArray(data.painPoints) ? data.painPoints.join(' ／ ') : sanitize(data.painPoints || ''),
      Array.isArray(data.preferredFlavors) ? data.preferredFlavors.join(' ／ ') : sanitize(data.preferredFlavors || ''),
      sanitize(data.customFlavorRequest || ''),
      data.priceSensitivity || '',
      data.healthFoodAndInterview || '',
      sanitize(data.email || '（未入力・アンケートのみ）'),
      sanitize(data.sessionId || ''),
      sanitize(data.referrer || ''),
      sanitize(data.userAgent || '')
    ];
    
    mainSheet.appendRow(row);
    
    // 成功レスポンスの返却
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Data saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
