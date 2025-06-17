document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const login = document.getElementById('login').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ login, password }),
                });

                console.log('Статус ответа:', response.status);
                const data = await response.json();
                console.log('Ответ сервера:', data);

                if (data.userId) {
                    localStorage.setItem('userId', data.userId);
                    window.location.href = '/orders.html';
                } else {
                    alert(data.message || 'Ошибка авторизации. Проверьте логин и пароль.');
                }
            } catch (error) {
                console.error('Ошибка авторизации:', error);
                alert('Ошибка сервера. Попробуйте позже.');
            }
        });
    } else {
        console.error('Форма авторизации не найдена.');
    }
});