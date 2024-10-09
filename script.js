// API Gatewayのエンドポイント
const apiEndpoint = 'https://00in1sa3eg.execute-api.ap-northeast-1.amazonaws.com/kensetsu';

function handleSubmit(form) {
  document.getElementById('loadingMessage').textContent = "少しお待ちください...";
  document.getElementById('errorMessage').textContent = "";

  // フォームデータをJSON形式で準備
  const formData = {
    companyName: form.companyName.value,
    sei: form.sei.value,
    mei: form.mei.value,
    phone: form.phone.value,
    siteId: 'siteA'  // サンプル値としてsiteIdを設定
  };

  // fetchリクエストの設定
  fetch(apiEndpoint, {
    method: 'POST',  // POSTリクエスト
    headers: {
      'Content-Type': 'application/json'  // JSON形式で送信
    },
    body: JSON.stringify(formData)  // JSON形式に変換
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      document.getElementById('errorMessage').textContent = data.message;
    } else {
      // 成功時にsuccess.htmlを開く
      window.open('success.html?email=' + encodeURIComponent(data.email) + '&password=' + encodeURIComponent(data.password), '_blank');
    }
    document.getElementById('loadingMessage').textContent = "";
  })
  .catch(error => {
    document.getElementById('loadingMessage').textContent = "";
    document.getElementById('errorMessage').textContent = "エラーが発生しました: " + error;
    console.error('Error:', error);  // エラーログをコンソールに表示
  });
}
