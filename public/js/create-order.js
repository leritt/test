document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = '/login.html';
    });
  }

  const form = document.getElementById('create-order-form');
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Вы не авторизованы!');
      window.location.href = '/login.html';
      return;
    }

    // Получаем форму
    const form = e.target;

    // Получаем значения из формы
    const formData = new FormData(form);
    const reservationDateTime = formData.get('reservationDateTime');
    const guests = formData.get('guests');
    const phone = formData.get('phone');

    // Проверка данных
    if (!reservationDateTime || !guests || !phone) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const response = await fetch('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          reservationDateTime,
          guests: parseInt(guests),
          phone
        }),
      });

      if (response.ok) {
        alert('Бронирование успешно создано!');
        window.location.href = '/orders.html';
      } else {
        const error = await response.json();
        alert(error.message || 'Не удалось создать бронирование.');
      }
    } catch (error) {
      console.error('Ошибка создания бронирования:', error);
      alert('Произошла ошибка при создании бронирования.');
    }
  });
});
