import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";

const panel = document.querySelector("#profile .panel");
const cloudBox = document.createElement("div");
cloudBox.className = "notice";
cloudBox.innerHTML = '<strong>World account</strong><p id="cloudStatus">Connect Firebase to enable shared accounts, homes and voting.</p><div class="actions"><button type="button" id="googleSignIn" class="primary">Continue with Google</button><button type="button" id="signOut" class="hidden">Sign out</button></div>';
panel?.append(cloudBox);

const homePanel = document.querySelector("#myhome .panel");
const homeControls = document.createElement("div");
homeControls.innerHTML = '<div class="actions"><button type="button" id="claimPlot" class="primary" disabled>Claim my free plot</button></div><p id="plotStatus" class="muted">Sign in to check your plot.</p><div id="homeCustomiser" class="notice hidden"><h3>Customise your home</h3><label for="houseStyle">House design</label><select id="houseStyle"><option value="starter">Starter home</option><option value="modern">Modern glass home</option><option value="cottage">Garden cottage</option><option value="villa">Blue-roof villa</option></select><label for="plotLocation">Choose neighbourhood location</label><select id="plotLocation"><option value="0">Park side</option><option value="1">North gardens</option><option value="2">East district</option><option value="3">South gardens</option><option value="4">West district</option><option value="5">Central avenue</option></select><div class="actions"><button type="button" id="saveHouseStyle" class="primary">Save home design and location</button></div><p id="houseStyleStatus" class="muted">Choose a design and location.</p></div><div class="notice"><h3>Nearby neighbours</h3><p id="neighbourStatus" class="muted">Sign in to see registered homes in this world.</p><div id="neighbourList"></div></div>';
homePanel?.append(homeControls);

const communityPanel = document.querySelector("#community .panel");
const suggestionForm = document.createElement("form");
suggestionForm.className = "panel";
suggestionForm.innerHTML = '<h3>Suggest a street name</h3><label for="streetName">Street name</label><input id="streetName" maxlength="40" minlength="3" placeholder="Example: Aurora Avenue" required><button class="primary" type="submit">Submit suggestion</button><p class="muted" id="suggestionStatus">Sign in to suggest and vote.</p>';
communityPanel?.after(suggestionForm);
const liveIdeas = document.createElement("div");
liveIdeas.className = "panel";
liveIdeas.innerHTML = '<h3>Community suggestions</h3><div id="liveSuggestions" class="muted">Connect your world account to load suggestions.</div>';
suggestionForm.after(liveIdeas);

const status = document.querySelector("#cloudStatus");
const signInButton = document.querySelector("#googleSignIn");
const signOutButton = document.querySelector("#signOut");
const claimButton = document.querySelector("#claimPlot");
const plotStatus = document.querySelector("#plotStatus");
const homeCustomiser = document.querySelector("#homeCustomiser");
const houseStyleSelect = document.querySelector("#houseStyle");
const saveHouseStyleButton = document.querySelector("#saveHouseStyle");
const houseStyleStatus = document.querySelector("#houseStyleStatus");
const plotLocationSelect = document.querySelector("#plotLocation");
const neighbourStatus = document.querySelector("#neighbourStatus");
const neighbourList = document.querySelector("#neighbourList");
const ideaStatus = document.querySelector("#suggestionStatus");
const ideaList = document.querySelector("#liveSuggestions");

if (!firebaseConfigured) {
  status.textContent = "Firebase is not connected yet. The preview still works. Add your Firebase Web App settings to firebase-config.js, then enable Google sign-in and Firestore.";
  signInButton.disabled = true;
} else {
  startCloud();
}

