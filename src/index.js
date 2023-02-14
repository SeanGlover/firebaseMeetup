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
import * as firebaseui from 'https://www.gstatic.com/firebasejs/ui/6.0.2/firebase-ui-auth.js';

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
  //#region firebaseui - is depricated

  // Initialize the FirebaseUI widget using Firebase
  //// import * as firebaseui from 'https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.js';
  //// const firebaseui = await import('https://www.gstatic.com/firebasejs/ui/6.0.2/firebase-ui-auth.js');
  // const ui = new firebaseui.auth.AuthUI(auth);
  // ui.start("#firebaseui", {
  //   signInOptions: [firebaseAuthObject.EmailAuthProvider.PROVIDER_ID],
  // });
  // const uiConfig = {
  //   credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  //   signInOptions: [
  //     EmailAuthProvider.PROVIDER_ID,
  //   ],
  //   callbacks: {
  //     signInSuccessWithAuthResult: function (authResult, redirectUrl) {
  //       // Handle sign-in.
  //       // Return false to avoid redirect.
  //       return false;
  //     },
  //   },
  // };
  //#endregion

  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      // User is signed in; allows user to sign out
      signOut(auth);

    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);

    }
  });

  startRsvpButton.onclick = async (event)=>{
    alert(event.target.id);
  }

  rsvpYes.onclick = async (event) => {yesNo_onClick(event.target)};
  rsvpNo.onclick = async (event) => {yesNo_onClick(event.target)};
  async function yesNo_onClick(sender) {
    if(!signedIn) {
      await SigninEmailPassword();
      signedIn = true;
    }
    else {

    }
    var willAttend = sender === rsvpYes;
    alert(`sender: ${sender.id}\nattending: ${willAttend}\nuserId: ${auth.currentUser.uid}`);
    if (auth.currentUser != null) {
      const userRef = doc(db, 'attendees', auth.currentUser.uid); // auth.currentUser.uid|'9b081a89-21e0-4f05-802c-af1652e3d2ce'
      try {
        await setDoc(userRef, { attending: willAttend });
      } catch (e) { alert(`setDoc error: ${e}`); console.error(e); }
    }
  }
    
  onAuthStateChanged(auth, user => {
    if (user) {
      startRsvpButton.textContent = 'LOGOUT';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';
      subscribeGuestbook();
      subscribeCurrentRSVP(user);
    } else {
      startRsvpButton.textContent = 'RSVP';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'block'; // block for testing, none is default
      unsubscribeGuestbook();
      unsubscribeCurrentRSVP();
    }
  });

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

  async function SigninEmailPassword() {
    const signin = await signInWithEmailAndPassword(auth, 'seanglover.spg@gmail.com', 'k6K4Vj8wrvRSjTA')
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      // ....... do something
    }).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    });
    return signin;
  }
  async function SignOut() {
    signOut(auth).then(() => {
      alert('signed out ok');
    }).catch((error) => {
      alert(error.message);
    });
  }
}
main();