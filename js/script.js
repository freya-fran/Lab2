/**
 * ==========================================================
 * Файл: js/script.js
 * Назначение: Логика интерфейса и интерактивности для сайта "История Windows"
 * Автор: Лейн (учебный проект)
 * Версия: 2.0
 * ==========================================================
 */

"use strict";

/* ==========================================================
   🔧 ВСПОМОГАТЕЛЬНЫЕ УТИЛИТЫ И КОНСТАНТЫ
   ========================================================== */

// Константы для ключей localStorage
const STORAGE_KEYS = {
  THEME: 'site-theme'
};

// Конфигурация приложения
const CONFIG = {
  SCROLL_THRESHOLD: 300,
  DEBOUNCE_DELAY: 100,
  ANIMATION_DELAY: 120
};

/**
 * Функция debounce (устраняет частые вызовы функции)
 * @param {Function} fn - функция для ограничения вызовов
 * @param {number} delay - время задержки в миллисекундах
 * @returns {Function}
 */
function debounce(fn, delay = CONFIG.DEBOUNCE_DELAY) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Плавный скролл к указанному элементу
 * @param {HTMLElement} element - элемент, к которому нужно проскроллить
 * @param {Object} options - дополнительные опции
 */
function smoothScrollToElement(element, options = {}) {
  if (!element) {
    console.warn('Элемент для скролла не найден');
    return;
  }

  const defaultOptions = {
    behavior: 'smooth',
    block: 'center',
    ...options
  };

  element.scrollIntoView(defaultOptions);
}

/**
 * Устанавливает атрибуты доступности для элемента
 * @param {HTMLElement} element - целевой элемент
 * @param {Object} attributes - объект с атрибутами
 */
function setAccessibilityAttributes(element, attributes) {
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
}

/**
 * Сохраняет данные в localStorage с обработкой ошибок
 * @param {string} key - ключ для сохранения
 * @param {any} value - значение для сохранения
 * @returns {boolean} - успешность операции
 */
function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('Не удалось сохранить данные в localStorage:', error);
    return false;
  }
}

/**
 * Получает данные из localStorage с обработкой ошибок
 * @param {string} key - ключ для получения
 * @returns {string|null} - значение или null при ошибке
 */
function safeGetStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Не удалось получить данные из localStorage:', error);
    return null;
  }
}

/* ==========================================================
   🚀 ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ
   ========================================================== */

class WindowsHistoryApp {
  constructor() {
    this.themeBtn = null;
    this.homeBtn = null;
    this.searchBtn = null;
    this.searchSection = null;
    this.scrollTopBtn = null;
    this.searchForm = null;
    
    this.currentTheme = 'light';
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Инициализация приложения
   */
  init() {
    if (this.isInitialized) {
      console.warn('Приложение уже инициализировано');
      return;
    }

    document.addEventListener('DOMContentLoaded', () => {
      this.setupElements();
      this.setupEventListeners();
      this.setupTheme();
      this.animateIntro();
      this.isInitialized = true;
      
      console.log('Приложение "История Windows" успешно инициализировано');
    });
  }

  /**
   * Поиск и сохранение DOM элементов
   */
  setupElements() {
    this.themeBtn = document.getElementById('themeToggle');
    this.homeBtn = document.getElementById('homeBtn');
    this.searchBtn = document.getElementById('scrollToSearch');
    this.searchSection = document.getElementById('search');
    this.scrollTopBtn = document.getElementById('scrollTopBtn');
    this.searchForm = document.querySelector('.search-engine form');

    // Установка атрибутов доступности
    if (this.scrollTopBtn) {
      setAccessibilityAttributes(this.scrollTopBtn, {
        'aria-label': 'Вернуться к началу страницы',
        'aria-hidden': 'false'
      });
    }
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    // Переключение темы
    if (this.themeBtn) {
      this.themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Навигация
    if (this.homeBtn) {
      this.homeBtn.addEventListener('click', () => this.scrollToTop());
    }

    if (this.searchBtn && this.searchSection) {
      this.searchBtn.addEventListener('click', () => 
        smoothScrollToElement(this.searchSection)
      );
    }

    // Кнопка "Наверх"
    if (this.scrollTopBtn) {
      window.addEventListener('scroll', 
        debounce(() => this.toggleScrollButton(), 80)
      );
      
      this.scrollTopBtn.addEventListener('click', () => this.scrollToTop());
      
      this.scrollTopBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.scrollToTop();
        }
      });
    }