async function startCloud() {
  try {
    const [{ initializeApp }, authSdk, dbSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]);
    const app = initializeApp(firebaseConfig);
    const auth = authSdk.getAuth(app);
    const db = dbSdk.getFirestore(app);
    signInButton.disabled = false;
    let presenceTimer=null, presenceUnsubscribe=null, currentPosition={x:0,z:0};
    const presenceStatus=document.querySelector("#multiplayerStatus");
    window.addEventListener("worldLocalPosition",event=>{currentPosition={x:Number(event.detail?.x)||0,z:Number(event.detail?.z)||0};});
    function stopPresence(uid){if(presenceTimer)clearInterval(presenceTimer);presenceTimer=null;if(presenceUnsubscribe)presenceUnsubscribe();presenceUnsubscribe=null;if(uid)dbSdk.deleteDoc(dbSdk.doc(db,"presence",uid)).catch(()=>{});window.dispatchEvent(new CustomEvent("worldPlayersUpdated",{detail:{players:[]}}));}
    function startPresence(user,displayName){
      if(presenceTimer)clearInterval(presenceTimer);if(presenceUnsubscribe)presenceUnsubscribe();
      const ref=dbSdk.doc(db,"presence",user.uid);
      const publish=()=>dbSdk.setDoc(ref,{displayName:String(displayName||"World visitor").slice(0,24),x:Math.max(-10000,Math.min(10000,currentPosition.x)),z:Math.max(-10000,Math.min(10000,currentPosition.z)),lastSeen:dbSdk.serverTimestamp()},{merge:true}).catch(e=>{if(presenceStatus)presenceStatus.textContent="Live player sync unavailable: "+e.message;});
      publish();presenceTimer=setInterval(publish,2500);
      presenceUnsubscribe=dbSdk.onSnapshot(dbSdk.query(dbSdk.collection(db,"presence"),dbSdk.limit(40)),snap=>{
        const now=Date.now();const players=snap.docs.filter(d=>d.id!==user.uid).map(d=>{const v=d.data();const seen=v.lastSeen?.toMillis?.()||0;return {id:d.id,displayName:String(v.displayName||"World visitor").slice(0,24),x:Number(v.x)||0,z:Number(v.z)||0,online:seen>0&&now-seen<12000};}).filter(p=>p.online);
        window.dispatchEvent(new CustomEvent("worldPlayersUpdated",{detail:{players}}));
        if(presenceStatus)presenceStatus.textContent="You are online · "+(players.length+1)+" player(s) online now.";
      },e=>{if(presenceStatus)presenceStatus.textContent="Live players need updated Firebase rules: "+e.message;});
    }

    window.addEventListener("worldProfileSaved", async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const local = JSON.parse(localStorage.getItem("worldProfile") || sessionStorage.getItem("worldProfile") || "{}");
        const worldName = String(local.worldName || "").replace(/[^A-Za-z0-9_]/g,"").slice(0,20);
        if (!worldName) return;
        await dbSdk.setDoc(dbSdk.doc(db,"profiles",user.uid), {
          displayName:String(local.displayName || "World Visitor").slice(0,24),
          worldName,
          instagram:String(local.instagram || "").slice(0,30),
          showInstagram:Boolean(local.showInstagram),
          interest:String(local.interest || "Explore the world").slice(0,40),
          updatedAt:dbSdk.serverTimestamp()
        }, {merge:true});
        status.textContent = "Your profile is saved and synced to your world account.";
      } catch (error) {
        status.textContent = "Profile saved on this device, but cloud sync failed: " + error.message;
      }
    });

    signInButton.addEventListener("click", async () => {
      try {
        const provider = new authSdk.GoogleAuthProvider();
        await authSdk.signInWithRedirect(auth, provider);
      } catch (error) {
        status.textContent = "Sign-in could not start: " + error.message;
      }
    });
    signOutButton.addEventListener("click", async () => {stopPresence(auth.currentUser?.uid);await authSdk.signOut(auth);});

    authSdk.onAuthStateChanged(auth, async user => {
      if (!user) {
        stopPresence(auth.currentUser?.uid);
        if(presenceStatus)presenceStatus.textContent="Sign in to join live multiplayer.";
        status.textContent = "Not signed in. Your local preview profile stays on this device.";
        signOutButton.classList.add("hidden");
        claimButton.disabled = true;
        homeCustomiser?.classList.add("hidden");
        plotStatus.textContent = "Sign in to claim your one free virtual home plot.";
        ideaStatus.textContent = "Sign in to suggest and vote.";
        return;
      }
      signInButton.classList.add("hidden");
      signOutButton.classList.remove("hidden");
      status.textContent = "Signed in. Your Google account is connected to this world.";
      claimButton.disabled = false;
      const local = JSON.parse(localStorage.getItem("worldProfile") || sessionStorage.getItem("worldProfile") || "{}");
      const profile = {
        displayName: String(local.displayName || user.displayName || "World Visitor").slice(0,24),
        worldName: String(local.worldName || ("visitor_" + user.uid.slice(0,8))).replace(/[^A-Za-z0-9_]/g,"").slice(0,20),
        instagram: String(local.instagram || "").slice(0,30),
        showInstagram: Boolean(local.showInstagram),
        interest: String(local.interest || "Explore the world").slice(0,40),
        updatedAt: dbSdk.serverTimestamp()
      };
      try {
        await dbSdk.setDoc(dbSdk.doc(db,"profiles",user.uid), profile, {merge:true});
      } catch (e) {
        status.textContent = "Signed in, but profile sync failed. Check Firestore rules: " + e.message;
      }
      await loadHome(user, db, dbSdk);
      startPresence(user,profile.displayName);
      await loadIdeas(db, dbSdk, user);
    });

    saveHouseStyleButton?.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) return;
      saveHouseStyleButton.disabled = true;
      try {
        await dbSdk.updateDoc(dbSdk.doc(db,"homes",user.uid), {houseStyle:houseStyleSelect.value,plotLocation:Number(plotLocationSelect.value)});
        houseStyleStatus.textContent = "Your home design and neighbourhood location are saved.";
        await loadHome(user,db,dbSdk);
      } catch (e) {
        houseStyleStatus.textContent = "Could not save design: " + e.message;
      } finally {
        saveHouseStyleButton.disabled = false;
      }
    });

    claimButton.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) return;
      const local = JSON.parse(localStorage.getItem("worldProfile") || sessionStorage.getItem("worldProfile") || "{}");
      const homeRef = dbSdk.doc(db,"homes",user.uid);
      try {
        const counterRef = dbSdk.doc(db,"worldMeta","plotCounter");
        await dbSdk.runTransaction(db, async tx => {
          const existing = await tx.get(homeRef);
          if (existing.exists()) throw new Error("You already have your one free plot.");
          const counter = await tx.get(counterRef);
          const plotNumber = counter.exists() ? Number(counter.data().nextPlot || 1) : 1;
          tx.set(homeRef, {
            ownerUid:user.uid,
            displayName:String(local.displayName || user.displayName || "World Visitor").slice(0,24),
            plotNumber,
            createdAt:dbSdk.serverTimestamp(),
            houseStyle:"starter",
            plotLocation:0
          });
          tx.set(counterRef,{nextPlot:plotNumber+1});
        });
        await loadHome(user, db, dbSdk);
      } catch (e) {
        plotStatus.textContent = e.message.includes("already") ? e.message : "Could not claim plot: " + e.message;
      }
    });

    suggestionForm.addEventListener("submit", async event => {
      event.preventDefault();
      const user = auth.currentUser;
      if (!user) { ideaStatus.textContent = "Sign in first."; return; }
      const local = JSON.parse(localStorage.getItem("worldProfile") || sessionStorage.getItem("worldProfile") || "{}");
      const name = document.querySelector("#streetName").value.trim();
      if (name.length < 3 || name.length > 40) return;
      try {
        await dbSdk.addDoc(dbSdk.collection(db,"streetSuggestions"), {
          name, createdBy:user.uid,
          creatorName:String(local.displayName || user.displayName || "World Visitor").slice(0,24),
          createdAt:dbSdk.serverTimestamp(), voteCount:0
        });
        document.querySelector("#streetName").value = "";
        ideaStatus.textContent = "Suggestion submitted!";
        await loadIdeas(db, dbSdk, user);
      } catch (e) {
        ideaStatus.textContent = "Could not submit: " + e.message;
      }
    });
  } catch (error) {
    status.textContent = "Firebase setup error: " + error.message;
  }
}


