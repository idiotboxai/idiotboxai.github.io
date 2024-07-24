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
      startDate.setDate(startDate.getDate() - 29);
  
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
  
        const dateString = currentDate.toISOString().split('T')[0];
        const isActive = dateString === lastReadDate;
        const dateElement = document.createElement('div');
        dateElement.classList.add('calendar-day');
        dateElement.classList.toggle('active', isActive);
        dateElement.dataset.date = dateString;
        calendarContainer.appendChild(dateElement);
      }
    }
  
    document.querySelector('.streak-calendar').addEventListener('click', (event) => {
      const { date } = event.target.dataset;
      if (date) {
        updateStreak(date);
      }
    });
  
    return {
      updateStreak,
      loadStreakData,
    };
  })();
  
  streakModule.loadStreakData();
  
  function updateXPDisplay() {
    const userLevel = document.getElementById('user-level');
    const userXP = document.getElementById('user-xp');
    const xpBar = document.querySelector('.xp-progress');
  
    const level = parseInt(localStorage.getItem('userLevel')) || 1;
    const xp = parseInt(localStorage.getItem('userXP')) || 0;
  
    userLevel.textContent = level;
    userXP.textContent = xp;
  
    const xpForNextLevel = 100 * level;
    const xpPercentage = (xp / xpForNextLevel) * 100;
    xpBar.style.width = `${xpPercentage}%`;
  }
  
  function addXP(points) {
    let level = parseInt(localStorage.getItem('userLevel')) || 1;
    let xp = parseInt(localStorage.getItem('userXP')) || 0;
  
    xp += points;
  
    const xpForNextLevel = 100 * level;
  
    if (xp >= xpForNextLevel) {
      xp -= xpForNextLevel;
      level++;
      document.getElementById('applause-sound').play();
    }
  
    localStorage.setItem('userLevel', level);
    localStorage.setItem('userXP', xp);
  
    updateXPDisplay();
  }
  
  function addListItem(list, url, tag) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    const tagSpan = document.createElement('span');
    const markAsReadButton = document.createElement('button');
    const deleteButton = document.createElement('button');
  
    link.href = url;
    link.textContent = url;
    link.target = '_blank';
  
    tagSpan.textContent = tag;
    tagSpan.classList.add('tag');
  
    markAsReadButton.textContent = 'Mark as Read';
    markAsReadButton.classList.add('mark-as-read');
  
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.classList.add('delete');
  
    li.appendChild(link);
    li.appendChild(tagSpan);
    li.appendChild(markAsReadButton);
    li.appendChild(deleteButton);
    list.appendChild(li);
  }
  
  function updateReadCounts() {
    totalReadWriteups = writeupsCompletedList.childElementCount;
    totalReadReports = hackeroneCompletedList.childElementCount;
  
    document.getElementById('total-read-writeups').textContent = totalReadWriteups;
    document.getElementById('total-read-reports').textContent = totalReadReports;
  }
  
  function updateStatistics() {
    updateReadCounts();
  
    const totalWriteups = totalReadWriteups + writeupsList.childElementCount;
    const totalReports = totalReadReports + hackeroneList.childElementCount;
    const totalItems = totalWriteups + totalReports;
    const writeupsReadPercentage = totalItems === 0 ? 0 : (totalReadWriteups / totalItems) * 100;
    const reportsReadPercentage = totalItems === 0 ? 0 : (totalReadReports / totalItems) * 100;
  
    const ctx = document.getElementById('stats-chart').getContext('2d');
    const statsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Write-ups', 'HackerOne Reports'],
        datasets: [{
          label: 'Percentage Read',
          data: [writeupsReadPercentage, reportsReadPercentage],
          backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
          borderWidth: 1,
        }],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  }
  
  function updateTimelineChart() {
    const dates = Object.keys(writeupsByDate)
      .concat(Object.keys(reportsByDate))
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(a) - new Date(b));
  
    const writeupsData = dates.map(date => writeupsByDate[date] || 0);
    const reportsData = dates.map(date => reportsByDate[date] || 0);
  
    const ctx = document.getElementById('timeline-chart').getContext('2d');
    const timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Write-ups',
          data: writeupsData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }, {
          label: 'HackerOne Reports',
          data: reportsData,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
            },
          },
        },
      },
    });
  }
  
  addWriteupButton.addEventListener('click', () => {
    const urls = writeupInput.value.split(',').map(url => url.trim()).filter(url => url !== '');
    const tag = writeupTag.value.trim();
  
    urls.forEach(url => {
      addListItem(writeupsList, url, tag);
    });
  
    writeupInput.value = '';
    writeupTag.value = '';
    updateStatistics();
  });
  
  addHackeroneButton.addEventListener('click', () => {
    const urls = hackeroneInput.value.split(',').map(url => url.trim()).filter(url => url !== '');
    const tag = hackeroneTag.value.trim();
  
    urls.forEach(url => {
      addListItem(hackeroneList, url, tag);
    });
  
    hackeroneInput.value = '';
    hackeroneTag.value = '';
    updateStatistics();
  });
  
  document.body.addEventListener('click', (event) => {
    if (event.target.classList.contains('mark-as-read')) {
      const listItem = event.target.closest('li');
      const parentList = listItem.closest('ul');
  
      if (parentList === writeupsList) {
        writeupsCompletedList.appendChild(listItem);
      } else if (parentList === hackeroneList) {
        hackeroneCompletedList.appendChild(listItem);
      }
  
      const link = listItem.querySelector('a');
      const url = link.href;
      const date = new Date().toISOString().split('T')[0];
  
      if (parentList === writeupsList) {
        totalUnreadWriteups--;
        totalReadWriteups++;
        writeupsByDate[date] = (writeupsByDate[date] || 0) + 1;
      } else if (parentList === hackeroneList) {
        totalUnreadReports--;
        totalReadReports++;
        reportsByDate[date] = (reportsByDate[date] || 0) + 1;
      }
  
      streakModule.updateStreak();
      addXP(10);
      updateStatistics();
      updateTimelineChart();
    } else if (event.target.classList.contains('delete')) {
      const listItem = event.target.closest('li');
      const parentList = listItem.closest('ul');
      parentList.removeChild(listItem);
  
      if (parentList === writeupsList) {
        totalUnreadWriteups--;
      } else if (parentList === hackeroneList) {
        totalUnreadReports--;
      }
  
      updateStatistics();
    }
  });
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
  
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
  
      document.getElementById(target).style.display = 'block';
    });
  });
  
  tabContents.forEach(content => {
    content.style.display = 'none';
  });
  
  document.getElementById('writeups').style.display = 'block';
  updateXPDisplay();
  updateStatistics();
  updateTimelineChart();
});
