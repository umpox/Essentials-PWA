var newsContentArea;
var weatherContentArea;
var articleContentArea;
var offlineContentArea;
var offlineArticleArea;
var loadingIcon;
var refreshIcon;
var menuButtons;
var backBtnContainer;
var refreshBtnContainer;
var headerText;

// This works on all devices/browsers, and uses IndexedDBShim as a final fallback 
var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

// Open (or create) the database
var DataStorage = indexedDB.open("ArticleDatabase", 1);

//Check that the browser supports service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js');
}

document.addEventListener("DOMContentLoaded", function() { 
    //Hide loading icon once interface has been loaded
    loadingIcon = document.getElementById('loading');
    loadingIcon.classList.add('hidden');

    //Load in SVGS after dom is displayed for quicker access
    backBtnContainer = document.getElementById('menuBanner-content-back');
    refreshBtnContainer = document.getElementById('menuBanner-content-refresh');
    backBtnContainer.innerHTML = '<img src="resources/back.svg">';
    refreshBtnContainer.innerHTML = '<img src="resources/refresh.svg">';

    //Set variables from DOM for use later
    newsContentArea = document.getElementById('newsContentArea');
    weatherContentArea = document.getElementById('weatherContentArea');
    articleContentArea = document.getElementById('articleContentArea');
    offlineContentArea = document.getElementById('offlineContentArea');
    offlineArticleArea = document.getElementById('offlineArticleArea')
    refreshIcon = document.getElementById('menuBanner-content-refresh');
    menuButtons = document.getElementById('menuButtonArea');
    headerText = document.getElementById('menuBanner-content-text');
});


//Initialise the database schea
DataStorage.onupgradeneeded = function() {
    var db = DataStorage.result;
    var articleList = db.createObjectStore("Articles", {keyPath: "id"});
};


var saveOffline = function(articleTitle, articleBody, buttonHTML) {
    //Access database
    var db = DataStorage.result;
    var tx = db.transaction("Articles", "readwrite");
    var articleList = tx.objectStore("Articles");

    //Save article data to database
    articleList.put({id: new Date().getTime(), data: {title: articleTitle, body: articleBody}});

    //Update button text to inform user data has saved
    buttonHTML.innerHTML = 'Saved!';
};

var loadOfflineArticles = function() {
    //Add default data to content area
    offlineContentArea.innerHTML = '<h2 id="articleTitle">No offline articles found</h2>';

    //Prepare interface
    loadingIcon.classList.remove('hidden');
    menuButtons.classList.add('hidden');
    offlineContentArea.classList.remove('hidden');
    backBtnContainer.classList.remove('hidden');
    refreshBtnContainer.classList.remove('hidden');

    //Make refresh icon hidden but still structuring page
    refreshIcon.classList.add('invisible');

    //Access database 
    var db = DataStorage.result;
    var tx = db.transaction("Articles", "readwrite");
    var articleList = tx.objectStore("Articles");

    //Query the database - return all articles that are saved
    var articles = articleList.getAll();

    articles.onsuccess = function() {
        //If articles are found:

        //Hide loading icon
        loadingIcon.classList.add('hidden');

        //Reduce the object found from database to relevant data
        articles = articles.result;

        //Reset the existing content from previous visits
        offlineContentArea.innerHTML = '';

        //Loop through database data and display each article as button
        for (var article in articles) {
            offlineContentArea.innerHTML += `
            <a class="pure-u-24-24 pure-button newsItem" onclick="loadOfflineDetails(${articles[article].id})">
                <p class="newsItem-title">${articles[article].data.title}</p>
            </a>`;
        }
    };
};

var loadOfflineDetails = function(articleID) {
    loadingIcon.classList.remove('hidden');
    offlineContentArea.classList.add('hidden');

    //Clear existing data from last cached article
    offlineArticleArea.innerHTML = '';
    offlineArticleArea.classList.remove('hidden');

    //Scroll to top of page
    window.scrollTo(0,0);

    //Access the database
    var db = DataStorage.result;
    var tx = db.transaction("Articles", "readwrite");
    var articleList = tx.objectStore("Articles");

    //Find the specific article that the user is trying to view
    var articleContent = articleList.get(articleID);

    articleContent.onsuccess = function() {
        //If the article was found:

        loadingIcon.classList.add('hidden');

        //Narrow the found object to only show relevant data
        articleContent = articleContent.result;

        //Display the article content
        offlineArticleArea.innerHTML = `
            <button class="pure-button btnDelete" id="${articleContent.id}" onclick="deleteOfflineArticle(${articleContent.id})">Delete</button>
            <h2 id="articleTitle">${articleContent.data.title}</h2>
            <p id="articleBody">${articleContent.data.body}</p>`;      
    };

};

