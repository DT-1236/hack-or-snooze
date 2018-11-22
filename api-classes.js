const BASE_URL = 'https://hack-or-snooze-v2.herokuapp.com';
let storyList;
let user;

class StoryList {
  constructor(stories) {
    this.stories = stories;
    this.addStory = this.addStory.bind(this);
  }

  static getStories(success_callback) {
    // fetch stories from API
    $.getJSON(`${BASE_URL}/stories`, function(response) {
      const stories = response.stories.map(function(story) {
        return new Story(story);
      });
      storyList = new StoryList(stories);
      return success_callback(storyList);
    });
  }

  getMoreStories(skip, limit, success_callback) {
    $.getJSON(`${BASE_URL}/stories`, { skip, limit }, response => {
      const newStories = response.stories.map(function(story) {
        return new Story(story);
      });
      this.stories = this.stories.concat(newStories);
      return success_callback(this);
    });
  }

  addStory(user, protoStoryObj, success_callback) {
    $.post(
      `${BASE_URL}/stories`,
      { token: user.loginToken, story: protoStoryObj },
      response => {
        let newStory = new Story(response.story);
        this.stories.unshift(newStory);
        user.retrieveDetails(() => success_callback(newStory));
      }
    );
  }

  removeStory(user, storyId, success_callback) {
    $.ajax({
      url: `${BASE_URL}/stories/${storyId}`,
      type: 'DELETE',
      data: {
        token: user.loginToken
      },
      success: () => {
        let storyListIndex = this.stories.findIndex(
          story => story.storyId === storyId
        );
        this.stories.splice(storyListIndex, 1);
        storyListIndex = user.ownStories.findIndex(
          story => story.storyId === storyId
        );
        user.ownStories.splice(storyListIndex, 1);
        success_callback(this);
      }
    });
  }
}

class User {
  constructor(username, name, token, createdAt = '', updatedAt = '') {
    this.username = username;
    this.name = name;
    this.loginToken = token;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.favorites = [];
    this.ownStories = [];
  }

  static create(username, password, name, success_callback) {
    $.post(
      `${BASE_URL}/signup`,
      { user: { username, password, name } },
      function(response) {
        user = new User(
          response.user.username,
          response.user.name,
          response.token,
          response.user.createdAt,
          response.user.updatedAt
        );
        localStorage.setItem('username', response.user.username);
        localStorage.setItem('token', response.token);
        success_callback(response);
      }
    );
  }

  static login(username, password, success_callback) {
    $.post(`${BASE_URL}/login`, { user: { username, password } }, response => {
      user = new User(
        response.user.username,
        response.user.name,
        response.token,
        response.user.createdAt,
        response.user.updatedAt
      );
      localStorage.setItem('username', response.user.username);
      localStorage.setItem('token', response.token);
      success_callback(response);
    });
  }

  static stayLoggedIn(success_callback) {
    // if (localStorage.getItem("token")) {
    user = new User(
      localStorage.getItem('username'),
      '', // Will get filled when retrieveDetails is called
      localStorage.getItem('token')
    );
    user.retrieveDetails(success_callback);
  }

  retrieveDetails(success_callback) {
    $.get(
      `${BASE_URL}/users/${this.username}`,
      { token: this.loginToken },
      response => {
        this.favorites = response.user.favorites.map(
          favorite => new Story(favorite)
        );
        this.ownStories = response.user.stories.map(story => new Story(story));
        this.name = response.user.name;
        this.createdAt = response.user.createdAt;
        this.updatedAt = response.user.updatedAt;

        success_callback(this);
      }
    );
  }

  addFavorite(storyId, success_callback) {
    $.post(
      `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      { token: this.loginToken },
      () => {
        this.retrieveDetails(() => success_callback(this));
      }
    );
  }

  removeFavorite(storyId, success_callback) {
    $.ajax({
      url: `${BASE_URL}/users/${user.username}/favorites/${storyId}`,
      type: 'DELETE',
      data: {
        token: this.loginToken
      },
      success: () => {
        this.retrieveDetails(() => success_callback(this));
      }
    });
  }

  update(userData, success_callback) {
    const { username, favorites, ...userDetails } = userData;
    $.ajax({
      url: `${BASE_URL}/users/${this.username}`,
      type: 'PATCH',
      data: {
        token: localStorage.getItem('token'),
        user: userDetails
      },
      success: response => {
        this.name = response.user.name;
        success_callback(this);
      }
    });
  }

  remove(success_callback) {
    $.ajax({
      url: `${BASE_URL}/users/${this.username}`,
      type: 'DELETE',
      data: { token: this.loginToken },
      success: success_callback
    });
  }
}

class Story {
  constructor(storyDetails) {
    this.author = storyDetails.author;
    this.title = storyDetails.title;
    this.url = storyDetails.url;
    this.username = storyDetails.username;
    this.storyId = storyDetails.storyId;
  }

  update(user, storyData, success_callback) {
    const { storyId, ...storyDetails } = storyData;
    $.ajax({
      url: `${BASE_URL}/stories/${storyId}`,
      type: 'PATCH',
      data: {
        token: user.loginToken,
        story: storyDetails
      },
      success: response => {
        this.author = response.story.author;
        this.title = response.story.title;
        this.url = response.story.url;
        success_callback(this);
      }
    });
  }
}
