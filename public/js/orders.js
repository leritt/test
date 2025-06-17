document.addEventListener('DOMContentLoaded', async () => {
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
      <h3>Заявка #${order.id}</h3>
      <p><strong>Дата перевозки:</strong> ${new Date(order.transport_date).toLocaleString()}</p>
      <p><strong>Тип груза:</strong> ${order.cargo_type}</p>
      <p><strong>Вес:</strong> ${order.cargo_weight} кг</p>
      <p><strong>Габариты:</strong> ${order.length}×${order.width}×${order.height} см</p>
      <p><strong>Откуда:</strong> ${order.from_address}</p>
      <p><strong>Куда:</strong> ${order.to_address}</p>
      <p><strong>Статус:</strong> ${order.status}</p>
      
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
            <h4>Оцените услугу:</h4>
            <div class="stars-rating">
              ${[1, 2, 3, 4, 5].map(i =>
                `<span class="star" data-value="${i}">★</span>`
            ).join('')}
            </div>
            <textarea placeholder="Ваш отзыв о качестве услуги"></textarea>
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

                        if (response.ok) {
                            alert('Спасибо за ваш отзыв!');
                            location.reload();
                        } else {
                            throw new Error('Ошибка при отправке отзыва');
                        }
                    } catch (error) {
                        console.error('Ошибка:', error);
                        alert('Не удалось отправить отзыв');
                    }
                });
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        alert('Произошла ошибка при загрузке заявок');
    }
});