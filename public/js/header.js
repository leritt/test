document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userId'); // Удаляем ID пользователя
      alert('Вы вышли из системы.');
      window.location.href = '/login.html'; // Перенаправление на страницу авторизации
    });
  }
});