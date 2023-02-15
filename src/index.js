import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js'; //'firebase/app';
const firebaseConfig = {
  apiKey: "AIzaSyBSxg6mwQc4zoQ8VvRFyLg2Nwi8rTbXIXg",
  authDomain: "fir-web-codelab-a1.firebaseapp.com",
  projectId: "fir-web-codelab-a1",
  storageBucket: "fir-web-codelab-a1.appspot.com",
  messagingSenderId: "500408137603",
  appId: "1:500408137603:web:a9d8e512607d077ff5a8b6"
};
const app = initializeApp(firebaseConfig);

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js'; //'firebase/auth';
import {
  getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  where
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js' //firebase/firestore 'https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js';
// import * as firebaseui from 'https://www.gstatic.com/firebasejs/ui/6.0.2/firebase-ui-auth.js';

const auth = getAuth(app);
const db = getFirestore(app);

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

async function main() {
  var signedIn = false;
  $( document ).ready(function() {

    startRsvpButton.onclick = async () => { rsvpClicked() };
    rsvpYes.onclick = async (event) => { yesNo_onClick(event.target) };
    rsvpNo.onclick = async (event) => { yesNo_onClick(event.target) };

});

//#region sign in/out
  async function rsvpClicked() {
    if(signedIn) {
      var user = auth.currentUser;
      signOut(auth).then(() => {
        console.log(`${user.uid} is now signed out`);

      }).catch(error => { alert(`${error.code}: ${error.message}`); });
    }
    else { await SigninEmailPassword(); }
  }

  onAuthStateChanged(auth, user => {
    signedIn = user != null && user.uid != null;
    if (signedIn) {
      startRsvpButton.textContent = 'LOGOUT';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';
      subscribeGuestbook();
      subscribeCurrentRSVP(user);

    } else {
      startRsvpButton.textContent = 'RSVP';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none'; // block for testing, none is default
      unsubscribeGuestbook();
      unsubscribeCurrentRSVP();
    }
  });  
//#endregion

  async function yesNo_onClick(sender) {
    var willAttend = sender === rsvpYes;
    // alert(`sender: ${sender.id}\nattending: ${willAttend}\nuserId: ${auth.currentUser.uid}`);
    if (auth.currentUser != null) {
      const userRef = doc(db, 'attendees', auth.currentUser.uid);
      try {
        await setDoc(userRef, { attending: willAttend });
        console.log(`sent response that ${auth.currentUser.uid} will ${willAttend ? '' : 'not '}attend`);
      } catch (e) { alert(`setDoc error: ${e}`); console.error(e); }
    }
  }

  form.addEventListener('submit', async e => {
    // Prevent the default form redirect
    e.preventDefault();
    // Write a new message to the database collection "guestbook"
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid
    });
    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });

  // Listen to guestbook updates
  function subscribeGuestbook() {
    const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
    guestbookListener = onSnapshot(q, snaps => {
      // Reset page
      guestbook.innerHTML = '';
      // Loop through documents in database
      snaps.forEach(doc => {
        // Create an HTML entry for each document and add it to the chat
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + ': ' + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
  }
  function unsubscribeGuestbook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }
  // Listen for attendee list
  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );
  const unsubscribe = onSnapshot(attendingQuery, snap => {
    const newAttendeeCount = snap.docs.length;
    numberAttending.innerHTML = newAttendeeCount + ' people going';
  });

  // Listen for attendee list
  function subscribeCurrentRSVP(user) {
    const ref = doc(db, 'attendees', user.uid);
    rsvpListener = onSnapshot(ref, doc => {
      if (doc && doc.data()) {
        const attendingResponse = doc.data().attending;
        // Update css classes for buttons
        if (attendingResponse) {
          rsvpYes.className = 'clicked';
          rsvpNo.className = '';
        } else {
          rsvpYes.className = '';
          rsvpNo.className = 'clicked';
        }
      }
    });
  }
  function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
      rsvpListener();
      rsvpListener = null;
    }
    rsvpYes.className = '';
    rsvpNo.className = '';
  }

  function createGUID() {
    return('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }));
  }

  // sign in using my credentials
  async function SigninEmailPassword() {
    const signin = await signInWithEmailAndPassword(auth, 'seanglover.spg@gmail.com', 'k6K4Vj8wrvRSjTA')
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log(`${user.uid} is now signed in`);
      // ....... do something

    }).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(`${errorCode}: ${errorMessage}`);
      // ....... do something
      
    });
    return signin;
  }
}
main();