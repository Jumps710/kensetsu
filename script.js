function handleSubmit(form) {
  document.getElementById('loadingMessage').textContent = "少しお待ちください...";
  document.getElementById('errorMessage').textContent = "";

  var formData = {
    companyName: form.companyName.value,
    sei: form.sei.value,
    mei: form.mei.value,
    phone: form.phone.value
  };

const params = new URLSearchParams();
params.append('companyName', form.companyName.value);
params.append('sei', form.sei.value);
params.append('mei', form.mei.value);
params.append('phone', form.phone.value);

fetch('https://script.google.com/macros/s/AKfycbyHHU5TThnk7mig-rjC2FLxEbCMhoXIhAhWMV0HY319jrmpRBKpc1A8ThXuYKJ74bfv/exec', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
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
