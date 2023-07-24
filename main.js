import './style.css'

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//import Gun from 'gun';

const GRID = {
  'width': 20, 
  'height': 20
};

//const gun = Gun(['http://localhost:5173/gun', 'http://192.168.180.113:5173/gun'])
//var objects = gun.get('objects')

// HUD
document.querySelector('body').innerHTML = `
  <div id="search-bar-holder">
    <div class='search-bar'>
      <div id="search-bar-helper"></div>
      <input id="command" type="text" placeholder="how can I help you?"/>
      <div><img class="search-icon" src="search.svg" /></div>
    </div>
  </div>
`
// objects.on((data) => {
//   let command = document.querySelector('#command')
//   console.log(data)
// })

if (WebGL.isWebGLAvailable()) 
{
  // CAMERA
  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(-13, 12, 25);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  
  // RENDERER
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // WINDOW RESIZE HANDLER
  window.addEventListener( 'resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, false);
  
  // SCENE
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);
  
  // CONTROLS
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();
  
  // AMBIENT LIGHT
  const light = new THREE.AmbientLight(0xffffffff, 0.2);
  scene.add(light);
  
  // DIRECTIONAL LIGHT
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(0, 0, 10);
  scene.add(directionalLight);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -70;
  directionalLight.shadow.camera.right = 70;
  directionalLight.shadow.camera.top = 70;
  directionalLight.shadow.camera.bottom = -70;

  // AXIS
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  
  // FLOOR
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(GRID.width, GRID.height), 
    new THREE.MeshBasicMaterial(
      {
        color: 0xC0C0C0, 
        side: THREE.DoubleSide,
        visible: false
      }
    )
  );
  plane.rotateX(-Math.PI/2)
  plane.name = 'ground'
  scene.add(plane)

  const grid = new THREE.GridHelper(GRID.width, GRID.height)
  scene.add(grid)

  const highlightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1), 
    new THREE.MeshBasicMaterial(
      {
        color: 0xc0c0c0, 
        side: THREE.DoubleSide,
        visible: true
      }
    )
  );
  highlightMesh.rotateX(-Math.PI/2)
  highlightMesh.position.set(0.5, 0, 0.5)
  scene.add(highlightMesh)

  const mousePosition = new THREE.Vector2()
  const raycaster = new THREE.Raycaster();
  let intersects = undefined
  let commandName = undefined
  
  window.addEventListener('mousemove', (e) => {
    if (commandName)
    {
      mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mousePosition, camera)
      intersects = raycaster.intersectObjects(scene.children)
      intersects.forEach((intersect) => {
        if (intersect.object.name === 'ground') 
        {
          const highlightPosition = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5)
          highlightMesh.position.set(highlightPosition.x, 0, highlightPosition.z)
        }
      })
    }
  })
  
  function addCube(x, y, z) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x282828 }))
    cube.position.set(x, y, z)
    cube.name = 'cube'
    scene.add(cube)
  }
  
  function addSphere(x, y, z) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5), 
      new THREE.MeshStandardMaterial({ color: 0xFFFF00}))
    sphere.position.set(x, y, z)
    sphere.name = 'sphere'
    scene.add(sphere)
  }

  window.addEventListener('mousedown', (e) => {
    if (commandName)
    {
      let command = document.querySelector('#command')
      intersects.forEach((intersect) => {
        switch (intersect.object.name) 
        {
          case 'ground':
            switch(commandName)
            {
              case "cube":
                addCube(highlightMesh.position.x, 0.5, highlightMesh.position.z)
                // objects.set(command.value)
                command.value = ""
                break
              case "sphere":
                addSphere(highlightMesh.position.x, 0.5, highlightMesh.position.z)
                command.value = ""
                break
              default:
                alert(`unknown command (${command.value})`)
                break
            }
            commandName = undefined
            break
          default:
            if (commandName == "delete")
            {
              scene.clear()
            }
        }
      })
    }
  })


  function runCommand(command) {
    switch(command.value)
    {
      case "cube":
        addCube(0.5, 0.5, 0.5)
        command.value = ""
        
        break
      case "sphere":
        addSphere()
        command.value = ""
        break
      case "clear":
        // scene.clear()
        scene.children.forEach((childen, index) => {
          if (childen.name !== 'ground')
          {
            var meshToBeDeleted = scene.children.at(index);
            scene.remove(meshToBeDeleted);
            meshToBeDeleted.geometry.dispose();
            meshToBeDeleted.material.dispose();
            meshToBeDeleted = undefined;
          }
        })
        command.value = ""
        break
      default:
        alert(`unknown command (${command.value})`)
        break
    }
  }


  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  let activeTime = 0;
  let fading = false;
  var opacity = 0.1;


  function fadeIn(element) {
    if (!fading)
    {
      fading = true
      var timer = setInterval(function () {
        element.style.opacity = opacity;
        element.style.filter = 'alpha(opacity=' + opacity * 100 + ")";
        opacity -= opacity * 0.1;
        if (opacity <= 0.3) {
            clearInterval(timer);
            fading = false
        }
      }, 25);
    }
  }

  function fadeOut(element) {
    if (!fading)
    {
      fading = true
      var timer = setInterval(function () {
        element.style.opacity = opacity;
        element.style.filter = 'alpha(opacity=' + opacity * 100 + ")";
        opacity += opacity * 0.1;
        if (opacity >= 0.9){
            clearInterval(timer);
            fading = false
        }
      }, 25);
    }
  }

  window.addEventListener('keydown', (e) => {
    let sb = document.querySelector('#search-bar-holder')
    let command = document.querySelector('#command')
    let key = e.key
    let code = e.code

    switch(key)
    {
    //   case "Backspace":
    //   case "Delete":
    //     command.value = command.value.slice(0, -1)
    //     break
      case "Enter":
        //runCommand(command)
        commandName = command.value
        break
    //   case "Alt":
    //   case "Control":
    //     break
    //   default:
    //     command.value += key
    //     break
    }
    command.focus()
    fadeOut(sb);
    setTimeout(() => {
        fadeIn(sb)
    }, 10000)
  })
}