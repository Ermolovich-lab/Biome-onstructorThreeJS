import * as THREE from 'three';
import { GLTFLoader } from "GLTFLoader";

let camera, scene, renderer, light

let hexagonShape

const hexagonsMap = [];

const allObjects = [];

let isClickDown = false;

let raycaster;

let intersectionMap;

let intersectionObject;

let mousePosition;
let newMousePosition;
let deltaPosMouse;
let speedMouse = 9;

let isShiftDown = false;
let isCTRLDown = false;

init()
render()

function init(){
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  camera.position.y = 6;
  camera.rotateX(-45 * Math.PI / 180);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff);
  document.body.appendChild(renderer.domElement);

  light = new THREE.SpotLight(0xffffff, 1, 1000);
  light.position.set(0, 10, 5);
  light.rotateX(-45 * Math.PI / 180)
  scene.add(light);

  light = new THREE.SpotLight(0xffffff, 1, 1000);
  light.position.set(0, 10, 0);
  light.rotateX(-90 * Math.PI / 180)
  scene.add(light);

  raycaster = new THREE.Raycaster();

  hexagonShape = new THREE.Shape();
  hexagonShape.moveTo(0, 1);
  hexagonShape.lineTo(0.9, 0.5);
  hexagonShape.lineTo(0.9, -0.5);
  hexagonShape.lineTo(0, -1);
  hexagonShape.lineTo(-0.9, -0.5);
  hexagonShape.lineTo(-0.9, 0.5);
  hexagonShape.lineTo(0, 1);

  factoryMap( {x:-15, y: -4}, {x:18, y:5});

  document.addEventListener( 'pointerdown', onMouseKeyDown );
	document.addEventListener( 'pointerup', onMouseKeyUp );
  document.addEventListener( 'pointermove', onPointerMove );
  document.addEventListener( 'keydown', onDocumentKeyDown );
	document.addEventListener( 'keyup', onDocumentKeyUp );
  
  const inputsBiom = document.querySelectorAll('.biom');

  for(const input of inputsBiom){
    input.onclick = function(){
      biomFactory(input.value)
    };
  }

  const inputsBuild = document.querySelectorAll('.build');

  for(const input of inputsBuild){
    input.onclick = function(){
      buildingFactory(input.value, input.id)
    };
  }
}

function biomFactory(name){
  const hexagonGeometry = new THREE.ExtrudeGeometry(hexagonShape, { depth: 0.4, bevelEnabled: false });

  const hexagonMaterial = new THREE.MeshLambertMaterial( { color: getColorBiom(name), transparent: true,  opacity: 1 } );

  const hexagonMesh = new THREE.Mesh( hexagonGeometry, hexagonMaterial );

  hexagonMesh.position.set(0, 0, 1.1);

  const collGeometry = new THREE.ExtrudeGeometry(hexagonShape, { depth: 1.5, bevelEnabled: false });
  const collMaterial = new THREE.MeshLambertMaterial({ color: 0x00FFFF, transparent: true, opacity: 0, wireframe: true });

  const collMesh = new THREE.Mesh(collGeometry, collMaterial)

  collMesh.position.set(0, 2, 0);
  collMesh.rotateX(90 * Math.PI / 180);

  collMesh.add(hexagonMesh);

  collMesh.biomName = name;
  collMesh.tag = "Biom"

  scene.add(collMesh);

  allObjects.push(collMesh);
}

function buildingFactory(name, biom){

  const loader = new GLTFLoader();

  loader.load("Models/" + name + '/scene.glb', (buildMesh) => {

    const collGeometry = new THREE.BoxGeometry(1, 0.8, 1)
    const collMaterial = new THREE.MeshLambertMaterial({ color: 0x00FFFF, transparent: true, opacity: 0, wireframe: true });

    const collMesh = new THREE.Mesh(collGeometry, collMaterial)

    collMesh.add(buildMesh.scene)

    collMesh.biomName = biom;

    buildMesh.scene.position.set(0, -0.25, 0);
    collMesh.position.set(0, 2, 0)
    buildMesh.scene.scale.set(0.2, 0.2, 0.2);

    collMesh.tag = "Build"

    scene.add(collMesh);

    //builds.push(collMesh);
    allObjects.push(collMesh);
  });
}

function addHexagonOfMap(position) {

  const hexagonGeometry = new THREE.ExtrudeGeometry(hexagonShape, { depth: 0.4, bevelEnabled: false });
  const geo = new THREE.EdgesGeometry(hexagonGeometry);
  const mat = new THREE.LineBasicMaterial( { color: 0xFF00FF, transparent: true,  opacity: 0.1 } );

  const hexagonMesh = new THREE.LineSegments( geo, mat );

  hexagonMesh.position.set(position.x, position.y, position.z);

  hexagonMesh.rotateX(90 * Math.PI / 180);

  scene.add(hexagonMesh);

  hexagonsMap.tag = "Map";

  hexagonsMap.push(hexagonMesh);
  //allObjects.push(hexagonMesh);
}

