document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', function () {
        this.parentElement.parentElement.style.display = 'none';
    });
});

function showLoginForm() {
    var modal = document.getElementById('login-modal');
    modal.style.display = 'flex';
}

function showRegisterForm() {
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('register-modal').style.display = 'flex';
}

// 選單設定
document.getElementById('avatar').addEventListener('click', function () {
    var menu = document.getElementById('menu');
    menu.classList.toggle('active');
});

// 點擊其他地方時關閉選單
window.onclick = function (event) {
    if (!event.target.matches('#avatar')) {
        var menu = document.getElementById('menu');
        if (menu.classList.contains('active')) {
            menu.classList.remove('active');
        }
    }
};

// 登入表單提交處理
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var formData = new FormData(this);
    fetch('/login', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            var errorElement = document.getElementById('login-error');
            errorElement.style.display = 'block';
               errorElement.textContent = data.error;
        }
    })
    .catch(error => console.error('Error:', error));
});