document.addEventListener("DOMContentLoaded", function () {
    const plannerButton = document.getElementById("plannerButton");
    const trackerButton = document.getElementById("trackerButton");
    const rssButton = document.getElementById("rssButton");
    const plannerSection = document.getElementById("plannerSection");
    const trackerSection = document.getElementById("trackerSection");
    const rssSection = document.getElementById("rssSection");
    const addArticleButton = document.getElementById("add-article-button");
    const articleTitleInput = document.getElementById("article-title");
    const toReadList = document.getElementById("to-read-list");
    const readList = document.getElementById("read-list");
    const counter = document.getElementById("counter");
    const addButton = document.getElementById("add");
    const subtractButton = document.getElementById("subtract");
    const resetButton = document.getElementById("reset");
    const goalInput = document.getElementById("goal");
    const setGoalButton = document.getElementById("setGoal");

    let count = 0;
    let goal = parseInt(goalInput.value);

    // Check if there's a user cookie and retrieve user-specific data
    let userId = getCookie("userId");
    let userData = {};

    // Event listeners for planner, tracker, and RSS buttons
    plannerButton.addEventListener("click", () => {
        plannerSection.classList.add("active");
        trackerSection.classList.remove("active");
        rssSection.classList.remove("active");
        displayUserData();
    });

    trackerButton.addEventListener("click", () => {
        trackerSection.classList.add("active");
        plannerSection.classList.remove("active");
        rssSection.classList.remove("active");
        displayUserData();
    });

    rssButton.addEventListener("click", () => {
        rssSection.classList.add("active");
        plannerSection.classList.remove("active");
        trackerSection.classList.remove("active");
        fetchTechCrunchRSS(); // Fetch RSS feed for everyone
    });

    addArticleButton.addEventListener("click", () => {
        const articleUrl = articleTitleInput.value.trim();
        if (isValidUrl(articleUrl)) {
            addArticle(articleUrl);
            articleTitleInput.value = "";
        } else {
            alert("Please enter a valid URL.");
        }
    });

    addButton.addEventListener("click", () => {
        count++;
        updateCounter();
    });

    subtractButton.addEventListener("click", () => {
        if (count > 0) count--;
        updateCounter();
    });

    resetButton.addEventListener("click", () => {
        count = 0;
        updateCounter();
    });

    setGoalButton.addEventListener("click", () => {
        goal = parseInt(goalInput.value);
    });

    function addArticle(url) {
        const articleItem = document.createElement("div");
        articleItem.classList.add("article-item");
        articleItem.innerHTML = `
            <a href="${url}" target="_blank">${url}</a>
            <div class="icons">
                <i class="fas fa-check"></i>
                <i class="fas fa-times"></i>
            </div>
        `;

        const checkIcon = articleItem.querySelector(".fa-check");
        const deleteIcon = articleItem.querySelector(".fa-times");

        checkIcon.addEventListener("click", () => {
            articleItem.remove();
            readList.appendChild(articleItem);
            checkIcon.remove();
            saveUserData(); // Save user data after modification
        });

        deleteIcon.addEventListener("click", () => {
            articleItem.remove();
            saveUserData(); // Save user data after modification
        });

        toReadList.appendChild(articleItem);
        saveUserData(); // Save user data after adding new article
    }

    function updateCounter() {
        counter.textContent = count;
        if (count >= goal) {
            counter.style.color = "#00ff00";
            counter.style.textShadow = "0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00";
        } else {
            counter.style.color = "#ffceab";
            counter.style.textShadow = "0 0 10px #ffceab, 0 0 20px #ffceab, 0 0 30px #ffceab";
        }
        saveUserData(); // Save user data after updating counter
    }

    function saveUserData() {
        // Save user-specific data to localStorage or server
        userData[userId] = {
            count: count,
            goal: goal,
            toReadList: toReadList.innerHTML,
            readList: readList.innerHTML
        };
        localStorage.setItem("userData", JSON.stringify(userData));
    }

    function displayUserData() {
        // Display user-specific data from localStorage or server
        if (userData[userId]) {
            count = userData[userId].count || 0;
            goal = userData[userId].goal || 0;
            toReadList.innerHTML = userData[userId].toReadList || "";
            readList.innerHTML = userData[userId].readList || "";
            updateCounter();
        }
    }

    // Function to validate URL format
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Function to retrieve cookie value by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    fetchTechCrunchRSS(); // Initial fetch of RSS feed
    setInterval(fetchTechCrunchRSS, 60000); // Regularly fetch RSS feed every minute
});

function fetchTechCrunchRSS() {
    const rssUrl = 'https://sploitus.com/rss';
    fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl))
        .then(response => response.json())
        .then(data => {
            const items = data.items;
            const feedContainer = document.getElementById('feed');
            feedContainer.innerHTML = ''; // Clear previous content

            // Adding a heading for the RSS feed section
            const rssHeading = document.createElement('h2');
            rssHeading.textContent = 'Latest 0day Articles';
            rssHeading.classList.add('rss-heading');
            feedContainer.appendChild(rssHeading);

            // Displaying the RSS feed articles
            items.slice(0, 5).forEach(item => {
                const article = document.createElement('div');
                article.classList.add('feed-article');
                article.innerHTML = `
                    <h3>${item.title}</h3>
                    <p>${item.pubDate}</p>
                    <a href="${item.link}" class="read-more" target="_blank">Read more</a>
                `;
                feedContainer.appendChild(article);
            });
        })
        .catch(error => console.error('Error fetching RSS feed:', error));
}
