const BASE_URL = 'https://hack-or-snooze-v2.herokuapp.com';
let storyList;
let user;

function login(username, password) {
  $.post(`${BASE_URL}/login`, { user: { username, password } }, storeToken);
}

function storeToken(response) {
  localStorage.setItem('token', response.token);
}

function getToken() {
  let token = localStorage.getItem('token');
  if (token) {
    return token;
  } else {
    alert('Please login first.');
    return new Error('No token found, login first');
  }
}

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  // probablyDOMStuff should update global storyList variable
  static getStories(probablyDOMStuff) {
    // fetch stories from API
    $.getJSON(`${BASE_URL}/stories`, function(response) {
      const stories = response.stories.map(function(story) {
        return new Story(
          story.author,
          story.title,
          story.url,
          story.username,
          story.storyId
        );
      });
      const newStoryList = new StoryList(stories);
      return probablyDOMStuff(newStoryList);
    });
  }

  addStory(user, protoStoryObj, probablyDOMStuff) {
    $.post();
  }
}

class User {
  constructor(username, password, name) {
    (this.username = username),
      (this.password = password),
      (this.name = name),
      (this.loginToken = ''),
      (this.favorites = []),
      (this.ownStories = []),
      (this.login = this.login.bind(this)),
      (this.updateUserAndToken = this.updateUserAndToken.bind(this)),
      (this.retrieveDetails = this.retrieveDetails.bind(this));
  }

  //probablyDOMStuff should update global user
  static create(username, password, name, probablyDOMStuff) {
    $.post(
      `${BASE_URL}/signup`,
      { user: { username, password, name } },
      function(response) {
        user = new User(response.user.username, password, response.user.name);
        console.log(user);
        probablyDOMStuff(response);
      }
    );
  }

  // probablyDOMStuff function should update user's login token and global user variable
  login(probablyDOMStuff) {
    $.post(
      `${BASE_URL}/login`,
      { user: { username: this.username, password: this.password } },
      function(response) {
        probablyDOMStuff(response);
      }
    );
  }

  // does this need binding?
  retrieveDetails(probablyDOMStuff) {
    $.get(`${BASE_URL}/users/${this.username}`, function(response) {
      this.favorites = response.user.favorites;
      this.ownStories = response.user.stories;
      console.log(this.favorites);
      probablyDOMStuff(this);
    });
  }

  updateUserAndToken(response) {
    this.loginToken = response.token;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(this));
  }
}

class Story {
  constructor(author, title, url, username, storyId) {
    (this.author = author),
      (this.title = title),
      (this.url = url),
      (this.username = username),
      (this.storyId = storyId);
  }
}
