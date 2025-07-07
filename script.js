const analyzeButton = document.querySelector('.main-content__button');
const chatInput = document.getElementById('chat-input');
const generatedContent = document.getElementById('generated-content');
const HISTORY_KEY = 'requestsHistory';
const API_URL = 'http://77.110.112.103:8000/api/summary/create/url'; // Основной endpoint API

// Загружаем историю при старте
document.addEventListener('DOMContentLoaded', () => {
    const history = getHistory();
    renderHistory(history);
});

// Обработчик кнопки анализа
analyzeButton.addEventListener('click', async function() {
    const url = encodeURIComponent(chatInput.value.trim());
    
    if (!url) {
        alert('Пожалуйста, введите ссылку!');
        return;
    }

    if (!isValidUrl(decodeURIComponent(url))) {
        alert('❌ Ошибка! Ссылка должна начинаться с http:// или https:// и содержать домен');
        chatInput.focus();
        return;
    }

    try {
        // Показываем индикатор загрузки
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'Анализируем...';
        
        // Отправляем GET запрос к API с параметром URL
        const response = await fetch(`${API_URL}?url=${url}`)

        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }

        const data = await response.json();
        
        // Создаем объект для истории
        const historyItem = {
            url: decodeURIComponent(url),
            summary: data.summary,
            tags: data.tags,
            timestamp: new Date().toISOString()
        };

        // Добавляем в историю и отображаем
        addToHistory(historyItem);
        chatInput.value = ''; // Очищаем поле ввода
        
    } catch (error) {
        console.error('Ошибка при анализе:', error);
        generatedContent.innerHTML = `
            <div class="error-card" style="color: red; padding: 15px; border: 1px solid red; border-radius: 8px;">
                Ошибка при анализе ссылки: ${error.message}
            </div>
        `;
    } finally {
        // Восстанавливаем кнопку
        analyzeButton.disabled = false;
        analyzeButton.textContent = 'Анализировать';
    }
});

// Остальные функции остаются без изменений
function getHistory() {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

function addToHistory(item) {
    const history = getHistory();
    history.unshift(item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory(history);
}

function renderHistory(history) {
    generatedContent.innerHTML = history.map(item => `
        <div class="card" style="
            margin-bottom: 20px;
            padding: 20px;
            border-radius: 12px;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <a href="${item.url}" target="_blank" style="color: #5a189a; word-break: break-all;">${item.url}</a>
                <small style="color: #666;">${formatDate(item.timestamp)}</small>
            </div>
            <p style="color: blue; margin: 5px 0;">${item.tags.join(' ')}</p>
            <p style="margin: 10px 0; line-height: 1.5;">${item.summary.replace(/\n/g, '<br>')}</p>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="action-btn" onclick="copyToClipboard(this)">Копировать</button>
                <button class="action-btn" onclick="deleteCard(this)">Удалить</button>
            </div>
        </div>
    `).join('');
}

function copyToClipboard(button) {
    const card = button.closest('.card');
    const content = card.querySelector('p:last-child').innerText;
    navigator.clipboard.writeText(content)
        .then(() => {
            const originalText = button.textContent;
            button.textContent = 'Скопировано!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Ошибка копирования:', err);
        });
}

function deleteCard(button) {
    const card = button.closest('.card');
    const url = card.querySelector('a').href;
    
    const history = getHistory();
    const updatedHistory = history.filter(item => item.url !== url);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    card.remove();
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
}

function isValidUrl(url) {
    try {
        return /^https?:\/\//i.test(url) && new URL(url);
    } catch {
        return false;
    }
}

// Стили для кнопок действий
const style = document.createElement('style');
style.textContent = `
    .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        background-color: #5a189a;
        color: white;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .action-btn:hover {
        background-color: #240046;
    }
`;
document.head.appendChild(style);