function handleSubmit(form) {
  document.getElementById('loadingMessage').textContent = "少しお待ちください...";
  document.getElementById('errorMessage').textContent = "";

  var formData = {
    companyName: form.companyName.value,
    sei: form.sei.value,
    mei: form.mei.value,
    phone: form.phone.value
  };

  fetch('https://script.google.com/macros/s/WEB_APP_URL/exec', {
    method: 'POST',
    body: JSON.stringify(formData),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      document.getElementById('errorMessage').textContent = data.message;
    } else {
      window.open('success.html?email=' + encodeURIComponent(data.email) + '&password=' + encodeURIComponent(data.password), '_blank');
    }
    document.getElementById('loadingMessage').textContent = "";
  })
  .catch(error => {
    document.getElementById('loadingMessage').textContent = "";
    document.getElementById('errorMessage').textContent = "エラーが発生しました: " + error;
  });
}
