import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { WireframeGeometry2 } from 'three/addons/lines/WireframeGeometry2.js';
import { Wireframe } from 'three/addons/lines/Wireframe.js';

class NightSky {
    constructor() {
        this.lineMaterial = null; 
        this.container = document.querySelector('.full-height');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.spheres = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.cameraDistance = 6;
        this.init();
    }

    init() {
        // レンダラーの設定
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 1);
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

        // カメラの初期位置と角度の設定
        this.updateCameraPosition();

        // ワイヤーフレームの正二十面体を3つ作成
        this.createWireframeSpheres();

        // マウスイベントの設定
        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX - window.innerWidth / 2) / 10000;
            this.mouseY = (event.clientY - window.innerHeight / 2) / 10000;
        });

        // アニメーション開始
        this.animate();

        // リサイズイベントの設定
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    updateCameraPosition() {
        const phi = Math.PI / 4 + this.targetRotationY;
        const theta = Math.PI / 6 + this.targetRotationX;

        this.camera.position.x = this.cameraDistance * Math.sin(theta) * Math.cos(phi);
        this.camera.position.y = this.cameraDistance * Math.cos(theta);
        this.camera.position.z = this.cameraDistance * Math.sin(theta) * Math.sin(phi);

        this.camera.lookAt(0, 0, 0);
    }

    createWireframeSpheres() {
        // 正二十面体のジオメトリを作成
        const geometry = new THREE.IcosahedronGeometry(2.5, 1);
        
        // ワイヤーフレームのマテリアルを作成
        this.lineMaterial = new LineMaterial({ // Note: 'this.' prefix
            color: 0xffffff,
            linewidth: 4, // in pixels
            // transparent: true, // LineMaterial might handle transparency differently or by default
            // opacity: 0.8 // Opacity is part of the color in LineMaterial (e.g. using hex with alpha or .opacity property)
        });
        this.lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

        // 3つの正二十面体を作成（カメラにより近い位置に配置）
        const positions = [
            { x: 5, y: -10, z: -3 },     // 中央
            { x: 3, y: -12, z: -7 },     // 左
            { x: 7, y: -10, z: -7 }      // 右
        ];

        positions.forEach((pos, index) => {
            const wireframeGeometry = new WireframeGeometry2(geometry); // Use the existing 'geometry'
            const wireframeMesh = new Wireframe(wireframeGeometry, this.lineMaterial);
            wireframeMesh.computeLineDistances();
            wireframeMesh.position.set(pos.x, pos.y, pos.z);
            // 各正二十面体に異なる回転速度を設定
            wireframeMesh.userData = {
                rotationSpeed: {
                    x: 0.002 * (index + 1),
                    y: 0.003 * (index + 1),
                    z: 0.001 * (index + 1)
                }
            };
            this.spheres.push(wireframeMesh);
            this.scene.add(wireframeMesh);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 正二十面体の回転
        this.spheres.forEach(sphere => {
            const { rotationSpeed } = sphere.userData;
            sphere.rotation.x += rotationSpeed.x;
            sphere.rotation.y += rotationSpeed.y;
            sphere.rotation.z += rotationSpeed.z;
        });

        // カメラの回転を滑らかに追従
        this.targetRotationX = this.mouseY * 0.5;
        this.targetRotationY = this.mouseX * 0.5;
        this.updateCameraPosition();

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.lineMaterial) { // Add a check to ensure lineMaterial is initialized
            this.lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
        }
    }
}

// ページ読み込み完了時にアニメーションを開始
document.addEventListener('DOMContentLoaded', () => {
    new NightSky();
}); 