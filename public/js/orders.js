document.addEventListener('DOMContentLoaded', async () => {
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

    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('Вы не авторизованы!');
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`/orders?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Не удалось загрузить заявки');
        }
        const orders = await response.json();
        const ordersList = document.getElementById('orders');

        if (orders.length === 0) {
            ordersList.innerHTML = '<p>У вас пока нет заявок</p>';
            return;
        }

        orders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
  <div class="order-card" data-order-id="${order.id}">
    <h3>Бронирование #${order.id}</h3>
    <p><strong>Дата и время:</strong> ${new Date(order.reservation_datetime).toLocaleString()}</p>
    <p><strong>Гостей:</strong> ${order.guests}</p>
<p><strong>Телефон:</strong> ${order.phone.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1($2)-$3-$4-$5')}</p>    <p><strong>Статус:</strong> ${order.status}</p>

    <div class="review-section">
      ${order.review_text ? `
        <div class="existing-review">
          <h4>Ваш отзыв:</h4>
          <div class="stars-rating" data-rating="${order.review_rating}">
            ${[1, 2, 3, 4, 5].map(i =>
                `<span class="star ${i <= order.review_rating ? 'active' : ''}">★</span>`
            ).join('')}
          </div>
          <p>${order.review_text}</p>
        </div>
      ` : `
        <button class="btn btn-small add-review-btn">Оставить отзыв</button>
        <div class="review-form">
          <h4>Оцените посещение:</h4>
          <div class="stars-rating">
            ${[1, 2, 3, 4, 5].map(i =>
                `<span class="star" data-value="${i}">★</span>`
            ).join('')}
          </div>
          <textarea placeholder="Ваш отзыв"></textarea>
          <button class="btn btn-small submit-review-btn">Отправить отзыв</button>
        </div>
      `}
    </div>
  </div>
`;

            ordersList.appendChild(li);

            // Остальной код обработки отзывов остается без изменений
            if (!order.review_text) {
                const card = li.querySelector('.order-card');
                const stars = card.querySelectorAll('.star[data-value]');
                let selectedRating = 0;

                stars.forEach(star => {
                    star.addEventListener('click', () => {
                        const value = parseInt(star.dataset.value);
                        selectedRating = value;
                        stars.forEach((s, i) => {
                            s.classList.toggle('active', i < value);
                        });
                    });
                });

                card.querySelector('.add-review-btn').addEventListener('click', (e) => {
                    e.target.style.display = 'none';
                    card.querySelector('.review-form').style.display = 'block';
                });

                card.querySelector('.submit-review-btn').addEventListener('click', async () => {
                    const reviewText = card.querySelector('textarea').value.trim();
                    if (selectedRating === 0) {
                        alert('Пожалуйста, оцените услугу');
                        return;
                    }
                    if (!reviewText) {
                        alert('Пожалуйста, напишите отзыв');
                        return;
                    }

                    try {
                        const response = await fetch(`/orders/${order.id}/review`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                rating: selectedRating,
                                text: reviewText
                            }),
                        });

                        const result = await response.json();

                        if (response.ok) {
                            alert(result.message);
                            location.reload();
                        } else {
                            throw new Error(result.message || 'Ошибка при отправке отзыва');
                        }
                    } catch (error) {
                        console.error('Ошибка:', error);
                        alert(error.message || 'Не удалось отправить отзыв. Пожалуйста, попробуйте позже.');
                    }
                });
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        alert('Произошла ошибка при загрузке заявок');
    }
});