const { Pool } = require('pg'); // Импортируем Pool из библиотеки pg для работы с базой данных.

const pool = new Pool({
    user: 'postgres',            // Имя пользователя PostgreSQL
    host: 'localhost',           // Адрес базы данных (localhost, если на этом же компьютере)
    database: 'gruzovozoff', // Имя базы данных
    password: '',   // Пароль для подключения (тот, который ты установила при установке PostgreSQL)
    port: 5432,                  // Порт (по умолчанию 5432)
});

// Экспортируем подключение, чтобы использовать в других частях проекта
module.exports = pool;