    // Поиск
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
    }

    // Эффекты наведения
    this.setupHoverEffects();
  }

  /**
   * Настройка системы тем
   */
  setupTheme() {
    this.determineInitialTheme();
    
    // Слушатель изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => this.handleSystemThemeChange(e));
  }

  /**
   * Определение начальной темы
   */
  determineInitialTheme() {
    const storedTheme = safeGetStorage(STORAGE_KEYS.THEME);
    
    if (storedTheme === 'dark' || storedTheme === 'light') {
      this.applyTheme(storedTheme, false);
      return;
    }

    // Определение системной темы
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(prefersDark ? 'dark' : 'light', false);
  }

  /**
   * Обработчик изменения системной темы
   * @param {MediaQueryListEvent} e - событие изменения медиа-запроса
   */
  handleSystemThemeChange(e) {
    const userChoice = safeGetStorage(STORAGE_KEYS.THEME);
    
    // Меняем тему только если пользователь не задавал вручную
    if (!userChoice) {
      this.applyTheme(e.matches ? 'dark' : 'light', false);
    }
  }

  /**
   * Переключение темы
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    
    console.log(`Тема переключена: ${newTheme === 'dark' ? 'тёмная' : 'светлая'}`);
  }

  /**
   * Применение темы
   * @param {string} theme - название темы ('dark' или 'light')
   * @param {boolean} save - сохранять ли в localStorage
   */
  applyTheme(theme, save = true) {
    this.currentTheme = theme;
    const isDark = theme === 'dark';
    
    // Установка data-атрибута для CSS
    document.documentElement.setAttribute('data-theme', theme);
    
    // Обновление текста кнопки
    if (this.themeBtn) {
      this.themeBtn.textContent = isDark ? '☀️ Светлая' : '🌙 Тёмная';
      this.themeBtn.setAttribute('aria-label', 
        isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'
      );
    }
    
    // Сохранение в localStorage
    if (save) {
      safeSetStorage(STORAGE_KEYS.THEME, theme);
    }
  }

  /**
   * Анимация появления элементов при загрузке
   */
  animateIntro() {
    const fadeElements = document.querySelectorAll('.content-block, .main-title, .green-gradient-heading, .quad-block');
    
    fadeElements.forEach((el, index) => {
      // Добавляем класс для анимации
      el.classList.add('fade-in');
      el.style.animationDelay = `${index * CONFIG.ANIMATION_DELAY}ms`;
    });
  }

  /**
   * Прокрутка к верху страницы
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Фокус на кнопке для доступности
    if (this.scrollTopBtn) {
      this.scrollTopBtn.focus();
    }
  }

  /**
   * Переключение видимости кнопки "Наверх"
   */
  toggleScrollButton() {
    if (!this.scrollTopBtn) return;
    
    const isVisible = window.scrollY > CONFIG.SCROLL_THRESHOLD;
    
    if (isVisible) {
      this.scrollTopBtn.classList.add('visible');
    } else {
      this.scrollTopBtn.classList.remove('visible');
    }
  }

  /**
   * Настройка эффектов наведения
   */
  setupHoverEffects() {
    const contentBlocks = document.querySelectorAll('.content-block, .quad-block');
    
    contentBlocks.forEach(block => {
      block.addEventListener('mouseenter', () => {
        block.classList.add('is-hovered');
      });
      
      block.addEventListener('mouseleave', () => {
        block.classList.remove('is-hovered');
      });
    });
  }

  /**
   * Обработчик отправки формы поиска
   * @param {Event} e - событие отправки формы
   */
  handleSearch(e) {
    const input = this.searchForm.querySelector('input[name="q"]');
    
    if (input && input.value.trim()) {
      const searchQuery = input.value.trim();
      console.log(`🔍 Выполнен поиск: "${searchQuery}"`);
      
      // Можно добавить дополнительную логику здесь
      // Например, отправку аналитики
    }
    
    // Форма отправится нормально, так как это стандартная форма
  }
}

/* ==========================================================
   🎬 ЗАПУСК ПРИЛОЖЕНИЯ
   ========================================================== */

// Создание и инициализация экземпляра приложения
const app = new WindowsHistoryApp();

// Экспорт для возможного использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WindowsHistoryApp };
}
