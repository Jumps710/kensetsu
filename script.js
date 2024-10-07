// フォームへのアクセス処理
function doGet(e) {
  let page = e.parameter.page;  // URLのパラメータから`page`を取得
  if (!page) {
    page = 'index';  // `page`が指定されていない場合、デフォルトで`index`ページを表示
  }

  // HTMLテンプレートの作成
  const template = HtmlService.createTemplateFromFile(page);
  
  // 受け取ったパラメータをテンプレートに渡す
  for (const key in e.parameter) {
    template[key] = e.parameter[key];  // 各パラメータをテンプレート変数にセット
  }

  // テンプレートを評価し、ページを返す
  return template.evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)  // ページをiframe内で表示できるように設定
    .setTitle(page)  // ページタイトルをセット
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');  // モバイル対応のmetaタグを追加
}

// スクリプトの公開URLを取得する関数
function getAppUrl() {
  return ScriptApp.getService().getUrl();  // 現在のWebアプリのURLを取得して返す
}

// フォーム送信処理を行う関数
function submitForm(formData) {
  try {
    const sheet = SpreadsheetApp.openById('13eyg7H0HT-tFSnDelvcBAvmyW1eRMQ02dDgDJAF_wcc').getSheetByName('list');  // 該当のスプレッドシートを開く
    const lastRow = sheet.getLastRow();  // 最終行を取得
    const phone = formData.phone;  // フォームから送信された電話番号を取得

    // ユニークIDの生成
    const uniqueId = Utilities.getUuid();  // UUIDを生成し、ユニークIDとして使用

    // 重複チェック（既存データと照合）
    if (lastRow > 1) {
      const data = sheet.getRange(2, 3, lastRow - 1, 3).getValues();  // シートのデータを取得
      for (let i = 0; i < data.length; i++) {
        // 姓、名、電話番号の組み合わせが一致するデータが既に存在する場合
        if (data[i][0] === formData.sei && data[i][1] === formData.mei && data[i][2] === phone) {
          return {error: true, message: 'すでに登録されています'};  // エラーメッセージを返す
        }
      }
    }

    const timestamp = new Date();  // 現在日時を取得
    const email = phone + '@wken';  // ユーザーのメールアドレスを電話番号から生成
    const password = 'works2024';  // 固定のパスワードを設定（デモ用）

    // スプレッドシートにデータを追加
    sheet.appendRow([timestamp, formData.companyName, formData.sei, formData.mei, "'" + phone, uniqueId, email, password]);

    // LINE WORKS API トークンを取得
    const tokenData = jwt();

    // LINE WORKSユーザーを作成
    const result = createLineWorksUser(tokenData, formData, email, password);

    // ユーザー作成に失敗した場合、エラーメッセージを返す
    if (result.error) {
      return {error: true, message: 'ユーザ作成に失敗しました: ' + result.message};
    }

    // 成功時にメールとパスワードを返す
    return {error: false, email: email, password: password};

  } catch (e) {
    Logger.log('Error in submitForm: ' + e.message);  // エラーログを記録
    return {error: true, message: 'サーバー側でエラーが発生しました: ' + e.message};  // エラーメッセージを返す
  }
}

