import { v4 as uuidV4 } from 'uuid';

export interface IFriend {
  id: string;
  displayName: string;
  email: string;
  invited: boolean;
}

let friends: IFriend[];

function loadFriends(): IFriend[] {
  // TODO: read friends from local storage
  const storedFriends = localStorage.getItem('friends');
  return storedFriends ? JSON.parse(storedFriends) : [];
}

function updateClearButtonStatus(): void {
  const clearButton = document.getElementById('clearBtn') as HTMLInputElement;
  clearButton.disabled = friends.length === 0;
}

function saveFriends(): void {
  // TODO: save friends to local storage
  localStorage.setItem('friends', JSON.stringify(friends));
  updateClearButtonStatus();
}

function onDeleteFriend(friendElement: HTMLElement): void {
  // Retrieve the associated IFriend object using the stored friendId
  const friendId = friendElement.id;
  const friendIndex = friends.findIndex((f) => f.id === friendId);

  if (
    friendIndex !== -1 &&
    confirm(`Are you sure you want to delete this friend?`)
  ) {
    // Remove the friend from the friends array
    friends.splice(friendIndex, 1);

    // Save the updated friends array to local storage
    saveFriends();

    // Remove the friendElement from the DOM
    friendElement.remove();
  }
}

function onInviteFriend(friendElement: HTMLElement): void {
  // TODO: event handler to invite a friend by email when a checkbox is checked
  const checkbox = friendElement.querySelector(
    '#emailCheckbox'
  ) as HTMLInputElement;

  const friendId = friendElement.id;
  const friend = friends.find((f) => f.id === friendId);

  if (checkbox.checked) {
    const subject = encodeURIComponent('I am inviting you to Chatter!');
    const body = encodeURIComponent(
      'Please visit  to register and invite your own Friends.'
    );

    if (friend) {
      window.open(`mailto:${friend?.email}?subject=${subject}&body=${body}`);

      checkbox.classList.add('checked');

      // Set the invited property of the associated IFriend object to true
      friend.invited = true;
    }
  } else {
    alert(
      'You may have already invited this friend! After unchecking this checkbox, you can re-invite this friend by rechecking it.'
    );
    checkbox.classList.remove('checked');

    if (friend) {
      friend.invited = false;
    }
  }

  // Save the updated friends array to local storage
  saveFriends();
}

function createRawFriendElement(friend: IFriend): HTMLElement {
  // TODO: create an HTML friend element without any listeners attached
  const friendElement = document.createElement('div');
  friendElement.classList.add('friend-col');

  friendElement.innerHTML = `  
        <div
          class="form-row"
          style="width: 100%; justify-content: space-between"
        >
          <div class="form-row" style="align-items: baseline; margin: 0.1rem">
            <input class="checkbox" type="checkbox" id="emailCheckbox"/>
            <span class="text-box-label" style="font-size: 1.2rem"
              >${friend.displayName}</span
            >
          </div>
          <button class="exit-button" title="Delete">&#10006;</button>
        </div>
        <div class="form-row">
          <div class="email" style="font-size: 0.8rem; text-align: left"
            >${friend.email}</div
          >
        </div>
  `;

  // Store the friend's id in the element's id property
  friendElement.id = friend.id;

  return friendElement;
}

function addBehaviorToFriendElement(friendElement: HTMLElement): HTMLElement {
  // Add listener to checkbox, checks and unchecks
  const checkbox = friendElement.querySelector(
    '#emailCheckbox'
  ) as HTMLInputElement;
  checkbox.addEventListener('click', () => {
    onInviteFriend(friendElement);
  });

  // Add listener to remove button to delete friend
  const exitButton = friendElement.querySelector(
    '.exit-button'
  ) as HTMLButtonElement;
  exitButton.addEventListener('click', () => {
    onDeleteFriend(friendElement);
  });

  return friendElement;
}

function appendFriendElementToDocument(friendElement: HTMLElement): void {
  const friendList = document.getElementById('friendList');

  if (friendList) {
    friendList.appendChild(friendElement);
    friendList.scrollTo(0, friendList.scrollHeight);
  }
}

function loadFriendsIntoDocument(): void {
  // TODO: read friends from local storage and add them to the document
  friends = loadFriends();

  friends.forEach((friend) => {
    const friendElement = createRawFriendElement(friend);
    addBehaviorToFriendElement(friendElement);
    appendFriendElementToDocument(friendElement);
    if (friend.invited) {
      const checkbox = friendElement.querySelector(
        '#emailCheckbox'
      ) as HTMLInputElement;
      checkbox.checked = true;
      checkbox.classList.add('checked');
    }
  });

  updateClearButtonStatus();
}

function onAddFriend(): void {
  // Get friend info from form
  const friendNameInput = document.getElementById(
    'friendName'
  ) as HTMLInputElement;
  const friendEmailInput = document.getElementById(
    'friendEmail'
  ) as HTMLInputElement;

  // Check for incomplete name
  if (!friendNameInput || friendNameInput.value.trim() === '') {
    alert('Please enter a name.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check for incomplete or invalid email
  if (
    !friendEmailInput ||
    friendEmailInput.value.trim() === '' ||
    !emailRegex.test(friendEmailInput.value)
  ) {
    alert(
      'Please enter an email with valid formatting (ex. myfriend@somedomain.com).'
    );
    return;
  }

  // Check for duplicate email
  const friendEmailLowerCase = friendEmailInput.value.toLowerCase();
  const dupFriend = friends.find(
    (friend) => friend.email.toLowerCase() === friendEmailLowerCase
  );
  if (dupFriend) {
    alert(
      `This email is already associated with ${dupFriend.displayName}. Please enter a different email address.`
    );
    friendEmailInput.value = '';
    return;
  }

  // Create new friend object
  const newFriend: IFriend = {
    id: uuidV4(),
    displayName: friendNameInput.value,
    email: friendEmailInput.value,
    invited: false
  };

  // Add friend to local storage
  friends.push(newFriend);
  saveFriends();

  const friendElement = createRawFriendElement(newFriend);
  addBehaviorToFriendElement(friendElement);
  appendFriendElementToDocument(friendElement);

  // Clear the input fields
  friendNameInput.value = '';
  friendEmailInput.value = '';
}

function clearFriendList(): void {
  if (confirm('Are you sure you want to clear your Friend List?')) {
    friends = []; // Clear the friends array
    saveFriends(); // Save the empty array to local storage
    const friendList = document.getElementById('friendList');
    if (friendList) {
      friendList.innerHTML = ''; // Clear the friend list display on the page
    }
  }
}

// Load friends into the document when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadFriendsIntoDocument();

  // Add event listener to the form submit button
  const addFriendBtn = document.getElementById(
    'addFriendBtn'
  ) as HTMLButtonElement;
  addFriendBtn.addEventListener('click', onAddFriend);

  // Add event listener to the Clear Friends button
  const clearFriendBtn = document.getElementById(
    'clearBtn'
  ) as HTMLButtonElement;
  clearFriendBtn.addEventListener('click', clearFriendList);
});
