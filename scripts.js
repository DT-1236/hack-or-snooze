$(() => {
  const $submitNewButton = $('#submit');
  const $title = $('#title');
  const $url = $('#url');
  const $favorites = $('#favorites');
  const $newForm = $('#new-form');
  const $stories = $('#stories');
  const $clearFilter = $('.navbar-right');
  const $menuLogin = $('#menu-login');
  const $loginForm = $('#login-form');
  const $menuSignup = $('#menu-signup');
  const $signupForm = $('#signup-form');
  const $menuProfile = $('#menu-profile');
  const $profileForm = $('#profile-form');

  let fetchingStories = false;

  class StoryBoard {
    static attachStoryElement(title, url, prepend) {
      let $newLink = $('<a>', {
        text: ` ${title}`,
        href: url,
        target: '_blank'
      });
      let $small = $('<small>', {
        text: `(${getShortLink(url)})`
      });

      let $star = $('<span>', {
        class: 'far fa-star'
      });

      let $newStory = $('<li>').append($star, $newLink, $small);
      // reset new submission form
      $title.val('');
      $url.val('');
      if (prepend) {
        $stories.prepend($newStory);
      } else {
        $stories.append($newStory);
      }
      return $newStory;
    }

    static filterByHost(e) {
      let currentHostname = $(e.target).text();
      $stories
        .children('li')
        .filter(function(i, el) {
          return (
            $(el)
              .children('small')
              .text() !== currentHostname
          );
        })
        .hide();

      $stories.addClass('hide-numbers');
      $clearFilter.show();
      $favorites.text('all');
    }

    static toggleFavorite(e) {
      let storyId = StoryBoard.getStoryIdFromElement($(e.target));

      // not a favorite
      if ($(e.target).hasClass('far')) {
        user.addFavorite(storyId, () => $(e.target).toggleClass('far fas'));
      } else {
        user.removeFavorite(storyId, () => $(e.target).toggleClass('far fas'));
      }
    }

    static getStoryIdFromElement($element) {
      if ($element.parent().is('li')) {
        var $parent = $element.parent();
      } else {
        var $parent = $element.parent().parent();
      }
      let story = storyList.stories[$parent.index()];
      return story.storyId;
    }

    static filterByFavoriteOrShowAll(e) {
      if ($favorites.text() === 'favorites') {
        $stories
          .children('li')
          .filter(function(i, el) {
            return $(el)
              .children('.fa-star')
              .hasClass('far');
          })
          .hide();
        $stories.addClass('hide-numbers');
        $favorites.text('all');
      } else {
        // show everything
        $stories.children('li').show();
        $stories.removeClass('hide-numbers');
        $favorites.text('favorites');
      }
    }

    static initializeUserStoryList() {
      StoryList.getStories(storyList => {
        let storyListArray = storyList.stories;
        StoryBoard.populateUserStories(storyListArray);
      });
    }

    static populateUserStories(storiesArray) {
      let favoriteIds = new Set(user.favorites.map(story => story.storyId));
      let ownStoryIds = new Set(user.ownStories.map(story => story.storyId));
      for (let story of storiesArray) {
        let $element = StoryBoard.attachStoryElement(story.title, story.url);
        if (favoriteIds.has(story.storyId)) {
          StoryBoard.starPreviousFavorite($element);
        }
        if (ownStoryIds.has(story.storyId)) {
          StoryBoard.grantAccessToOwnStory($element);
        }
      }
    }

    static initializeAnonymousStoryList() {
      StoryList.getStories(function(storyList) {
        let storyListArray = storyList.stories;
        StoryBoard.populateAnonStoryList(storyListArray);
      });
    }

    static populateAnonStoryList(storiesArray) {
      for (let story of storiesArray) {
        StoryBoard.attachStoryElement(story.title, story.url);
      }
    }

    static starPreviousFavorite($element) {
      $element.children('span').toggleClass('far fas');
    }

    static grantAccessToOwnStory($element) {
      let ownButtons = $(`<div class = "d-inline float-right">`);
      let trashCan = $(`<span class="fas fa-trash-alt mr-2"></span>`);
      let editPencil = $(`<span class="fas fa-pencil-alt mr-2"></span>`);
      ownButtons.append(editPencil).append(trashCan);
      $element.append(ownButtons);
      $element.append(
        $(`
    <div class="update-form">
      <form class="form-horizontal">
        <div class="form-group row">
          <label for="title" class="pl-4 col-sm-1 form-label">title</label>
          <div class="col-sm-6">
            <input type="text" class="form-control update-title"
                   autocomplete="off">
          </div>
        </div>
        <div class="form-group row">
          <label for="url" class="pl-4 col-sm-1 form-label">url</label>
          <div class="col-sm-6">
            <input type="url" class="form-control update-url"
                   autocomplete="off">
          </div>
        </div>
        <div class="form-group">
          <div class="col-sm-offset-2 col-sm-10">
            <button type="submit" class="btn btn-primary update-submit">Update</button>
            <button type="submit" class="btn btn-secondary update-cancel">Cancel</button>
          </div>
        </div>
      </form>
    </div>`)
      );
    }

    static infiniteScroll() {
      if (
        $(window).scrollTop() >
        $(document).height() - $(window).height() - 100
      ) {
        let limit = 25;
        let skip = storyList.stories.length;

        if (!fetchingStories) {
          fetchingStories = true;
          storyList.getMoreStories(skip, limit, storyList => {
            if (user) {
              StoryBoard.populateUserStories(storyList.stories.slice(skip));
            } else {
              StoryBoard.populateAnonStoryList(storyList.stories.slice(skip));
            }
            fetchingStories = false;
          });
        }
      }
    }
  }

  class Forms {
    static removeOwnStory(e) {
      let storyName = $(e.target)
        .parent()
        .siblings('a')
        .text();
      if (confirm(`Are you sure you want to delete ${storyName}?`)) {
        let storyId = StoryBoard.getStoryIdFromElement($(e.target));
        storyList.removeStory(user, storyId, () => {
          $(e.target)
            .parent()
            .parent()
            .remove();
        });
      }
    }

    static addStory(e) {
      e.preventDefault();
      let title = $title.val();
      let url = $url.val();
      let author = user.name;
      storyList.addStory(user, { title, url, author }, newStory => {
        let $ownStoryElement = StoryBoard.attachStoryElement(
          newStory.title,
          newStory.url,
          'prepend'
        );
        StoryBoard.grantAccessToOwnStory($ownStoryElement);
        $submitNewButton.trigger('click');
      });
    }

    static submitUserUpdate(e) {
      e.preventDefault();
      if (
        $('#profile-password').val() === $('#profile-password-confirm').val()
      ) {
        let name = $('#profile-name').val();
        let password = $('#profile-password').val();
        if (!name && !password) {
          return;
        }
        let userDetails = {};
        if (name) {
          userDetails.name = name;
        }
        if (password) {
          userDetails.password = password;
        }
        $('#profile-form>form').trigger('reset');
        $profileForm.slideToggle();

        user.update(userDetails, updateDisplayedUserInfo);
        alert('Successfully updated information!');
      } else {
        alert('Passwords do not match.');
      }
    }

    static editStory(e) {
      e.preventDefault();
      let $formContainer = $(e.target).closest('.update-form');
      let title = $formContainer.find('input.update-title').val();
      let url = $formContainer.find('input.update-url').val();
      let storyIndex = $formContainer.parent().index();
      let story = storyList.stories[storyIndex];
      let storyData = { storyId: story.storyId };
      if (title) {
        storyData.title = title;
      }

      if (url) {
        storyData.url = url;
      }

      story.update(user, storyData, story => {
        $formContainer.children().trigger('reset');
        $formContainer.slideToggle();
        $formContainer
          .parent()
          .siblings('a')
          .text(story.title)
          .attr('href', story.url);
        $formContainer
          .parent()
          .siblings('small')
          .text(`(${getShortLink(story.url)})`);
      });
    }

    static signupUser(e) {
      e.preventDefault();
      let username = $('#signup-username').val();
      let password = $('#signup-password').val();
      let name = $('#signup-name').val();
      User.create(username, password, name, response => {
        updateDisplayedUserInfo();
        $('#signup-form>form').trigger('reset');
        $signupForm.slideToggle();
      });
    }

    static userLogin(e) {
      e.preventDefault();
      let username = $('#login-username').val();
      let password = $('#login-password').val();
      User.login(username, password, response => {
        updateDisplayedUserInfo();
        $('#login-form>form').trigger('reset');
        location.reload();
        $loginForm.slideToggle();
      });
    }

    static checkForPasswordMatch() {
      let pw1 = '#profile-password';
      let pw2 = '#profile-password-confirm';
      if ($(pw1).val() === $(pw2).val()) {
        if (!$(`${pw1}}, ${pw2}`).hasClass('is-valid')) {
          $(`${pw1}, ${pw2}`).toggleClass('is-valid not-valid');
        }
      } else {
        if ($(`${pw1}, ${pw2}`).hasClass('is-valid')) {
          $(`${pw1}, ${pw2}`).toggleClass('is-valid not-valid');
        }
      }
    }
  }

  $(window).on('scroll', StoryBoard.infiniteScroll);

  // Check for existing credentials, else browse anonymously
  if (localStorage.getItem('token')) {
    User.stayLoggedIn(user => {
      StoryBoard.initializeUserStoryList();
      updateDisplayedUserInfo();
    });
  } else {
    StoryBoard.initializeAnonymousStoryList();
  }

  $submitNewButton.click(() => {
    $newForm.slideToggle();
  });

  $menuLogin.click(logout);

  $menuSignup.click(() => {
    $signupForm.slideToggle();
  });

  $menuProfile.click(() => {
    $profileForm.slideToggle();
  });

  $stories.on('click', 'small', StoryBoard.filterByHost);

  $stories.on('click', '.fa-star', StoryBoard.toggleFavorite);

  $favorites.on('click', StoryBoard.filterByFavoriteOrShowAll);

  $signupForm.on('submit', Forms.signupUser);

  $loginForm.on('submit', Forms.userLogin);

  $('#profile-password, #profile-password-confirm').on(
    'keyup',
    Forms.checkForPasswordMatch
  );

  $('#profile-form').on('submit', Forms.submitUserUpdate);

  $newForm.on('submit', Forms.addStory);

  $stories.on('click', '.fa-trash-alt', Forms.removeOwnStory);

  $stories.on('click', '.update-submit', Forms.editStory);

  $stories.on('click', '.fa-pencil-alt', revealEditMenu);

  function updateDisplayedUserInfo() {
    $('p.display-user').text(`${user.name.split(' ')[0]} (${user.username})`);
    $('#profile-username').val(user.username);
    $('#profile-name').val(user.name);
    $('.p-created').text(user.createdAt);
    $('.p-updated').text(user.updatedAt);
    $menuLogin.text('Logout');
    $('#welcome-p').text('Welcome,');
  }

  // after the pencil has been clicked
  function revealEditMenu(e) {
    $(e.target)
      .parent()
      .next()
      .slideToggle();
  }

  function getShortLink(url) {
    let shortLink = '';

    if (url.slice(0, 13).includes('www.')) {
      shortLink = url.slice(url.indexOf('.') + 1);
    } else {
      shortLink = url.slice(url.indexOf('//') + 2);
    }

    if (shortLink.indexOf('/') === -1) {
      return shortLink.slice(0);
    } else {
      return shortLink.slice(0, shortLink.indexOf('/'));
    }
  }

  function logout() {
    if ($menuLogin.text() === 'Logout') {
      localStorage.clear();
      location.reload();
    }
    $loginForm.slideToggle();
  }
});
