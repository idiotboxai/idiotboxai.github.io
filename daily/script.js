
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  let totalReadWriteups = 0;
  let totalReadReports = 0;
  let totalUnreadWriteups = 0;
  let totalUnreadReports = 0;
  let writeupsByDate = {};
  let reportsByDate = {};

  const writeupInput = document.getElementById('writeup-input');
  const writeupTag = document.getElementById('writeup-tag');
  const addWriteupButton = document.getElementById('add-writeup');
  const writeupsList = document.getElementById('writeups-list');
  const writeupsCompletedList = document.getElementById('completed-list');
  const hackeroneInput = document.getElementById('hackerone-input');
  const hackeroneTag = document.getElementById('hackerone-tag');
  const addHackeroneButton = document.getElementById('add-hackerone');
  const hackeroneList = document.getElementById('hackerone-list');
  const hackeroneCompletedList = document.getElementById('hackerone-completed-list');
  const streakModule = (() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let lastReadDate = null;
  
    function updateStreak(date) {
      const today = new Date().toISOString().split('T')[0];
      date = date || today;
  
      if (lastReadDate === null) {
        currentStreak = 1;
      } else {
        const lastDate = new Date(lastReadDate);
        const currentDate = new Date(date);
        const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
  
        if (diffDays === 1 || (diffDays === 0 && date !== lastReadDate)) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
  
      lastReadDate = date;
      longestStreak = Math.max(longestStreak, currentStreak);
  
      saveStreakData();
      updateStreakDisplay();
    }
  
    function saveStreakData() {
      localStorage.setItem('currentStreak', currentStreak);
      localStorage.setItem('longestStreak', longestStreak);
      localStorage.setItem('lastReadDate', lastReadDate);
    }
  
    function loadStreakData() {
      currentStreak = parseInt(localStorage.getItem('currentStreak')) || 0;
      longestStreak = parseInt(localStorage.getItem('longestStreak')) || 0;
      lastReadDate = localStorage.getItem('lastReadDate');
  
      updateStreakDisplay();
    }
  
    function updateStreakDisplay() {
      document.getElementById('current-streak').textContent = currentStreak;
      document.getElementById('longest-streak').textContent = longestStreak;
      updateCalendar();
    }
  
    function updateCalendar() {
      const calendarContainer = document.querySelector('.streak-calendar');
      calendarContainer.innerHTML = '';
  
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 29); // Show last 30 days
  
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
  
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = currentDate.getDate();
  
        if (dateString === lastReadDate) {
          dayElement.classList.add('read');
        } else {
          dayElement.classList.add('empty');
        }
  
        calendarContainer.appendChild(dayElement);
      }
    }
  
    return {
      updateStreak,
      loadStreakData,
    };
  })();
  let writeupTags = new Set();
  let hackeroneTags = new Set();
  let db;

  function showTab(tabId) {
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }
  streakModule.loadStreakData();

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      showTab(tab.dataset.tab);
    });
  });

  if (tabs.length > 0) {
    showTab(tabs[0].dataset.tab);
  }

  const request = indexedDB.open('myDatabase', 1);

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('writeups')) {
      db.createObjectStore('writeups', { keyPath: 'url' });
    }
    if (!db.objectStoreNames.contains('completedWriteups')) {
      db.createObjectStore('completedWriteups', { keyPath: 'url' });
    }
    if (!db.objectStoreNames.contains('hackerone')) {
      db.createObjectStore('hackerone', { keyPath: 'url' });
    }
    if (!db.objectStoreNames.contains('completedHackerone')) {
      db.createObjectStore('completedHackerone', { keyPath: 'url' });
    }
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    loadData();
  };

  request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.error);
  };

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

   function addItems(list, urls, tag) {
    const currentDate = new Date().toISOString().split('T')[0];
    urls.forEach(url => {
      if (isValidUrl(url.trim())) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <a href="${url.trim()}" class="open-url" target="_blank">🔗 ${url.trim()}</a>
          <span class="tag">${tag}</span>
          <span class="date">${currentDate}</span>
          <i class="fas fa-check-circle tick" onclick="markAsCompleted(this)"></i>
          <i class="fas fa-trash-alt remove" onclick="removeItem(this)"></i>`;
        list.appendChild(listItem);

        if (list.id === 'writeups-list') {
          writeupsByDate[currentDate] = (writeupsByDate[currentDate] || 0) + 1;
          totalUnreadWriteups++;
        } else if (list.id === 'hackerone-list') {
          reportsByDate[currentDate] = (reportsByDate[currentDate] || 0) + 1;
          totalUnreadReports++;
        }
      }
    });

    updateStatistics();
    updateCharts();
    saveData();
  }

  addWriteupButton.addEventListener('click', () => {
    const urls = writeupInput.value.split('\n').filter(url => url.trim() !== '');
    addItems(writeupsList, urls, writeupTag.value);
    writeupInput.value = '';
    writeupTag.value = '';
  });

  addHackeroneButton.addEventListener('click', () => {
    const urls = hackeroneInput.value.split('\n').filter(url => url.trim() !== '');
    addItems(hackeroneList, urls, hackeroneTag.value);
    hackeroneInput.value = '';
    hackeroneTag.value = '';
  });



  function saveData() {
    const transaction = db.transaction(['writeups', 'completedWriteups', 'hackerone', 'completedHackerone'], 'readwrite');
  
    saveListData(transaction, 'writeups', writeupsList);
    saveListData(transaction, 'completedWriteups', writeupsCompletedList);
    saveListData(transaction, 'hackerone', hackeroneList);
    saveListData(transaction, 'completedHackerone', hackeroneCompletedList);
  
    // Save totals to localStorage
    localStorage.setItem('totalReadWriteups', totalReadWriteups);
    localStorage.setItem('totalReadReports', totalReadReports);
    localStorage.setItem('totalUnreadWriteups', totalUnreadWriteups);
    localStorage.setItem('totalUnreadReports', totalUnreadReports);
  }
  

  function saveListData(transaction, storeName, list) {
    const store = transaction.objectStore(storeName);
    store.clear();
    Array.from(list.children).forEach(item => {
      const url = item.querySelector('.open-url').href;
      const tag = item.querySelector('.tag').textContent;
      const date = item.querySelector('.date').textContent;
      store.put({ url, tag, date });
    });
  }

  function loadData() {
    const transaction = db.transaction(['writeups', 'completedWriteups', 'hackerone', 'completedHackerone']);
  
    totalReadWriteups = parseInt(localStorage.getItem('totalReadWriteups')) || 0;
    totalReadReports = parseInt(localStorage.getItem('totalReadReports')) || 0;
    totalUnreadWriteups = parseInt(localStorage.getItem('totalUnreadWriteups')) || 0;
    totalUnreadReports = parseInt(localStorage.getItem('totalUnreadReports')) || 0;
  
    writeupsByDate = {};
    reportsByDate = {};
  
    loadListData(transaction, 'writeups', writeupsList, false);
    loadListData(transaction, 'completedWriteups', writeupsCompletedList, true);
    loadListData(transaction, 'hackerone', hackeroneList, false);
    loadListData(transaction, 'completedHackerone', hackeroneCompletedList, true);
  
    updateStatistics();
    updateCharts();
  }
  

  function loadListData(transaction, storeName, list, isCompleted) {
    const store = transaction.objectStore(storeName);
    list.innerHTML = '';
    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const url = cursor.value.url;
        const tag = cursor.value.tag;
        const date = cursor.value.date;
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <a href="${url}" class="open-url" target="_blank">🔗 ${url}</a>
          <span class="tag">${tag}</span>
          <span class="date">${date}</span>
          ${isCompleted ? '' : '<i class="fas fa-check-circle tick" onclick="markAsCompleted(this)"></i>'}
          <i class="fas fa-trash-alt remove" onclick="removeItem(this)"></i>`;
        list.appendChild(listItem);

        if (list.id === 'writeups-list') {
          writeupsByDate[date] = (writeupsByDate[date] || 0) + 1;
          totalUnreadWriteups++;
        } else if (list.id === 'completed-list') {
          totalReadWriteups++;
        } else if (list.id === 'hackerone-list') {
          reportsByDate[date] = (reportsByDate[date] || 0) + 1;
          totalUnreadReports++;
        } else if (list.id === 'hackerone-completed-list') {
          totalReadReports++;
        }

        cursor.continue();
      }
    };
  }

  window.markAsCompleted = function (element) {
    const item = element.closest('li');
    const sourceList = item.closest('ul');
    let targetList;
  
    if (sourceList.id === 'writeups-list') {
      targetList = writeupsCompletedList;
      totalReadWriteups++;
      totalUnreadWriteups--;
    } else if (sourceList.id === 'hackerone-list') {
      targetList = hackeroneCompletedList;
      totalReadReports++;
      totalUnreadReports--;
    } else {
      return;
    }
  
    targetList.appendChild(item);
    item.querySelector('.tick').remove();
  
    streakModule.updateStreak();
    gamificationModule.addXP(1); // Add 1 XP for each completed item
  
    updateStatistics();
    updateCharts();
    saveData();
  };
  
  
  window.removeItem = function (element) {
    const item = element.closest('li');
    const list = item.closest('ul');
  
    if (list.id === 'completed-list') {
      totalReadWriteups--;
    } else if (list.id === 'hackerone-completed-list') {
      totalReadReports--;
    } else if (list.id === 'writeups-list') {
      totalUnreadWriteups--;
    } else if (list.id === 'hackerone-list') {
      totalUnreadReports--;
    }
  
    item.remove();
    updateStatistics();
    updateCharts();
    saveData();
  };
  

  window.removeItem = function (element) {
    const item = element.closest('li');
    const list = item.closest('ul');

    if (list.id === 'completed-list') {
      totalReadWriteups--;
    } else if (list.id === 'hackerone-completed-list') {
      totalReadReports--;
    } else if (list.id === 'writeups-list') {
      totalUnreadWriteups--;
    } else if (list.id === 'hackerone-list') {
      totalUnreadReports--;
    }

    item.remove();
    updateStatistics();
    updateCharts();
    saveData();
  };

  function updateStatistics() {
    document.getElementById('total-read-writeups').textContent = totalReadWriteups;
    document.getElementById('total-read-reports').textContent = totalReadReports;
  }

  const writeupSearch = document.getElementById('writeup-search');
  const hackeroneSearch = document.getElementById('hackerone-search');

  writeupSearch.addEventListener('input', () => {
    searchItems(writeupSearch.value, writeupsList, writeupsCompletedList, 'writeup-search-suggestions', writeupTags);
  });

  hackeroneSearch.addEventListener('input', () => {
    searchItems(hackeroneSearch.value, hackeroneList, hackeroneCompletedList, 'hackerone-search-suggestions', hackeroneTags);
  });

  function searchItems(query, list1, list2, suggestionElementId, tagsSet) {
  const items = Array.from(list1.children).concat(Array.from(list2.children));
  const suggestionsElement = document.getElementById(suggestionElementId);
  suggestionsElement.innerHTML = '';
  if (query === '') {
    items.forEach(item => {
      item.style.display = '';
    });
    return;
  }

  items.forEach(item => {
    const url = item.querySelector('.open-url').textContent.toLowerCase();
    const tag = item.querySelector('.tag').textContent.toLowerCase();
    const date = item.querySelector('.date').textContent.toLowerCase();
    const matches = url.includes(query.toLowerCase()) || tag.includes(query.toLowerCase()) || date.includes(query.toLowerCase());
    item.style.display = matches ? '' : 'none';
  });

  const suggestions = Array.from(tagsSet).filter(tag => tag.toLowerCase().includes(query.toLowerCase()));
  suggestions.forEach(suggestion => {
    const suggestionItem = document.createElement('div');
    suggestionItem.textContent = suggestion;
    suggestionItem.classList.add('suggestion-item');
    suggestionsElement.appendChild(suggestionItem);
  });
}

  const statsChartElement = document.getElementById('stats-chart').getContext('2d');
  const timelineChartElement = document.getElementById('timeline-chart').getContext('2d');
  let statsChart;
  let timelineChart;

  function updateCharts() {
    const labels = ['Writeups', 'Reports'];
    const readData = [totalReadWriteups, totalReadReports];
    const unreadData = [totalUnreadWriteups, totalUnreadReports];

    if (statsChart) {
      statsChart.destroy();
    }

    statsChart = new Chart(statsChartElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Read',
            data: readData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
          {
            label: 'Unread',
            data: unreadData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    const dates = Array.from(new Set([...Object.keys(writeupsByDate), ...Object.keys(reportsByDate)])).sort();
    const cumulativeWriteups = [];
    const cumulativeReports = [];
    let writeupSum = 0;
    let reportSum = 0;

    dates.forEach(date => {
      writeupSum += writeupsByDate[date] || 0;
      reportSum += reportsByDate[date] || 0;
      cumulativeWriteups.push(writeupSum);
      cumulativeReports.push(reportSum);
    });

    if (timelineChart) {
      timelineChart.destroy();
    }

    timelineChart = new Chart(timelineChartElement, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Cumulative Writeups',
            data: cumulativeWriteups,
            borderColor: 'rgba(75, 192, 192, 0.6)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          },
          {
            label: 'Cumulative Reports',
            data: cumulativeReports,
            borderColor: 'rgba(255, 99, 132, 0.6)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  addWriteupButton.addEventListener('click', () => {
    addItem(writeupsList, writeupInput.value, writeupTag.value);
    writeupInput.value = '';
    writeupTag.value = '';
  });

  addHackeroneButton.addEventListener('click', () => {
    addItem(hackeroneList, hackeroneInput.value, hackeroneTag.value);
    hackeroneInput.value = '';
    hackeroneTag.value = '';
  });
  gamificationModule.updateGamificationDisplay();
  streakModule.loadStreakData();
  gamificationModule.loadProgress();
});
const gamificationModule = (() => {
  let xp = 0;
  let level = 1;
  const xpPerLevel = 50;

  function addXP(amount) {
    xp += amount;
    if (xp >= xpPerLevel * level) {
      levelUp();
    }
    updateGamificationDisplay();
    saveProgress();
  }

  function levelUp() {
    level++;
    celebrationModule.celebrate();
  }

  function updateGamificationDisplay() {
    document.getElementById('user-xp').textContent = xp;
    document.getElementById('user-level').textContent = level;
    document.querySelector('.xp-progress').style.width = `${(xp % xpPerLevel) / xpPerLevel * 100}%`;
  }

  function saveProgress() {
    localStorage.setItem('xp', xp);
    localStorage.setItem('level', level);
  }

  function loadProgress() {
    xp = parseInt(localStorage.getItem('xp')) || 0;
    level = parseInt(localStorage.getItem('level')) || 1;
    updateGamificationDisplay();
  }

  return {
    addXP,
    updateGamificationDisplay,
    loadProgress
  };
})();

const celebrationModule = (() => {
  let confettiTimeout;

  function createConfetti() {
    const confettiCount = 200;
    const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d'];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.opacity = Math.random();
      confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      
      document.body.appendChild(confetti);

      confetti.addEventListener('animationend', () => {
        confetti.remove();
      });
    }
  }

  function clearConfetti() {
    const confettiElements = document.querySelectorAll('.confetti');
    confettiElements.forEach(confetti => confetti.remove());
  }

  function celebrate() {
    createConfetti();
    playSound();
    showCongratulationsMessage();

    // Clear confetti after 5 seconds
    confettiTimeout = setTimeout(clearConfetti, 5000);
  }

  function playSound() {
    const audio = document.getElementById('applause-sound');
    audio.play();
  }

  function showCongratulationsMessage() {
    const message = document.createElement('div');
    message.className = 'congratulations-message';
    message.textContent = 'Congratulations! You leveled up!';
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  return {
    celebrate
  };
})();
