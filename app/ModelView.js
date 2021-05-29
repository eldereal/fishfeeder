import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer, TextureLoader } from 'expo-three';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import {
  AmbientLight,
  BoxBufferGeometry,
  Fog,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneBufferGeometry,
  PointLight,
  Scene,
  SpotLight,
  Vector3,
  PCFSoftShadowMap,
  Group,
  DirectionalLight,
  SphereBufferGeometry,
  Color,
  Quaternion,
  Matrix4,
  BufferGeometry
} from 'three';
import { GLTFLoader } from './GLTFLoader';
import { useCoEffect } from './useCo';

/** @type {ExpoWebGLRenderingContext} */
const nullGl = null;

function load(json) {
    return new Promise((fulfill, reject) => {
        const loader = new GLTFLoader();
        loader.parse(json, "", r => {
            fulfill(r.scene.children[0].geometry);
        }, reject);
    });
}

/** @type {BufferGeometry[]} */
const nullGeoms = [];

export default function ModelView({ redLightOn = false, blueLightOn = false, angle = 70, distance = 150, rodAngle = 0 }) {
    const [gl, setGl] = useState(nullGl);
    const [geom, setGeom] = useState(nullGeoms);
    const [setters, setSetters] = useState();
    useEffect(() => {
        if (!setters) return;
        setters.enableRedLight(redLightOn);
    }, [setters, redLightOn]);

    useEffect(() => {
        if (!setters) return;
        setters.enableBlueLight(blueLightOn);
    }, [setters, blueLightOn]);

    useEffect(() => {
        if (!setters) return;
        setters.setCamera(angle, distance);
    }, [setters, angle, distance]);

    useEffect(() => {
        if (!setters) return;
        setters.setRodAngle(rodAngle);
    }, [setters, rodAngle]);

    useCoEffect(function*(){
        try {
            const [
                transparent,
                black,
                grey,
                silver,
                green,
                white,
                gold,
                redlit,
                bluelit,
            ] = yield Promise.all([
                load(require('./model/transparent.gltf.json')),
                load(require('./model/black.gltf.json')),
                load(require('./model/grey.gltf.json')),
                load(require('./model/silver.gltf.json')),
                load(require('./model/green.gltf.json')),
                load(require('./model/white.gltf.json')),
                load(require('./model/gold.gltf.json')),
                load(require('./model/redlit.gltf.json')),
                load(require('./model/bluelit.gltf.json')),
            ]);
            setGeom([
                transparent,
                black,
                grey,
                silver,
                green,
                white,
                gold,
                redlit,
                bluelit
            ]);
        } catch (e) {
            console.error("model load error", e.stack);
        }
    }, []);

    useEffect(() => {
        if (!gl || !geom) return;
        
        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
        const sceneColor = 0xFDF6E3;

        // @ts-ignore
        const renderer = new Renderer({ gl });
        renderer.setSize(width, height);
        renderer.setClearColor(sceneColor);
        renderer.sortObjects = false;
        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = PCFSoftShadowMap;

        const camera = new PerspectiveCamera(50, width / height, 0.01, 1000);
        // camera.setViewOffset(
        //     width * 1.25,
        //     height * 2,
        //     0,
        //     height * 0.75,
        //     width, 
        //     height
        // );
        // camera.position.set(0, 200, 50);
        // camera.up = new Vector3(0,0,1);
        // camera.lookAt(0,0,0);

        const scene = new Scene();
        scene.fog = new Fog(sceneColor, 1, 10000);
        
        const ambientLight = new AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        // const pointLight = new PointLight(0xffffff, 1, 1000, 1);
        // pointLight.position.set(0, 200, 200);
        // scene.add(pointLight);

        const light = new PointLight(0xffffff, 1);
        light.position.set(200, 200, 50);
        // light.lookAt(0, 0, 0);
        // spotLight.castShadow = true;
        scene.add(light);

        const light2 = new DirectionalLight(0xffffff, 1);
        light2.position.set(0, 500, 500);
        light2.lookAt(0, 0, 0);
        // spotLight.castShadow = true;
        scene.add(light2);
        // spotLight.shadow.mapSize.width = 512; // default
        // spotLight.shadow.mapSize.height = 512; // default
        // spotLight.shadow.camera.near = 0.5; // default
        // spotLight.shadow.camera.far = 2000; // default
        // spotLight.shadow.focus = 1; // default
        const g = new Group();
        const [
            transparent,
            black,
            grey,
            silver,
            green,
            white,
            gold,
            redlit,
            bluelit
        ] = geom;

        const main = new Mesh(
            transparent,
            new MeshStandardMaterial({
                transparent: true,
                depthTest: true,
                depthWrite: true,
                opacity: 0.5,
                color: 0x666666,
                emissive: 0x222222,
                roughness: 1,
                metalness: 0.3
                // map: new TextureLoader().load(require('./icon.jpg')),
                // color: 0xff0000
            })
        );
        g.add(main);
        g.add(new Mesh(
            black,
            new MeshStandardMaterial({
                color: 0x111111,
                roughness: 0.5,
                metalness: 0.5
            })
        ));
        g.add(new Mesh(
            silver,
            new MeshStandardMaterial({
                color: 0xaaaaaa,
                roughness: 0.5,
                metalness: 1
            })
        ));
        g.add(new Mesh(
            grey,
            new MeshStandardMaterial({
                color: 0x555555,
                roughness: 0.7,
                metalness: 0
            })
        ));
        g.add(new Mesh(
            green,
            new MeshStandardMaterial({
                color: 0x003300,
                roughness: 0.7,
                metalness: 0
            })
        ));
        g.add(new Mesh(
            white,
            new MeshStandardMaterial({
                color: 0x999999,
                roughness: 0.5,
                metalness: 0.2
            })
        ));
        
        const redlitMesh = new Mesh(
            redlit,
            new MeshStandardMaterial({
                color: 0x660000,
                roughness: 0.7,
                metalness: 0.1
            })
        );
        g.add(redlitMesh);
        
        const bluelitMesh = new Mesh(
            bluelit,
            new MeshStandardMaterial({
                color: 0x3333ff,
                roughness: 0.7,
                metalness: 0.1
            })
        );
        g.add(bluelitMesh);


        const goldMesh = new Mesh(
            gold,
            new MeshStandardMaterial({
                color: 0x664400,
                roughness: 0.7,
                metalness: 0.1
            })
        );
        g.add(goldMesh);

        const lightred = new PointLight(0xff0000, 3);
        lightred.position.set(60,-3,-12);
        g.add(lightred);

        const lightblue = new PointLight(0x0000ff, 3);
        lightblue.position.set(65,-5,-52);
        g.add(lightblue);

        const offsetX = -30;
        const offsetY = 0;
        const offsetZ = 40;

        g.position.set(offsetX, offsetY, offsetZ);
        scene.add(g);

        
        let timeout;

        function enableRedLight(enable) {
            if (enable) {
                redlitMesh.material.color = new Color(0x660000);
                lightred.intensity = 3;
            } else {
                redlitMesh.material.color = new Color(0x999999);
                lightred.intensity = 0;
            }
            if (!timeout) {
                timeout = requestAnimationFrame(render);
            }
        }
        enableRedLight(redLightOn);
        function enableBlueLight(enable){
            if (enable) {
                bluelitMesh.material.color = new Color(0x0000ff);
                lightblue.intensity = 3;
            } else {
                bluelitMesh.material.color = new Color(0x333333);
                lightblue.intensity = 0;
            }
            if (!timeout) {
                timeout = requestAnimationFrame(render);
            }
        }
        enableBlueLight(blueLightOn);

        function setCamera(angle, dist) {
            const pos = new Vector3(
                Math.sin(angle * Math.PI / 180) * dist, 
                Math.cos(angle * Math.PI / 180) * dist, 
                0
            );
            camera.position.set(pos.x, pos.y, pos.z);
            camera.up = new Vector3(0,0,1);
            camera.lookAt(0,0,0);
            light.position.set(pos.x, pos.y, pos.z);
            if (!timeout) {
                timeout = requestAnimationFrame(render);
            }
        }
        setCamera(angle, distance);
        let actualAngle = angle;
        let actualDistance = distance;
        let startAngle;
        let targetAngle;
        let startDistance;
        let targetDistance;
        let cameraStartTime;
        let cameraDuration;

        function setCameraAnim(a, d, duration=500) {
            startAngle = actualAngle;
            targetAngle = a;
            startDistance = actualDistance;
            targetDistance = d;
            cameraStartTime = Date.now();
            cameraDuration = duration;
            if (!timeout) {
                timeout = requestAnimationFrame(render);
            }
        }

        goldMesh.matrixAutoUpdate = false;
        function setRodRot(rot) {
            const m = new Matrix4().makeTranslation(0,0,-29).multiply(
                new Matrix4().makeRotationX(- rot / 180 * Math.PI)
                    .multiply(new Matrix4().makeTranslation(0,0,29))
            )
            goldMesh.matrix = m;
            if (!timeout) {
                timeout = requestAnimationFrame(render);
            }
        }

        setRodRot(rodAngle);

        let actualRodAngle = rodAngle;
        let startRodAngle;
        let targetRodAngle;
        let rodStartTime;
        let rodDuration; 

        function setRodAngleAnim(a, speed = 180/* degree per second */) {
            startRodAngle = actualRodAngle;
            targetRodAngle = a;
            rodStartTime = Date.now();
            rodDuration = (targetRodAngle - startRodAngle) / speed * 1000;
            if (!timeout) {
                timeout = requestAnimationFrame(render);
            }
        }

        setSetters({
            enableRedLight,
            enableBlueLight,
            setCamera: setCameraAnim,
            setRodAngle: setRodAngleAnim
        });

        function ease(t, b, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
        }
        function updateCamera(t) {
            if (t < cameraStartTime) {
                return;
            } else if (t < cameraStartTime + cameraDuration) {
                const a = ease(t - cameraStartTime, startAngle, targetAngle - startAngle, cameraDuration);
                const d = ease(t - cameraStartTime, startDistance, targetDistance - startDistance, cameraDuration);
                actualAngle = a;
                actualDistance = d;
                setCamera(a, d);
            } else if (actualAngle !== targetAngle) {
                actualAngle = targetAngle;
                actualDistance = targetDistance;
                setCamera(targetAngle, targetDistance);
            }
        }

        function updateRodAngle(t) {
            const prog = (t - rodStartTime) / rodDuration;
            if (prog < 0) {
                return;
            } else if (prog < 1) {
                const a = (targetRodAngle - startRodAngle) * prog + startRodAngle;
                actualRodAngle = a;
                setRodRot(a);
            } else if(actualRodAngle !== targetRodAngle) {
                actualRodAngle = targetRodAngle;
                setRodRot(targetRodAngle);
            }
        } 

        function render() {
            timeout = null;
            const t = Date.now();
            updateCamera(t);
            updateRodAngle(t);
            renderer.render(scene, camera);
            gl.endFrameEXP();
        };
        // render();
        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [gl, geom]);

    const onContextCreate = (/** @type {ExpoWebGLRenderingContext} */gl) => {
        setGl(gl);
    };
    
    return <GLView style={{ flex: 1, backgroundColor: '#f5f5e0' }} onContextCreate={onContextCreate} />;
}