async function loadNeighbours(db,sdk,user){
  try{
    const result=await sdk.getDocs(sdk.query(sdk.collection(db,"homes"),sdk.limit(60)));
    const neighbours=result.docs.filter(d=>d.id!==user.uid).map(d=>({plotNumber:d.data().plotNumber||null,displayName:String(d.data().displayName||"World resident").slice(0,24),houseStyle:d.data().houseStyle||"starter",plotLocation:Number(d.data().plotLocation||0)}));
    neighbourList.replaceChildren();
    if(!neighbours.length){neighbourStatus.textContent="No other registered homes yet. Your neighbourhood is waiting for its first neighbours.";window.dispatchEvent(new CustomEvent("worldNeighboursLoaded",{detail:{homes:[]}}));return;}
    neighbourStatus.textContent=neighbours.length+" other registered home(s) found.";
    for(const home of neighbours){const row=document.createElement("p");row.className="muted";row.textContent="HOME #"+String(home.plotNumber||"—").padStart(4,"0")+" · "+home.displayName+" · "+home.houseStyle;neighbourList.append(row);}
    window.dispatchEvent(new CustomEvent("worldNeighboursLoaded",{detail:{homes:neighbours}}));
  }catch(e){neighbourStatus.textContent="Could not load neighbours: "+e.message;}
}