var deleteOfflineArticle = function(articleID) {
    //Access the database
    var db = DataStorage.result;
    var tx = db.transaction("Articles", "readwrite");
    var articleList = tx.objectStore("Articles");

    //Attempt to delete the relevant article
    var articleContent = articleList.delete(articleID);

    articleContent.onsuccess = function() {
        //If successfully deleted return to offline article list
        offlineArticleArea.classList.add('hidden');
        loadOfflineArticles();
    };
};

var loadNewsData = function() {
    //Prepare news interface to be viewed by the user
    loadingIcon.classList.remove('hidden');
    menuButtons.classList.add('hidden');
    newsContentArea.classList.remove('hidden');
    backBtnContainer.classList.remove('hidden');
    refreshBtnContainer.classList.remove('hidden');

    //Ensure that refreshIcon is visible
    refreshIcon.classList.remove('invisible');

    //Set the header text
    headerText.innerHTML = '<h1>News</h1>';

    //URL to load news data
    var apiURL = 'https://umpox.github.io/essentials/data/news.json';

    //Variable to store current updated time 
    var currentTime = new Date();

    //Variables to store specific news data
    var newsTitle = '';
    var newsDesc = '';
    var newsURL = '';
    var newsID;

    //Create new instance of apiCall
    var newsAPI = new apiCall();

    newsAPI.get(apiURL, function(newsData) {
        //Successfully loaded

        //Convert string to JSON
        newsData = JSON.parse(newsData);
        
        //Narrow down the API data to relevant data
        var news = newsData.response.results;

        //Hide loading icon
        loadingIcon.classList.add('hidden');

        //Update the 'Last updated' area
        newsContentArea.innerHTML += `
            <a class="pure-u-24-24 newsMain">
                <h4 class="newsItem-title">Last updated: ${currentTime.toLocaleTimeString()}</h4>                
            </a>`;

        //Loop through articles and display list
        for (var article in news) {
            newsTitle = news[article].webTitle;
            newsDesc = news[article].fields.trailText;
            newsURL = news[article].webUrl;
            newsID = news[article].id;


            newsContentArea.innerHTML += `
            <a class="pure-u-24-24 pure-button newsItem" onclick="loadArticle( '${newsID}' )" rel="amphtml">
                <p class="newsItem-title">${newsTitle}</p>
                <p class="newsItem-desc">${newsDesc}</p>
            </a>`;
        }
    });
};

var loadArticle = function(newsID) {
    loadingIcon.classList.remove('hidden');
    newsContentArea.classList.add('hidden');

    //Make refresh icon hidden but still structuring page
    refreshIcon.classList.add('invisible');

    //Clear any previously loaded data from a previous article
    articleContentArea.innerHTML = '';
    articleContentArea.classList.remove('hidden');

    //Scroll to top of page
    window.scrollTo(0,0);

    //API URL to grab news data
    var apiURL = //INSERT API URL HERE

    //Variables to store article data
    var articleTitle;
    var articleBody;
    var articleURL;

    //Create new APICall instance
    var articleAPI = new apiCall();

    articleAPI.get(apiURL, function(apiData) {
        //Successfully loaded  

        //Variable to store offline button
        var offlineBtn;

        //Convert string to JSON
        articleData = JSON.parse(apiData);

        articleTitle = articleData.response.content.webTitle;
        articleBody = articleData.response.content.blocks.body[0].bodyTextSummary;
        articleURL = articleData.response.content.webUrl;

        //Convert Guardian URL to AMP Url
        articleURL = articleURL.replace('https://www', 'https://amp');

        //Hide loading icon
        loadingIcon.classList.add('hidden');

        //Display article data on page
        articleContentArea.innerHTML = `
        <button class="pure-button btnSave" id="${newsID}">Save Offline</button>
        <h2 id="articleTitle">${articleTitle}</h2>
        <p id="articleBody">${articleBody}</p>
        <a class="pure-button ampLoad" href="${articleURL}" rel="amphtml">Original AMP article</a>`;
        
        //Add event listener to offline button
        offlineBtn = document.getElementById(newsID);
        offlineBtn.addEventListener('click', function() {
            saveOffline(articleTitle, articleBody, this);
        }, true);

    });
    
};