function factoryMap(startPoint, size){
  let direction = [1.81, 0]
  let offsetX = 0.9;
  let offsetZ = 1.51;
  let currOffsetX = 0
  let currOffsetZ = 0

  for(let i = 0; i < size.y; i++){
    for(let j = 0; j < size.x; j++){
      addHexagonOfMap({ x:j * direction[0] + currOffsetX + startPoint.x, y: 0, z:i * direction[1] + currOffsetZ + startPoint.y});
    }

    offsetX *= -1;

    currOffsetX += offsetX
    currOffsetZ += offsetZ
  }
}

function onPointerMove(e) {

  newMousePosition = new THREE.Vector2();
  newMousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
  newMousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;  

  if(isClickDown && !isCTRLDown && !isShiftDown){

    if(!intersectionObject) return;

    deltaPosMouse = new THREE.Vector2();
    deltaPosMouse.x = mousePosition.x - newMousePosition.x;
    deltaPosMouse.y = mousePosition.y - newMousePosition.y;

    intersectionObject.object.position.set(
      intersectionObject.object.position.x - deltaPosMouse.x * speedMouse, 
      2, 
      intersectionObject.object.position.z + deltaPosMouse.y * speedMouse);
    
      if(intersectionObject.object.hex)
        intersectionObject.object.hex.biom = undefined;
  }

  mousePosition = newMousePosition;

  raycaster.setFromCamera(mousePosition, camera);
};

function intersectionsMap(){
  const intersections = raycaster.intersectObjects(hexagonsMap);

  if (intersections.length > 0) {

    if(intersectionMap)
      intersectionMap.object.material.opacity = 0.1

    intersectionMap = intersections[0];

    if(intersectionMap.object.material.opacity == 0.1)
      intersectionMap.object.material.opacity = 1
  }
}

function intersectionsObject(){
  let intersections = raycaster.intersectObjects(allObjects);

  if (intersections.length > 0) {
    return intersections[0];
  }
}

function getColorBiom(name){
  switch(name){
    case "Plains": return 0x00FF00;
    case "Tundra": return 0xC0C0C0;
    case "Desert": return 0xFFFF00;
    case "River": return 0x00FFFF;
  }
}

function onMouseKeyDown(e) {
  isClickDown = true

  if(!intersectionObject) return;
  if(intersectionObject.object.tag != "Biom") return;

  if(isCTRLDown){
    intersectionObject.object.remove(intersectionObject.object.children[1]);
    removeFromScene(intersectionObject.object.children[1]);
  }

  if(isShiftDown){
    intersectionObject.object.hex.biom = undefined;
    removeFromScene(intersectionObject.object)
  }
}

function removeFromScene(object){
  scene.remove( object );
  allObjects.splice( allObjects.indexOf( object ), 1 );
}

function onMouseKeyUp(e) {
  isClickDown = false;

  if(isCTRLDown) return;
  if(isShiftDown) return;
  if(!intersectionObject) return;

  if(intersectionMap && intersectionObject.object.tag == "Biom" && !intersectionMap.object.biom){

    let posBiom = intersectionMap.object.position;

    intersectionObject.object.hex = intersectionMap.object;
    intersectionMap.object.biom = intersectionObject.object;
    intersectionObject.object.position.set(posBiom.x, posBiom.y + 1.1, posBiom.z)
  }

  if(intersectionMap && intersectionMap.object.biom && !intersectionMap.object.biom.children[1] && intersectionObject.object.tag == "Build"){

    if(intersectionObject.object.biomName == intersectionMap.object.biom.biomName){
      intersectionObject.object.position.set(0, 0, 0.5)
      intersectionObject.object.rotateX(-90 * Math.PI / 180);
      intersectionMap.object.biom.add(intersectionObject.object)
    }
  }
}

function onDocumentKeyDown( event ) {

  switch ( event.keyCode ) {

    case 16: isShiftDown = true; break;
    case 17: isCTRLDown = true; break;
  }

}

function onDocumentKeyUp( event ) {

  switch ( event.keyCode ) {

    case 16: isShiftDown = false; break;
    case 17: isCTRLDown = false; break;
  }

}

// Render the scene
function render() {
    intersectionsMap();

    if(!isClickDown){
      intersectionObject = intersectionsObject();
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}