async function loadHome(user, db, sdk) {
  try {
    const snap = await sdk.getDoc(sdk.doc(db,"homes",user.uid));
    plotStatus.textContent = snap.exists()
      ? "Your home is reserved! House number: " + (snap.data().plotNumber ? String(snap.data().plotNumber).padStart(4,"0") : "pending migration")
      : "Your free plot is available. Tap Claim my free plot.";
    claimButton.disabled = snap.exists();
    homeCustomiser?.classList.toggle("hidden", !snap.exists());
    if (snap.exists()) window.dispatchEvent(new CustomEvent("worldHomeClaimed",{detail:{plotNumber:snap.data().plotNumber || null,houseStyle:snap.data().houseStyle || "starter",plotLocation:Number(snap.data().plotLocation || 0)}}));
    if (snap.exists() && houseStyleSelect) {
      houseStyleSelect.value = snap.data().houseStyle || "starter";
      if(plotLocationSelect)plotLocationSelect.value=String(Number(snap.data().plotLocation || 0));
      houseStyleStatus.textContent = "Your saved house design and location are loaded.";
    }
  } catch (e) {
    plotStatus.textContent = "Could not load plot: " + e.message;
  }
}

async function loadIdeas(db, sdk, user) {
  try {
    await loadNeighbours(db,sdk,user);
    const q = sdk.query(sdk.collection(db,"streetSuggestions"), sdk.orderBy("createdAt","desc"), sdk.limit(30));
    const result = await sdk.getDocs(q);
    ideaList.replaceChildren();
    if (result.empty) {
      ideaList.textContent = "No suggestions yet. Be the first to suggest a street name!";
      return;
    }
    for (const item of result.docs) {
      const data = item.data();
      const row = document.createElement("div");
      row.className = "vote";
      const label = document.createElement("span");
      const voteCount = await sdk.getCountFromServer(sdk.collection(db,"streetSuggestions",item.id,"votes"));
      label.textContent = data.name + " · " + voteCount.data().count + " votes · suggested by " + (data.creatorName || "Visitor");
      const vote = document.createElement("button");
      vote.type = "button";
      vote.textContent = "Vote";
      vote.addEventListener("click", async () => {
        if (!user) return;
        vote.disabled = true;
        try {
          await sdk.setDoc(sdk.doc(db,"streetSuggestions",item.id,"votes",user.uid), {createdAt:sdk.serverTimestamp()});
          vote.textContent = "Voted";
          const updatedCount = await sdk.getCountFromServer(sdk.collection(db,"streetSuggestions",item.id,"votes"));
          label.textContent = data.name + " · " + updatedCount.data().count + " votes · suggested by " + (data.creatorName || "Visitor");
        } catch (e) {
          vote.textContent = e.code === "permission-denied" ? "Already voted" : "Try again";
          vote.disabled = false;
        }
      });
      row.append(label,vote);
      ideaList.append(row);
    }
  } catch (e) {
    ideaList.textContent = "Could not load suggestions: " + e.message;
  }
}