// LINE WORKSユーザーを作成する関数
function createLineWorksUser(tokenData, formData, email, password) {
  const url = 'https://www.worksapis.com/v1.0/users';  // LINE WORKS APIのエンドポイントURL
  const payload = {
    "domainId": tokenData.domainId,  // トークンから取得したドメインID
    "email": email,  // 作成するユーザーのメールアドレス
    "passwordConfig": {
      "passwordCreationType": "ADMIN",  // 管理者によるパスワード設定
      "changePasswordAtNextLogin": false,  // 初回ログイン時のパスワード変更を不要にする
      "password": password  // パスワードを設定
    },
    "userName": {
      "lastName": formData.companyName,  // ユーザーの会社名（姓）
      "firstName": formData.sei + ' ' + formData.mei  // ユーザーのフルネーム（名）
    },

    "organizations": [  // 組織情報の設定
      {
        "domainId": 400507005,
        "primary": true,
        "orgUnits": [
          {
            "orgUnitId": "externalKey:t_569vw@wken",  // 組織ユニットID
            "primary": true,
          }
        ]
      }
    ],
    "telephone": formData.phone  // 電話番号
  };

  const options = {
    'method': 'post',  // HTTP POSTメソッドを指定
    'contentType': 'application/json',  // コンテンツタイプをJSONに設定
    'headers': {
      'Authorization': 'Bearer ' + tokenData.token  // 認証ヘッダーにトークンを含める
    },
    'payload': JSON.stringify(payload)  // ペイロード（リクエストデータ）をJSON形式に変換
  };

  try {
    const response = UrlFetchApp.fetch(url, options);  // APIリクエストを送信
    if (response.getResponseCode() == 201) {  // 成功時のステータスコード（201 Created）をチェック
      return {error: false};  // 正常に作成された場合
    } else {
      return {error: true, message: 'LINE WORKSユーザ作成に失敗しました。コード: ' + response.getResponseCode()};  // エラーメッセージを返す
    }
  } catch (e) {
    return {error: true, message: 'APIリクエスト中にエラーが発生しました: ' + e.message};  // エラーメッセージを返す
  }
}

// JWTを生成し、LINE WORKS APIに認証する関数。LW Developers Consoleよりアプリを作成し、認証情報をプロパティとしてセットする
function jwt() {
  var clientId = "Fbwo2R87lF3vZs0A76ik";  // LWアプリのクライアントID
  var clientSecret = "TKaOyt2YjH";  // LWアプリのクライアントシークレット
  var serviceaccountId = "hqo85.serviceaccount@wken";  // LWアプリのサービスアカウントID
  var domainId = "400507005";  // LWのドメインID
  var scope = "audit.read,directory,orgunit,user,bot";  // 認可スコープ

  // プライベートキーの取得
  var privateKey = DriveApp.getFilesByName('private_20240912175304.key').next().getBlob().getDataAsString("utf-8");　// プライベートキーは、LW Dev ConsoleのアプリよりDL

  // JWTヘッダーをBase64でエンコード
  var header = Utilities.base64Encode(JSON.stringify({ "alg": "RS256", "typ": "JWT" }), Utilities.Charset.UTF_8);
  
  // JWTペイロード（クレームセット）の作成
  var claimSet = JSON.stringify({
    "iss": clientId,  // 発行者
    "sub": serviceaccountId,  // サービスアカウントID
    "iat": Math.floor(Date.now() / 1000),  // 発行時刻
    "exp": Math.floor(Date.now() / 1000 + 2000)  // 有効期限
  });

  // エンコードしたヘッダーとクレームセットを連結
  var encodeText = header + "." + Utilities.base64Encode(claimSet, Utilities.Charset.UTF_8);
  
  // RSA-SHA256で署名を生成
  var signature = Utilities.computeRsaSha256Signature(encodeText, privateKey);
  
  // JWTトークンの完成
  var jwtToken = encodeText + "." + Utilities.base64Encode(signature);

  // LINE WORKS APIトークン取得用のリクエストを送信
  var uri = 'https://auth.worksmobile.com/oauth2/v2.0/token';
  var requestBody = {
    "grant_type": encodeURI("urn:ietf:params:oauth:grant-type:jwt-bearer"),
    "assertion": jwtToken,  // 生成したJWTトークン
    "client_id": clientId,  // クライアントID
    "client_secret": clientSecret,  // クライアントシークレット
    "scope": scope  // 認可スコープ
  };
  var options = {
    'method': 'post',  // HTTP POSTメソッド
    'headers': { 'Content-Type': 'application/x-www-form-urlencoded' },
    "payload": requestBody  // リクエストデータ
  };

  // トークン取得リクエストの実行
  var res = UrlFetchApp.fetch(uri, options);
  var LWAccessToken = JSON.parse(res).access_token;  // トークンを取得

  return {
    'domainId': domainId,  // LWのドメインID
    'token': LWAccessToken  // 取得したLWアクセストークン
  };
}
