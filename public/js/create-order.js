document.addEventListener('DOMContentLoaded', () => {
  // Добавляем обработчик кнопки выхода
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = '/login.html';
    });
  }
  const form = document.getElementById('create-order-form');
  const cargoType = document.getElementById('cargoType');
  const customCargoField = document.getElementById('customCargoField');
  const phoneInput = document.getElementById('phone');

  // Показать поле для указания типа груза, если выбрано "Другое"
  cargoType.addEventListener('change', () => {
    customCargoField.style.display = cargoType.value === 'Другое' ? 'block' : 'none';
    if (cargoType.value === 'Другое') {
      document.getElementById('customCargo').setAttribute('required', '');
    } else {
      document.getElementById('customCargo').removeAttribute('required');
    }
  });

  // Форматирование телефона
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let phone = e.target.value.replace(/\D/g, '');
      // Ограничиваем длину номера (11 цифр, включая код страны +7)
      if (phone.length > 11) {
        phone = phone.slice(0, 11);
      }

      // Форматируем номер телефона
      let formattedPhone = '';
      if (phone.length > 0) {
        formattedPhone = `+7(${phone.slice(1, 4)})`;
      }
      if (phone.length > 4) {
        formattedPhone += `-${phone.slice(4, 7)}`;
      }
      if (phone.length > 7) {
        formattedPhone += `-${phone.slice(7, 9)}`;
      }
      if (phone.length > 9) {
        formattedPhone += `-${phone.slice(9, 11)}`;
      }

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

  // Обработка формы
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Вы не авторизованы!');
      window.location.href = '/login.html';
      return;
    }

    const formData = {
      userId,
      transportDate: form.transportDate.value,
      cargoType: cargoType.value === 'Другое' ? form.customCargo.value : cargoType.value,
      cargoWeight: form.cargoWeight.value,
      dimensions: {
        length: form.length.value,
        width: form.width.value,
        height: form.height.value
      },
      fromAddress: form.fromAddress.value,
      toAddress: form.toAddress.value,
      phone: form.phone.value
      // Убрано поле notes
    };

    try {
      const response = await fetch('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Заявка на перевозку успешно создана!');
        window.location.href = '/orders.html';
      } else {
        const error = await response.json();
        alert(error.message || 'Не удалось создать заявку.');
      }
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      alert('Произошла ошибка при создании заявки.');
    }
  });
});
