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
const sectionReports = document.getElementById('sectionReports');
const detailsTemplate = document.getElementById('detailsTemplate');
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');
const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const submitForm = document.getElementById('submitForm');

let reportsListener = null;
let rsvpListener = null;
let guestbookListener = null;

async function main() {
  var signedIn = false;
  $( document ).ready(function() {

    startRsvpButton.onclick = async () => { rsvpClicked() };
    rsvpYes.onclick = async (event) => { yesNo_onClick(event.target) };
    rsvpNo.onclick = async (event) => { yesNo_onClick(event.target) };
    
    window.scrollTo(0, 0);
    // some test code to run
    var xx = false;
    if(xx) {
      document.getElementById("centreLeCap").open = true; // set this programatically
      addNewReport();
    }

});

//#region sign in/out
  // rsvp button signs the user in or out
  async function rsvpClicked() {
    if(signedIn) {
      var user = auth.currentUser;
      signOut(auth).then(() => {
        console.log(`${user.uid} is now signed out`);

      }).catch(error => { alert(`${error.code}: ${error.message}`); });
    }
    else { await SigninEmailPassword(); }
  }
  // catches firebase state change when a user signs in or out
  onAuthStateChanged(auth, user => {
    signedIn = user != null && user.uid != null;
    if (signedIn) {
      startRsvpButton.textContent = 'LOGOUT';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';
      subscribeGuestbook();
      subscribeCurrentRSVP(user);
      subscribeReportIteration();

    } else {
      startRsvpButton.textContent = 'RSVP';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none'; // block for testing, none is default
      unsubscribeGuestbook();
      unsubscribeCurrentRSVP();
    }
  });
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

  // create reports for each JSON file in firestore.reports collection
  function subscribeReportIteration() {
    // reset reports section - except the 'Reports' header and the Template
    var childrenReports = sectionReports.getElementsByClassName('details');
    for (var i=0, item; item = childrenReports[i]; i++) {
      if(item.id != 'detailsTemplate') {
        sectionReports.removeChild(item);
      }
    }
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'name'));
    reportsListener = onSnapshot(q, snaps => {
      // Create a new Details element for each document in the database
      snaps.forEach(doc => {
        var clone = detailsTemplate.cloneNode(true);
        var docData = doc.data();
        clone.id = docData.name;

        var summaryClone = clone.getElementsByTagName('summary')[0];
        summaryClone.innerHTML = docData.name;

        // dependant on if job is complete
        summaryClone.style.borderLeft = '15px solid grey';
        submitForm.disabled = true;
        submitForm.className = "button pure-button button-xlarge";

        clone.style = "display: block";
        sectionReports.appendChild(clone);

        // const entry = document.createElement('p');
        // entry.textContent = doc.data().name + ': ' + doc.data().text;
        // guestbook.appendChild(entry);
      });
    });
  }
  function unsubscribeReportIteration() {

  }

  //#region misc functions
  function createGUID() {
return('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
}));
  }
  async function addNewReport() {
    try {
      await setDoc(doc(db, "reports", "leCap"),
      {
        "Serials": {
          "41752 Rainbow Bumpas- Set Of 3": [
            "N° 535"
          ],
          "21098RO Sensory Magic": [
            "N° 992"
          ],
          "41671 Maxi Bubble Tube Chassis Slim Profile": [
            "N° 10601657"
          ],
          "41148 Wireless Controller": [
            "N° 3752"
          ],
          "41541 Interative Light Engine": [
            "N° 10877"
          ],
          "42090 Ust Projector": [
            "N° Q7C6150HAAAAB0140"
          ],
          "37969 Laser Stars™": [
            "N° 114308_jan2022"
          ],
          "41655 Wi Fi Color Wall Controller": [
            "N° 1987"
          ],
          "21001R Wifi Led Furniture Cube": [
            "N° 1312"
          ],
          "22870R Sound To Sight Showtime Panel": [
            "N° 10642603"
          ],
          "22873R Color Catch Combo Panel": [
            "N° 10642807"
          ]
        },
        "Trained": {
          "Names": [
            "? in lieu of Nadine"
          ],
          "Products": {
            "37969": "Laser Stars™",
            "41148": "Wireless Controller",
            "41576": "Maxi Bubble Tube",
            "41655": "Wi Fi Color Wall Controller",
            "41671": "Maxi Bubble Tube Chassis Slim Profile",
            "41752": "Rainbow Bumpas- Set Of 3",
            "41838": "Acrylic Mirror- L96\" X W48\"",
            "42090": "Ust Projector",
            "42248": "Univ Flat Wall Mtn For 10-24 In Display",
            "21098RO": "Sensory Magic",
            "21001R": "Wifi Led Furniture Cube",
            "22870R": "Sound To Sight Showtime Panel",
            "22873R": "Color Catch Combo Panel"
          }
        },
        "Notes": {
          "Comments": "Client will add electrical for the projector / wall washer after-the-fact",
          "Issues": "Wall washer requires adjustment as per below instructions... \r\n● Repeatedly press the “MODE” button on the wall washer until the display on the back of the wall washer displays “Addr.”\r\n● Now repeatedly press the “SET UP” button until the display shows “d.001” (or similar number).\r\n● Press “UP” and “DOWN” until the display shows “d.001”. Now press the “SET UP” button once.\r\n● Use the “UP” and “DOWN” buttons to select “03C.H”"  
        }
      }
      );
    }
    catch (error) {
      alert(error.message);
    }   
  }
  //#endregion
}
main();