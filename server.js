const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const pool = require('./db'); // Импортируем подключение к базе данных
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Количество раундов хеширования

app.use(bodyParser.json());
app.use(express.json());

// Подключение статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для главной страницы
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Маршрут для авторизации
app.post('/login', async (req, res) => {
  const { login, password } = req.body;
  console.log('Попытка входа с данными:', { login, password });

  try {
    // Получаем пользователя с хешем пароля
    const user = await pool.query(
      'SELECT id, password FROM users WHERE login = $1',
      [login]
    );

    console.log('Результат запроса:', user.rows);

    if (user.rows.length === 0) {
      console.log('Пользователь не найден');
      return res.status(401).json({ message: 'Неверный логин или пароль.' });
    }

    // Сравниваем хеши
    const passwordMatch = await bcrypt.compare(password, user.rows[0].password);

    if (passwordMatch) {
      res.json({ userId: user.rows[0].id });
    } else {
      console.log('Пароль не совпадает');
      res.status(401).json({ message: 'Неверный логин или пароль.' });
    }
  } catch (err) {
    console.error('Ошибка при авторизации:', err.message);
    res.status(500).json({ message: 'Ошибка сервера.' });
  }
});

// Маршрут для получения заявок
app.get('/orders', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: 'Отсутствует идентификатор пользователя.' });
  }

  try {
    const orders = await pool.query(
      `SELECT 
        id, reservation_datetime, guests, phone, status, review_rating, review_text
       FROM orders 
       WHERE user_id = $1 
       ORDER BY reservation_datetime DESC`,
      [userId]
    );
    res.json(orders.rows);
  } catch (err) {
    console.error('Ошибка получения бронирований:', err);
    res.status(500).json({ message: 'Ошибка сервера при получении бронирований' });
  }
});


// Роут для обработки регистрации
app.post('/register', async (req, res) => {
  const { name, surname, phone, email, login, password } = req.body;

  // Проверка логина (кириллица, минимум 6 символов)
  const loginRegex = /^[А-Яа-яЁё]{6,}$/;
  if (!loginRegex.test(login)) {
    return res.status(400).json({ message: 'Логин должен содержать только кириллические символы и быть не менее 6 символов.' });
  }

  // Проверка формата телефона
  const phoneRegex = /^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Номер телефона должен быть в формате +7(XXX)-XXX-XX-XX.' });
  }

  if (!name || !surname || !phone || !email || !login || !password) {
    return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
  }

  const cyrillicRegex = /^[А-Яа-яЁё\s]+$/;
  if (!cyrillicRegex.test(name) || !cyrillicRegex.test(surname)) {
    return res.status(400).json({ message: 'ФИО должно содержать только кириллические символы.' });
  }

  try {
    // Проверка на уникальность логина
    const userExists = await pool.query(
      'SELECT id FROM users WHERE login = $1',
      [login]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким логином уже существует.' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Вставка данных в таблицу
    const result = await pool.query(
      `INSERT INTO users (name, surname, phone, email, login, password)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, surname, phone, email, login, hashedPassword]
    );

    res.status(201).json({ message: 'Пользователь зарегистрирован!', userId: result.rows[0].id });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

app.post('/orders', async (req, res) => {
  const { userId, reservationDateTime, guests, phone } = req.body;

  // Проверка данных
  if (!userId || !reservationDateTime || !guests || !phone) {
    return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO orders (
                user_id, reservation_datetime, guests, phone
            ) VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, reservationDateTime, guests, phone.replace(/\D/g, '')] // Сохраняем только цифры
    );

    res.status(201).json({
      message: 'Бронирование успешно создано',
      orderId: result.rows[0].id
    });
  } catch (error) {
    console.error('Ошибка создания бронирования:', error);
    res.status(500).json({ message: 'Ошибка сервера при бронировании' });
  }
});



// Авторизация администратора
app.post('/admin/login', (req, res) => {
  const { login, password } = req.body;

  if (login === 'admin' && password === 'gruzovik2024') {
    res.status(200).json({ message: 'Добро пожаловать, администратор!' });
  } else {
    res.status(401).json({ message: 'Неверные логин или пароль' });
  }
});

app.get('/admin/orders', async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT 
        orders.id,
        orders.reservation_datetime as transport_date,
        orders.guests,
        orders.phone,
        orders.status,
        users.name,
        users.surname
      FROM orders
      INNER JOIN users ON orders.user_id = users.id
      ORDER BY orders.reservation_datetime DESC
    `);
    
    res.json(orders.rows);
  } catch (err) {
    console.error('Ошибка получения заявок:', err);
    res.status(500).json({ 
      message: 'Ошибка сервера при получении заявок',
      error: err.message 
    });
  }
});
// Обновление статуса заявки
// Обновление статуса заявки
app.put('/admin/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Проверяем допустимые статусы (должны соответствовать CHECK в таблице)
  const allowedStatuses = ['новая', 'подтверждена', 'отменена'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Недопустимый статус заявки' });
  }

  try {
    await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );
    res.status(200).json({ message: 'Статус заявки обновлен' });
  } catch (err) {
    console.error('Ошибка обновления заявки:', err);
    res.status(500).json({ message: 'Ошибка сервера при обновлении заявки' });
  }
});

// Удаление заявки
app.delete('/admin/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.status(200).json({ message: 'Заявка успешно удалена' });
  } catch (err) {
    console.error('Ошибка удаления заявки:', err);
    res.status(500).json({ message: 'Ошибка сервера при удалении заявки' });
  }
});

// Добавление отзыва к заявке
app.post('/orders/:id/review', async (req, res) => {
  const { id } = req.params;
  const { rating, text } = req.body;

  // Проверка данных
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Рейтинг должен быть от 1 до 5' });
  }
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ message: 'Текст отзыва не может быть пустым' });
  }

  try {
    // Проверяем существование заказа
    const orderExists = await pool.query(
      'SELECT id FROM orders WHERE id = $1',
      [id]
    );

    if (orderExists.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    // Обновляем отзыв
    await pool.query(
      `UPDATE orders SET 
                review_rating = $1, 
                review_text = $2,
                reviewed_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
      [rating, text.trim(), id]
    );

    res.status(200).json({
      success: true,
      message: 'Отзыв успешно сохранен'
    });
  } catch (err) {
    console.error('Ошибка сохранения отзыва:', err);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при сохранении отзыва',
      error: err.message
    });
  }
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});