var loadWeatherData = function(lat, long) {
    loadingIcon.classList.remove('hidden');
    menuButtons.classList.add('hidden');
    backBtnContainer.classList.remove('hidden');
    refreshBtnContainer.classList.remove('hidden');

    //Ensure that refreshIcon is visible
    refreshIcon.classList.remove('invisible');

    //Reset content in weatherArea
    weatherContentArea.innerHTML = '';
    weatherContentArea.classList.remove('hidden');

    //Set the header text
    headerText.innerHTML = '<h1>Weather</h1>';

    //URL to load weather data
    var apiURL = //INSERT API URL HERE

    //If latitude and longitude is provided adjust API call
    if (lat !== undefined && long !== undefined) {
        apiURL = //INSERT API URL HERE
    }

    //Variable to store current updated time 
    var currentTime = new Date();

    //Variables to store weather data
    var weatherDate;
    var weatherDesc;
    var weatherTemp;
    var weatherCloud;

    //Create new APICall instance
    var weatherAPI = new apiCall();
    weatherAPI.get(apiURL, function(weatherData) {
        //Successfully loaded

        //Convert string to JSON
        weatherData = JSON.parse(weatherData);
        
        //Narrow return URL to relevant data
        var cityData = weatherData.city;
        weatherData = weatherData.list;

        //Hide loading icon
        loadingIcon.classList.add('hidden');

        //Display weather location
        weatherContentArea.innerHTML += `
            <a class="pure-u-24-24 weatherMain">
                <h2 class="newsItem-title">${cityData.name}, ${cityData.country}</h2>
                <span onclick="getUserLocation()" style="position:absolute;right:40px;top:95px"><img src="resources/location.svg"></span>   
                <h4 class="newsItem-title">Last updated: ${currentTime.toLocaleTimeString()}</h4>            
            </a>`;

        //Loop through weather data and display as list
        for (var day in weatherData) {
            weatherDesc = weatherData[day].weather[0].main;
            weatherTemp = Math.round(weatherData[day].temp.day);
            weatherCloud = weatherData[day].clouds;
            weatherDate = weatherData[day].dt;

            //Convert weatherDate to string day name
            weatherDate = convertToDay(weatherDate);

            weatherContentArea.innerHTML += `
            <a class="pure-u-24-24 weatherItem">
                <h2 class="pure-u-12-24 weatherItem-date">${weatherDate}</h2>            
                <h2 class="pure-u-11-24 weatherItem-desc">${weatherDesc}</h2>
                <h2 class="pure-u-12-24 weatherItem-temp">${weatherTemp}°C</h2>
                <h2 class="pure-u-11-24 weatherItem-cloud">${weatherCloud}% Cloud</h2>
            </a>`;
        }
    });

};

var getUserLocation = function() {
    navigator.geolocation.getCurrentPosition(saveUserLocation);
};

var saveUserLocation = function(position) {
    if (position !== null) {
        loadWeatherData(position.coords.latitude, position.coords.longitude);
    }
};

var apiCall = function() {
    this.get = function(apiURL, apiCallbackFunc) {
        
        var apiRequest = new XMLHttpRequest();

        apiRequest.onreadystatechange = function() { 
            if (apiRequest.readyState == 4 && apiRequest.status == 200) {
                apiCallbackFunc(apiRequest.responseText);
                refreshIcon.classList.remove('refresh__rotate');
            }
        };

        apiRequest.open( "GET", apiURL, true );            
        apiRequest.send( null );
    };
};

var refreshPage = function() {
    refreshIcon.classList.add('refresh__rotate');

    if (!newsContentArea.classList.contains('hidden')) {
        //News area must be currently displayed
        newsContentArea.innerHTML = "";

        //Remove the cached file
        caches.open('essentialsPWA-v1').then(function(cache) {
            cache.delete('https://umpox.github.io/essentials/news.json').then(function(response) {
                loadNewsData();
            });
        });
    }
    else if (!weatherContentArea.classList.contains('hidden')) {
        //Weather area must be currently displayed
        weatherContentArea.innerHTML = "";

        //Removed the cached file
        caches.open('essentialsPWA-v1').then(function(cache) {
            cache.delete('https://umpox.github.io/essentials/weather.json').then(function(response) {
                loadWeatherData();
            });
        });
    }
};

var returnToMenu = function() {
    if (!articleContentArea.classList.contains('hidden')) {
        //User must be trying to return to the articles feed
        articleContentArea.classList.add('hidden');
        newsContentArea.classList.remove('hidden');
        //Ensure that refreshIcon is visible
        refreshIcon.classList.remove('invisible');
    }
    else if(!offlineArticleArea.classList.contains('hidden')) {
        //User must be trying to return to the offline articles feed
        offlineArticleArea.classList.add('hidden');

        //Reload offline articles as the user could have deleted one
        loadOfflineArticles();        
    }
    else {
        //Set the header text
        headerText.innerHTML = '<h1>News</h1>';

        newsContentArea.classList.add('hidden');
        weatherContentArea.classList.add('hidden');
        offlineContentArea.classList.add('hidden');
        backBtnContainer.classList.add('hidden');
        refreshBtnContainer.classList.add('hidden');
        menuButtons.classList.remove('hidden');
    }
};

var convertToDay = function(time) {
    //Calculate numerical day from time
    var day = new Date(time * 1000).getDay();

    //Convert numeric day to textual data
    switch(day) {
        case 1:
            day = 'Monday';
            break;
        case 2:
            day = 'Tuesday';
            break;
        case 3:
            day = 'Wednesday';
            break;
        case 4:
            day = 'Thursday';
            break;
        case 5:
            day = 'Friday';
            break;
        case 6:
            day = 'Saturday';
            break;
        case 0:
            day = 'Sunday';
            break;
    }

    return day;
};
