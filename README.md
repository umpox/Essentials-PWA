# Essentials-PWA
A performance-first progressive web application that provides essential news and weather data to users on low bandwidth connections.

The app uses a 'cache-first' approach; once news headlines are downloaded, they are stored on a users device and new content is only downloaded when a user requests so. A user can access the application and content without an internet connection. Articles are not downloaded automatically in order to save storage space on the device, users can save individual articles to the device using the 'Save Offline' feature. Said articles will then be accessible through the 'Available Offline' menu.

The application uses several implementations to improve performance on slow bandwidths:
- Serving only text data to the user, images and videos are stripped from the article content
- Providing an AMP-converted original link to the article. The Guardian is used as a news source which provides an AMP version of each news article.
- Service Workers are used to download the user interface to a users device improving loading times and allowing offline access.

## Screenshots:
| ![News](http://i.imgur.com/wZBc7mK.png)| ![Weather](http://i.imgur.com/zfXMUxH.png)|
|:---:|:---:|