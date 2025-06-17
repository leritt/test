document.addEventListener('DOMContentLoaded', () => {
    // Обработчик для форматирования телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let phone = e.target.value.replace(/\D/g, '');
            if (phone.length > 11) phone = phone.slice(0, 11);
            
            let formattedPhone = '';
            if (phone.length > 0) formattedPhone = `+7(${phone.slice(1, 4)})`;
            if (phone.length > 4) formattedPhone += `-${phone.slice(4, 7)}`;
            if (phone.length > 7) formattedPhone += `-${phone.slice(7, 9)}`;
            if (phone.length > 9) formattedPhone += `-${phone.slice(9, 11)}`;
            
            e.target.value = formattedPhone;
        });

        phoneInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteText = (e.clipboardData || window.clipboardData).getData('text');
            const digitsOnly = pasteText.replace(/\D/g, '');
            phoneInput.value = digitsOnly;
            phoneInput.dispatchEvent(new Event('input'));
        });
    }

    // Валидация логина при вводе
    const loginInput = document.getElementById('login');
    if (loginInput) {
        loginInput.addEventListener('input', (e) => {
            const login = e.target.value;
            // Удаляем все символы, кроме кириллицы
            e.target.value = login.replace(/[^А-Яа-яЁё]/g, '');
        });
    }

    // Обработчик отправки формы
    document.getElementById('registration-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const login = document.getElementById('login').value;
        const password = document.getElementById('password').value;
        const message = document.getElementById('message');
        
        // Проверка логина
        if (login.length < 6) {
            message.textContent = 'Логин должен содержать минимум 6 кириллических символов';
            message.style.color = 'red';
            return;
        }

        // Проверка пароля
        if (password.length < 6) {
            message.textContent = 'Пароль должен содержать минимум 6 символов';
            message.style.color = 'red';
            return;
        }

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            
            if (response.ok) {
                message.textContent = result.message;
                message.style.color = 'green';
                
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                message.textContent = result.message;
                message.style.color = 'red';
            }
        } catch (err) {
            console.error('Ошибка:', err);
            message.textContent = 'Произошла ошибка при отправке данных';
            message.style.color = 'red';
        }
    });
});