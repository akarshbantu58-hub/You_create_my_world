import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#worldCanvas");
if (canvas) bootWorld();

function bootWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#6bb8e8");
  // A large gradient sky dome gives a distant horizon without a short fog cutoff.
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4500, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: "varying vec3 vWorldPosition; void main(){ vec4 p=modelMatrix*vec4(position,1.0); vWorldPosition=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }",
    fragmentShader: "varying vec3 vWorldPosition; void main(){ float h=normalize(vWorldPosition).y; vec3 horizon=vec3(0.62,0.82,0.94); vec3 zenith=vec3(0.025,0.10,0.28); float t=smoothstep(-0.12,0.72,h); gl_FragColor=vec4(mix(horizon,zenith,t),1.0); }"
  }));
  scene.add(sky);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 5000);
  camera.position.set(0, 310, 0);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0xaedcff, 0x23304b, 2.0));
  const sun = new THREE.DirectionalLight(0xffedcf, 2.4);
  sun.position.set(-16, 28, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const mat = (color, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
  const grass = mat("#285c58"), road = mat("#26364b"), roadLine = mat("#8ca7b6");
  const groundMat = mat("#183b50");
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(1200, 1210, 5, 128), groundMat);
  ground.position.y = -2.6; ground.receiveShadow = true; scene.add(ground);
  const mapCanvas=document.createElement("canvas"); mapCanvas.width=1024; mapCanvas.height=1024;
  const mapCtx=mapCanvas.getContext("2d");
  mapCtx.fillStyle="#356b45"; mapCtx.fillRect(0,0,1024,1024);
  let seed=9137;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<26000;i++){
    const x=random()*1024,y=random()*1024,r=2+random()*15;
    mapCtx.fillStyle=random()>.52?"rgba(117,151,83,0.12)":"rgba(18,66,48,0.13)";
    mapCtx.beginPath();mapCtx.ellipse(x,y,r,r*(.4+random()),random()*Math.PI,0,Math.PI*2);mapCtx.fill();
  }
  for(let i=0;i<95;i++){
    const x=random()*1024,y=random()*1024,r=12+random()*45;
    mapCtx.fillStyle="rgba(25,78,49,0.16)";mapCtx.beginPath();mapCtx.arc(x,y,r,0,Math.PI*2);mapCtx.fill();
  }
  const terrainTexture=new THREE.CanvasTexture(mapCanvas);
  terrainTexture.colorSpace=THREE.SRGBColorSpace;terrainTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const lawnMat=new THREE.MeshStandardMaterial({map:terrainTexture,roughness:1});
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(1200, 160),lawnMat);
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0; lawn.receiveShadow = true; scene.add(lawn);
  // Deep blue ocean and a soft coastal glow create a large open-world map.
  const oceanMat=new THREE.MeshStandardMaterial({color:"#087f9a",roughness:.72,metalness:.05});
  const ocean=new THREE.Mesh(new THREE.CircleGeometry(4200,160),oceanMat);
  ocean.rotation.x=-Math.PI/2;ocean.position.y=-5.2;scene.add(ocean);
  const coast=new THREE.Mesh(new THREE.RingGeometry(1196,1202,160),new THREE.MeshBasicMaterial({color:"#b9e7b4",transparent:true,opacity:.42,side:THREE.DoubleSide}));
  coast.rotation.x=-Math.PI/2;coast.position.y=.035;scene.add(coast);
  const texturePacks={
    natural:{label:"Natural",land:"#356b45",light:"rgba(133,164,91,0.18)",dark:"rgba(17,66,47,0.18)",road:"#35404a",line:"#c6c2a3",water:"#087f9a",leaves:"#4e9b72",ground:"#244b48"},
    tropical:{label:"Tropical",land:"#287b50",light:"rgba(166,190,91,0.22)",dark:"rgba(7,83,54,0.2)",road:"#3d4b42",line:"#d8d0a3",water:"#087fa5",leaves:"#2f9a59",ground:"#1e5947"},
    highlands:{label:"Highlands",land:"#777d58",light:"rgba(194,174,123,0.2)",dark:"rgba(57,71,58,0.22)",road:"#45484a",line:"#d5c9a5",water:"#477f91",leaves:"#6f875c",ground:"#535e52"},
    night:{label:"Night",land:"#182f36",light:"rgba(89,142,135,0.18)",dark:"rgba(4,17,31,0.28)",road:"#17263b",line:"#4c8795",water:"#073b67",leaves:"#245c55",ground:"#101e31"}
  };
  let activePack="natural";
  function paintTerrain(pack){
    mapCtx.fillStyle=pack.land;mapCtx.fillRect(0,0,1024,1024);
    let localSeed=9137;const rand=()=>{localSeed=(localSeed*1664525+1013904223)>>>0;return localSeed/4294967296;};
    for(let n=0;n<26000;n++){const x=rand()*1024,y=rand()*1024,r=2+rand()*15;mapCtx.fillStyle=rand()>.52?pack.light:pack.dark;mapCtx.beginPath();mapCtx.ellipse(x,y,r,r*(.4+rand()),rand()*Math.PI,0,Math.PI*2);mapCtx.fill();}
    for(let n=0;n<150;n++){const x=rand()*1024,y=rand()*1024,r=12+rand()*45;mapCtx.fillStyle=pack.dark;mapCtx.beginPath();mapCtx.arc(x,y,r,0,Math.PI*2);mapCtx.fill();}
    terrainTexture.needsUpdate=true;
  }

  // India-shaped overview layer used during the map-to-neighbourhood fly-in.
  const india = new THREE.Shape();
  const indiaPoints = [[0,72],[13,61],[18,48],[31,36],[25,22],[16,12],[12,-2],[4,-18],[-5,-38],[-13,-57],[-25,-43],[-34,-24],[-42,-5],[-35,12],[-25,27],[-18,43],[-8,58],[-2,68]];
  india.moveTo(indiaPoints[0][0],indiaPoints[0][1]);
  indiaPoints.slice(1).forEach(p=>india.lineTo(p[0],p[1]));
  india.closePath();
  const indiaMesh = new THREE.Mesh(new THREE.ShapeGeometry(india),new THREE.MeshStandardMaterial({color:"#5f9c70",roughness:1,side:THREE.DoubleSide}));
  indiaMesh.rotation.x=-Math.PI/2; indiaMesh.position.y=.025; indiaMesh.scale.set(1.65,1.65,1.65); indiaMesh.receiveShadow=true; scene.add(indiaMesh);
  const indiaEdge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(indiaPoints.map(p=>new THREE.Vector3(p[0]*1.65,.07,-p[1]*1.65))),new THREE.LineBasicMaterial({color:"#d7e8bd",transparent:true,opacity:.9}));
  scene.add(indiaEdge);

  // Curved-looking starter neighbourhood: central roads and small home plots.
  const roadA = new THREE.Mesh(new THREE.BoxGeometry(8, 0.08, 340), road);
  roadA.position.set(0, 0.05, 0); scene.add(roadA);
  const roadB = new THREE.Mesh(new THREE.BoxGeometry(340, 0.08, 8), road);
  roadB.position.set(0, 0.06, 0); scene.add(roadB);
  for (let n = -160; n <= 160; n += 8) {
    const dash1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 3.2), roadLine);
    dash1.position.set(0, 0.11, n); scene.add(dash1);
    const dash2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.025, 0.16), roadLine);
    dash2.position.set(n, 0.11, 0); scene.add(dash2);
  }

  const homeColors = ["#d9b98c", "#b7d3dc", "#d9a6a0", "#c7c1e8", "#d7d5c4", "#a7c9ad"];
  function addHouse(x, z, i) {
    const group = new THREE.Group(); group.position.set(x, 0, z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.1, 3), mat(homeColors[i % homeColors.length]));
    base.position.y = 1.1; base.castShadow = true; base.receiveShadow = true; group.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.35, 4), mat("#33445d"));
    roof.position.y = 2.82; roof.rotation.y = Math.PI / 4; roof.castShadow = true; group.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.55, 1.05, .08), mat("#563c31"));
    door.position.set(0, .55, 1.55); group.add(door);
    const windowMat = new THREE.MeshStandardMaterial({ color: "#83d9ef", emissive: "#276b85", emissiveIntensity: .35 });
    for (const wx of [-.95, .95]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(.62, .58, .08), windowMat);
      win.position.set(wx, 1.35, 1.55); group.add(win);
    }
    scene.add(group);
  }
  // Larger town grid: many residential blocks around the central avenues.
  const plots = [];
  for (let x=-144; x<=144; x+=24) {
    for (let z=-144; z<=144; z+=24) {
      if (Math.abs(x)<17 || Math.abs(z)<17 || Math.hypot(x,z)>160) continue;
      plots.push([x,z]);
    }
  }
  function getPlotForLocation(plotNumber, location) {
    const zones = [
      p => p[0] < 0 && p[1] < 0,
      p => p[1] < -60,
      p => p[0] > 60,
      p => p[1] > 60,
      p => p[0] < -60,
      p => Math.abs(p[0]) <= 48 && Math.abs(p[1]) <= 48
    ];
    const candidates = plots.filter(zones[Math.max(0,Math.min(5,Number(location)||0))]);
    const pool = candidates.length ? candidates : plots;
    return pool[(Math.max(1,Number(plotNumber)||1)-1)%pool.length];
  }
  plots.forEach((p,i) => {
    addHouse(p[0],p[1],i);
    const dot=new THREE.Mesh(new THREE.CircleGeometry(.72,16),new THREE.MeshBasicMaterial({color:"#ffad32"}));
    dot.rotation.x=-Math.PI/2;dot.position.set(p[0],.18,p[1]);scene.add(dot);
    const halo=new THREE.Mesh(new THREE.RingGeometry(.78,1.08,20),new THREE.MeshBasicMaterial({color:"#fff0b0",transparent:true,opacity:.78,side:THREE.DoubleSide}));
    halo.rotation.x=-Math.PI/2;halo.position.set(p[0],.19,p[1]);scene.add(halo);
  });

  // Show the signed-in visitor's reserved plot when Firebase reports it.
  let ownedPlotGroup = null;
  function showOwnedPlot(plotNumber, houseStyle="starter", plotLocation=0) {
    if (ownedPlotGroup) scene.remove(ownedPlotGroup);
    if (!Number.isInteger(plotNumber) || plotNumber < 1) return;
    const spot = getPlotForLocation(plotNumber,plotLocation);
    const [px,pz] = spot;
    const group = new THREE.Group();
    group.position.set(px,0,pz);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.1,3.55,40),new THREE.MeshBasicMaterial({color:"#62e9f1",side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.y=.08; group.add(ring);
    const bodyColor = houseStyle==="modern" ? "#a8d9e8" : houseStyle==="cottage" ? "#d7b68d" : houseStyle==="villa" ? "#c4d6ee" : "#d9c5a2";
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.8,2.5,3.5),mat(bodyColor));
    body.position.y=1.3; body.castShadow=true; group.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.9,1.5,4),mat(houseStyle==="villa" ? "#426db0" : "#354963"));
    roof.position.y=3.25; roof.rotation.y=Math.PI/4; roof.castShadow=true; group.add(roof);
    const badgeCanvas=document.createElement("canvas"); badgeCanvas.width=512; badgeCanvas.height=128;
    const ctx=badgeCanvas.getContext("2d");
    ctx.fillStyle="#071526"; ctx.fillRect(0,0,512,128);
    ctx.strokeStyle="#62e9f1"; ctx.lineWidth=8; ctx.strokeRect(4,4,504,120);
    ctx.fillStyle="#eafcff"; ctx.font="bold 54px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("HOME #"+String(plotNumber).padStart(4,"0"),256,64);
    const texture=new THREE.CanvasTexture(badgeCanvas);
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
    tag.position.set(0,5.4,0); tag.scale.set(8,2,1); group.add(tag);
    scene.add(group); ownedPlotGroup=group;
    document.querySelector("#worldHint").textContent="Your reserved home is marked HOME #"+String(plotNumber).padStart(4,"0")+". Use the joystick to explore.";
  }
  window.addEventListener("worldHomeClaimed",event=>{
    const detail=event.detail||{};
    showOwnedPlot(Number(detail.plotNumber),detail.houseStyle||"starter",Number(detail.plotLocation||0));
  });

  let neighbourMarkers = [];
  window.addEventListener("worldNeighboursLoaded",event=>{
    neighbourMarkers.forEach(g=>scene.remove(g)); neighbourMarkers=[];
    const homes=(event.detail&&event.detail.homes)||[];
    homes.forEach(home=>{
      if(!Number.isInteger(home.plotNumber)||home.plotNumber<1)return;
      const [x,z]=getPlotForLocation(home.plotNumber,home.plotLocation);
      const marker=new THREE.Group(); marker.position.set(x,0,z);
      const ring=new THREE.Mesh(new THREE.RingGeometry(2.6,3.0,32),new THREE.MeshBasicMaterial({color:"#9d8cff",side:THREE.DoubleSide}));
      ring.rotation.x=-Math.PI/2;ring.position.y=.09;marker.add(ring);
      const pin=new THREE.Mesh(new THREE.ConeGeometry(.38,.9,12),new THREE.MeshStandardMaterial({color:"#9d8cff",emissive:"#463b9a",emissiveIntensity:.5}));
      pin.position.y=1.1;marker.add(pin);scene.add(marker);neighbourMarkers.push(marker);
    });
  });

  // Natural blue river paths across the land.
  function addRiver(points,width=1.15){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.13,p[1])));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,100,width,8,false),new THREE.MeshStandardMaterial({color:"#3aa9c3",roughness:.35,metalness:.12}));
    scene.add(mesh);
  }
  addRiver([[-145,-82],[-105,-62],[-75,-28],[-38,-18],[-8,4],[34,24],[70,50],[120,78]],1.25);
  addRiver([[-130,105],[-95,76],[-62,58],[-32,36],[5,20],[42,-5],[88,-34],[132,-58]],.85);
  // A small park, trees and a glowing community beacon.
  const park = new THREE.Mesh(new THREE.CircleGeometry(5, 32), mat("#39745a"));
  park.rotation.x = -Math.PI/2; park.position.set(-9,.04,0); scene.add(park);
  let leafMaterial=mat("#4e9b72");
  function tree(x,z) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,1.4,8),mat("#76543b"));
    trunk.position.set(x,.7,z); trunk.castShadow=true; scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.05,12,10),leafMaterial);
    crown.position.set(x,1.8,z); crown.castShadow=true; scene.add(crown);
  }
  // A wide outer landscape gives the town a sense of distance beyond the starter streets.
  const forestGeometry=new THREE.ConeGeometry(3.2,9,7);
  const forestTrunkGeometry=new THREE.CylinderGeometry(.35,.5,2.4,6);
  const forestLeaves=new THREE.InstancedMesh(forestGeometry,leafMaterial,520);
  const forestTrunks=new THREE.InstancedMesh(forestTrunkGeometry,mat("#76543b"),520);
  const forestDummy=new THREE.Object3D();let forestCount=0,forestSeed=7141;
  const forestRandom=()=>{forestSeed=(forestSeed*1664525+1013904223)>>>0;return forestSeed/4294967296;};
  for(let n=0;n<520;n++){
    const angle=forestRandom()*Math.PI*2, radius=360+forestRandom()*760;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    forestDummy.position.set(x,4.5,z);forestDummy.rotation.y=forestRandom()*Math.PI;const scale=.65+forestRandom()*1.35;forestDummy.scale.set(scale,scale,scale);forestDummy.updateMatrix();forestLeaves.setMatrixAt(forestCount,forestDummy.matrix);
    forestDummy.position.y=1.2;forestDummy.scale.set(scale,scale,scale);forestDummy.updateMatrix();forestTrunks.setMatrixAt(forestCount,forestDummy.matrix);forestCount++;
  }
  forestLeaves.count=forestCount;forestTrunks.count=forestCount;scene.add(forestTrunks,forestLeaves);
  [[-12,-2],[-7,-3],[-12,3],[-6,2],[7,8],[22,8],[-23,-5],
   [-80,-65],[-88,-70],[-72,-78],[78,68],[86,74],[72,82],
   [-112,55],[-120,62],[110,-58],[118,-66],[-45,112],[48,-118]].forEach(p=>tree(...p));
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.28,.5,3.2,12),new THREE.MeshStandardMaterial({color:"#58e5ee",emissive:"#168da8",emissiveIntensity:1.2}));
  beacon.position.set(0,1.7,-8); scene.add(beacon);

  // A recognisable human avatar built from detailed 3D body parts.
  const player = new THREE.Group();
  const skin = mat("#d9a47f"), shirt = mat("#247b9a"), trousers = mat("#26334c"), shoes = mat("#18202c"), hair = mat("#241b19");
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.34,.62,6,12),shirt);
  torso.position.y=1.18; torso.castShadow=true; player.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,.2,12),skin);
  neck.position.y=1.64; player.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.245,24,18),skin);
  head.position.y=1.91; head.scale.set(1,1.12,.92); head.castShadow=true; player.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.25,20,12,0,Math.PI*2,0,Math.PI*.56),hair);
  hairCap.position.set(0,2.01,-.015); hairCap.scale.set(1.04,.95,1); player.add(hairCap);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(.13,14,10),hair);
  fringe.position.set(0,2.04,.19); fringe.scale.set(1,.5,.45); player.add(fringe);
  const eyeWhite=mat("#fff7e9"), iris=mat("#30251f");
  for(const x of [-.085,.085]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),eyeWhite);
    eye.position.set(x,1.94,.216); player.add(eye);
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),iris);
    pupil.position.set(x,1.94,.246); player.add(pupil);
  }
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),skin);
  nose.position.set(0,1.885,.245); nose.scale.set(.8,1,.8); player.add(nose);
  const armPivots=[], legPivots=[];
  function makeLimb(parent,x,y,length,radius,material,rotation=0){
    const pivot=new THREE.Group(); pivot.position.set(x,y,0); pivot.rotation.z=rotation; parent.add(pivot);
    const limb=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length-radius*2,4,10),material);
    limb.position.y=-length/2; limb.castShadow=true; pivot.add(limb);
    return pivot;
  }
  for(const side of [-1,1]){
    const arm=makeLimb(player,side*.43,1.42,.72,.115,shirt,side*-.08); armPivots.push(arm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),skin); hand.position.set(0,-.76,0); arm.add(hand);
    const leg=makeLimb(player,side*.18,.78,.78,.14,trousers,0); legPivots.push(leg);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(.25,.13,.38),shoes); shoe.position.set(0,-.8,.08); shoe.castShadow=true; leg.add(shoe);
  }
  player.position.set(3,0,9); player.visible=false; scene.add(player);

  let firstPerson = false, yaw = Math.PI, pitch = -.12;
  const introStarted=performance.now();
  const introDuration=6800;
  const mapStart=new THREE.Vector3(0,1850,0);
  const mapTarget=new THREE.Vector3(0,0,0);
  let introComplete=false;
  const held = new Set();
  let cameraZoom = 8;
  const mode = document.querySelector("#cameraMode");
  const thirdBtn = document.querySelector("#thirdView"), firstBtn = document.querySelector("#firstView");
  function setView(first) {
    firstPerson = first;
    player.visible = !first && introComplete;
    mode.textContent = first ? "First-person view" : "Third-person view";
    thirdBtn.classList.toggle("primary", !first);
    firstBtn.classList.toggle("primary", first);
  }
  thirdBtn?.addEventListener("click",()=>setView(false));
  firstBtn?.addEventListener("click",()=>setView(true));
  document.querySelector("#resetWorld")?.addEventListener("click",()=>{
    player.position.set(3,0,9); yaw=Math.PI; pitch=-.12;
  });

  // Touch joystick replaces keyboard movement for phone/tablet play.
  const joystick = document.querySelector("#worldJoystick");
  const stick = document.querySelector("#joystickStick");
  let joystickPointer = null, joyX = 0, joyY = 0, walkPhase = 0;
  const clock = new THREE.Clock();
  function updateJoystick(e){
    const r=joystick.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    const dx=e.clientX-cx, dy=e.clientY-cy, max=r.width*.34, len=Math.hypot(dx,dy)||1;
    const scale=Math.min(1,max/len); joyX=dx/len*scale; joyY=dy/len*scale;
    stick.style.transform=`translate(${joyX*max}px, ${joyY*max}px)`;
  }
  joystick?.addEventListener("pointerdown",e=>{e.preventDefault();joystickPointer=e.pointerId;if(joystick.setPointerCapture)joystick.setPointerCapture(e.pointerId);updateJoystick(e);});
  joystick?.addEventListener("pointermove",e=>{if(e.pointerId===joystickPointer)updateJoystick(e);});
  const releaseJoy=()=>{joystickPointer=null;joyX=0;joyY=0;if(stick)stick.style.transform="translate(0,0)";};
  joystick?.addEventListener("pointerup",releaseJoy);joystick?.addEventListener("pointercancel",releaseJoy);joystick?.addEventListener("lostpointercapture",releaseJoy);
  let runMode=false, jumpVelocity=0, grounded=true, visitCooldown=0;
  const runButton=document.querySelector("#runMode");
  const jumpButton=document.querySelector("#jumpPlayer");
  const visitButton=document.querySelector("#visitNearby");
  runButton?.addEventListener("click",()=>{runMode=!runMode;runButton.classList.toggle("primary",runMode);runButton.textContent=runMode?"RUN: ON":"RUN";});
  jumpButton?.addEventListener("click",()=>{if(grounded){jumpVelocity=7.2;grounded=false;}});
  visitButton?.addEventListener("click",()=>{
    let nearest=null, distance=Infinity;
    for(const [index,p] of plots.entries()){
      const d=Math.hypot(player.position.x-p[0],player.position.z-p[1]);
      if(d<distance){distance=d;nearest=index;}
    }
    const hint=document.querySelector("#worldHint");
    if(nearest!==null&&distance<8){
      hint.textContent="You are visiting the outside of neighbourhood home "+String(nearest+1).padStart(4,"0")+". House interiors and owner-approved visits are coming later.";
    }else{
      hint.textContent="Walk closer to a house, then tap Visit nearby home.";
    }
  });
  const packSelect=document.querySelector("#texturePack");
  function applyTexturePack(name){
    const pack=texturePacks[name]||texturePacks.natural;activePack=name in texturePacks?name:"natural";
    paintTerrain(pack);road.color.set(pack.road);roadLine.color.set(pack.line);oceanMat.color.set(pack.water);groundMat.color.set(pack.ground);leafMaterial.color.set(pack.leaves);forestLeaves.material=leafMaterial;
    const status=document.querySelector("#worldHint");if(status)status.textContent=pack.label+" texture pack active. Explore the expanded terrain with the joystick.";
  }
  paintTerrain(texturePacks.natural);
  packSelect?.addEventListener("change",()=>applyTexturePack(packSelect.value));
  const zoomControl=document.querySelector("#cameraZoom");
  zoomControl?.addEventListener("input",()=>{cameraZoom=Number(zoomControl.value);});
  document.querySelector("#zoomOut")?.addEventListener("click",()=>{cameraZoom=Math.min(22,cameraZoom+1);if(zoomControl)zoomControl.value=String(cameraZoom);});
  document.querySelector("#zoomIn")?.addEventListener("click",()=>{cameraZoom=Math.max(3,cameraZoom-1);if(zoomControl)zoomControl.value=String(cameraZoom);});
  document.querySelector("#worldFullscreen")?.addEventListener("click",async()=>{
    const frame=document.querySelector(".world-frame");
    try{if(!document.fullscreenElement)await frame.requestFullscreen();else await document.exitFullscreen();}catch(e){document.querySelector("#worldHint").textContent="Fullscreen is not available in this browser. Try the browser menu.";}
  });

  let dragging=false,lastX=0,lastY=0;
  canvas.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener("pointermove",e=>{
    if(!dragging)return;
    yaw-=(e.clientX-lastX)*.006;
    pitch=Math.max(-.75,Math.min(.35,pitch-(e.clientY-lastY)*.004));
    lastX=e.clientX;lastY=e.clientY;
  });
  const stopDrag=()=>dragging=false;
  canvas.addEventListener("pointerup",stopDrag);canvas.addEventListener("pointercancel",stopDrag);

  function resize(){
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const forward = new THREE.Vector3(), right = new THREE.Vector3(), target = new THREE.Vector3();
  const remotePlayers = new Map();
  window.addEventListener("worldPlayersUpdated",event=>{
    const incoming=(event.detail&&event.detail.players)||[];
    const keep=new Set(incoming.map(p=>p.id));
    for(const [id,entry] of remotePlayers){if(!keep.has(id)){scene.remove(entry.group);remotePlayers.delete(id);}}
    for(const data of incoming){
      let entry=remotePlayers.get(data.id);
      if(!entry){
        const group=new THREE.Group();
        const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.85,4,8),mat("#9d8cff"));
        body.position.y=1.05;body.castShadow=true;group.add(body);
        const head=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),mat("#f0c9a8"));
        head.position.y=1.85;group.add(head);
        const badgeCanvas=document.createElement("canvas");badgeCanvas.width=512;badgeCanvas.height=112;
        const ctx=badgeCanvas.getContext("2d");ctx.fillStyle="#071526dd";ctx.fillRect(0,0,512,112);
        ctx.strokeStyle="#9d8cff";ctx.lineWidth=7;ctx.strokeRect(4,4,504,104);
        ctx.fillStyle="#ffffff";ctx.font="bold 42px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText(String(data.displayName||"Visitor").slice(0,20),256,56);
        const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(badgeCanvas),transparent:true,depthTest:false}));
        sprite.position.y=2.65;sprite.scale.set(5.2,1.15,1);group.add(sprite);
        scene.add(group);entry={group,target:new THREE.Vector3(data.x||0,0,data.z||0)};
        remotePlayers.set(data.id,entry);
      }
      entry.target.set(THREE.MathUtils.clamp(Number(data.x)||0,-1180,1180),0,THREE.MathUtils.clamp(Number(data.z)||0,-1180,1180));
    }
  });
  let lastPositionBroadcast=0;
  function animate(){
    requestAnimationFrame(animate);
    const forwardKey=joyY < -.12, backKey=joyY > .12;
    const leftKey=joyX < -.12, rightKey=joyX > .12;
    forward.set(-Math.sin(yaw),0,-Math.cos(yaw));
    right.set(Math.cos(yaw),0,-Math.sin(yaw));
    const delta=Math.min(clock.getDelta(),0.05);
    const now=performance.now();
    if(now-lastPositionBroadcast>250){lastPositionBroadcast=now;window.dispatchEvent(new CustomEvent("worldLocalPosition",{detail:{x:player.position.x,z:player.position.z}}));}
    for(const entry of remotePlayers.values()){entry.group.position.lerp(entry.target,Math.min(1,delta*8));entry.group.rotation.y=Math.atan2(player.position.x-entry.group.position.x,player.position.z-entry.group.position.z);}
    const moveX=joyX, moveZ=joyY;
    const moveLength=Math.hypot(moveX,moveZ);
    const moving=moveLength>0.16;
    if(moving){
      const direction=forward.clone().multiplyScalar(-moveZ).add(right.clone().multiplyScalar(moveX)).normalize();
      player.position.addScaledVector(direction,(runMode?16:9.5)*delta*Math.min(1,moveLength));
      player.rotation.y=Math.atan2(-direction.x,-direction.z);
      walkPhase+=delta*(runMode?15:10.5)*Math.min(1,moveLength);
      const swing=Math.sin(walkPhase)*0.62;
      legPivots[0].rotation.x=swing;
      legPivots[1].rotation.x=-swing;
      armPivots[0].rotation.x=-swing*0.65;
      armPivots[1].rotation.x=swing*0.65;
      torso.rotation.x=0.035+Math.abs(Math.sin(walkPhase*2))*0.025;
    } else {
      legPivots.forEach(l=>l.rotation.x=THREE.MathUtils.damp(l.rotation.x,0,10,delta));
      armPivots.forEach(a=>a.rotation.x=THREE.MathUtils.damp(a.rotation.x,0,10,delta));
      torso.rotation.x=THREE.MathUtils.damp(torso.rotation.x,0,10,delta);
    }
    if(!grounded||jumpVelocity!==0){player.position.y+=jumpVelocity*delta;jumpVelocity-=18*delta;if(player.position.y<=0){player.position.y=0;jumpVelocity=0;grounded=true;}}
    player.position.x=THREE.MathUtils.clamp(player.position.x,-1180,1180);
    player.position.z=THREE.MathUtils.clamp(player.position.z,-1180,1180);
    const eye=player.position.clone().add(new THREE.Vector3(0,firstPerson?1.55:2.3,0));
    const camOffset=firstPerson?new THREE.Vector3(0,0,0):new THREE.Vector3(Math.sin(yaw)*cameraZoom,cameraZoom*.42,Math.cos(yaw)*cameraZoom);
    const followPosition=eye.clone().add(camOffset);
    const followTarget=eye.clone().add(new THREE.Vector3(-Math.sin(yaw)*10,Math.sin(pitch)*10,-Math.cos(yaw)*10));
    const introT=THREE.MathUtils.clamp((performance.now()-introStarted)/introDuration,0,1);
    if(introT<1){
      const eased=introT*introT*(3-2*introT);
      camera.position.lerpVectors(mapStart,followPosition,eased);
      target.lerpVectors(mapTarget,followTarget,eased);
      camera.up.set(0,0,-1).lerp(new THREE.Vector3(0,1,0),eased).normalize();
      const overlay=document.querySelector("#worldLoading");
      const bar=document.querySelector("#worldLoadingBar");
      const label=document.querySelector("#worldLoadingLabel");
      if(bar)bar.style.width=(introT*100)+"%";
      if(label)label.textContent=introT<.28?"Loading India map…":introT<.68?"Finding your neighbourhood…":"Building the 3D streets…";
      if(overlay)overlay.style.opacity=String(Math.max(0,1-introT*1.35));
    }else{
      if(!introComplete){introComplete=true;player.visible=!firstPerson;const overlay=document.querySelector("#worldLoading");if(overlay)overlay.remove();}
      camera.position.copy(followPosition);
      target.copy(followTarget);
      camera.up.set(0,1,0);
    }
    camera.fov=firstPerson?THREE.MathUtils.clamp(62-(cameraZoom-8)*2,38,78):62;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    beacon.rotation.y+=.006;
    renderer.render(scene,camera);
  }
  animate();
}
