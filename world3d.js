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
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(34, 38, 3, 72), mat("#183b50"));
  ground.position.y = -1.6; ground.receiveShadow = true; scene.add(ground);
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(34, 72), grass);
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0; lawn.receiveShadow = true; scene.add(lawn);

  // Curved-looking starter neighbourhood: central roads and small home plots.
  const roadA = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.08, 62), road);
  roadA.position.set(0, 0.05, 0); scene.add(roadA);
  const roadB = new THREE.Mesh(new THREE.BoxGeometry(62, 0.08, 5.5), road);
  roadB.position.set(0, 0.06, 0); scene.add(roadB);
  for (let n = -26; n <= 26; n += 4) {
    const dash1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 1.8), roadLine);
    dash1.position.set(0, 0.11, n); scene.add(dash1);
    const dash2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.025, 0.12), roadLine);
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
  const plots = [
    [-10,-11],[-16,-9],[-10,10],[-16,12],[10,-11],[16,-9],[10,10],[16,12],
    [-25,-18],[-25,18],[25,-18],[25,18],[-18,-25],[18,-25],[-18,25],[18,25]
  ];
  plots.forEach((p,i) => addHouse(p[0],p[1],i));

  // A small park, trees and a glowing community beacon.
  const park = new THREE.Mesh(new THREE.CircleGeometry(5, 32), mat("#39745a"));
  park.rotation.x = -Math.PI/2; park.position.set(-9,.04,0); scene.add(park);
  function tree(x,z) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,1.4,8),mat("#76543b"));
    trunk.position.set(x,.7,z); trunk.castShadow=true; scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.05,12,10),mat("#4e9b72"));
    crown.position.set(x,1.8,z); crown.castShadow=true; scene.add(crown);
  }
  [[-12,-2],[-7,-3],[-12,3],[-6,2],[7,8],[22,8],[-23,-5]].forEach(p=>tree(...p));
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.28,.5,3.2,12),new THREE.MeshStandardMaterial({color:"#58e5ee",emissive:"#168da8",emissiveIntensity:1.2}));
  beacon.position.set(0,1.7,-8); scene.add(beacon);

  // Player is visible in third-person mode and hidden in first-person mode.
  const player = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.38,.8,4,8),mat("#55d7e5"));
  body.position.y = 1.0; body.castShadow=true; player.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),mat("#efc9a4"));
  head.position.y=1.72; player.add(head);
  const marker = new THREE.Mesh(new THREE.ConeGeometry(.18,.45,8),mat("#f4d477"));
  marker.position.set(0,2.12,0); marker.rotation.x=Math.PI; player.add(marker);
  player.position.set(3,0,9); scene.add(player);

  let firstPerson = false, yaw = Math.PI, pitch = -.12;
  const held = new Set();
  let cameraZoom = 8;
  const mode = document.querySelector("#cameraMode");
  const thirdBtn = document.querySelector("#thirdView"), firstBtn = document.querySelector("#firstView");
  function setView(first) {
    firstPerson = first;
    player.visible = !first;
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
  let joystickPointer = null, joyX = 0, joyY = 0;
  function updateJoystick(e){
    const r=joystick.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    const dx=e.clientX-cx, dy=e.clientY-cy, max=r.width*.34, len=Math.hypot(dx,dy)||1;
    const scale=Math.min(1,max/len); joyX=dx/len*scale; joyY=dy/len*scale;
    stick.style.transform=`translate(${joyX*max}px, ${joyY*max}px)`;
  }
  joystick?.addEventListener("pointerdown",e=>{e.preventDefault();joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);updateJoystick(e);});
  joystick?.addEventListener("pointermove",e=>{if(e.pointerId===joystickPointer)updateJoystick(e);});
  const releaseJoy=()=>{joystickPointer=null;joyX=0;joyY=0;if(stick)stick.style.transform="translate(0,0)";};
  joystick?.addEventListener("pointerup",releaseJoy);joystick?.addEventListener("pointercancel",releaseJoy);joystick?.addEventListener("lostpointercapture",releaseJoy);
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
  function animate(){
    requestAnimationFrame(animate);
    const forwardKey=joyY < -.12, backKey=joyY > .12;
    const leftKey=joyX < -.12, rightKey=joyX > .12;
    forward.set(-Math.sin(yaw),0,-Math.cos(yaw));
    right.set(Math.cos(yaw),0,-Math.sin(yaw));
    const speed=.12;
    if(forwardKey)player.position.addScaledVector(forward,speed);
    if(backKey)player.position.addScaledVector(forward,-speed);
    if(leftKey)player.position.addScaledVector(right,-speed);
    if(rightKey)player.position.addScaledVector(right,speed);
    player.position.x=THREE.MathUtils.clamp(player.position.x,-30,30);
    player.position.z=THREE.MathUtils.clamp(player.position.z,-30,30);
    player.rotation.y=yaw;
    const eye=player.position.clone().add(new THREE.Vector3(0,firstPerson?1.55:2.3,0));
    const camOffset=firstPerson?new THREE.Vector3(0,0,0):new THREE.Vector3(Math.sin(yaw)*cameraZoom,cameraZoom*.42,Math.cos(yaw)*cameraZoom);
    camera.position.copy(eye).add(camOffset);
    target.copy(eye).add(new THREE.Vector3(-Math.sin(yaw)*10,Math.sin(pitch)*10,-Math.cos(yaw)*10));
    camera.fov=firstPerson?THREE.MathUtils.clamp(62-(cameraZoom-8)*2,38,78):62;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    beacon.rotation.y+=.006;
    renderer.render(scene,camera);
  }
  animate();
}
