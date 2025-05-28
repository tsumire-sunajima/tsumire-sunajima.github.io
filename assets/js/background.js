import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { WireframeGeometry2 } from 'three/addons/lines/WireframeGeometry2.js';
import { Wireframe } from 'three/addons/lines/Wireframe.js';

class NightSky {
    constructor() {
        this.container = document.querySelector('.full-height');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.spheres = [];
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.cameraDistance = 6;
        this.init();
    }

    init() {
        // レンダラーの設定
        this.updateRendererSize();
        this.renderer.setClearColor(0x000000, 1);
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

        // カメラの初期位置と角度の設定
        this.updateCameraPosition();

        // ワイヤーフレームの正二十面体を3つ作成
        this.createWireframeSpheres();

        // パーティクルの作成
        this.createParticles();

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

    updateRendererSize() {
        const sideNavWidth = 190;
        const isLargeScreen = window.innerWidth > 992;
        const width = isLargeScreen ? window.innerWidth - sideNavWidth : window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
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
        const geometry = new THREE.IcosahedronGeometry(2.5, 1);
        
        this.lineMaterial = new LineMaterial({
            color: 0xffffff,
            linewidth: 4,
        });
        this.lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

        const positions = [
            { x: 5, y: -10, z: -3 },     // 中央
            { x: 3, y: -12, z: -7 },     // 左
            { x: 7, y: -10, z: -7 }      // 右
        ];

        positions.forEach((pos, index) => {
            const wireframeGeometry = new WireframeGeometry2(geometry);
            const wireframeMesh = new Wireframe(wireframeGeometry, this.lineMaterial);
            wireframeMesh.computeLineDistances();
            wireframeMesh.position.set(pos.x, pos.y, pos.z);
            wireframeMesh.userData = {
                rotationSpeed: {
                    x: 0.002 * (index + 1),
                    y: 0.003 * (index + 1),
                    z: 0.001 * (index + 1)
                },
                originalPosition: { ...pos }
            };
            this.spheres.push(wireframeMesh);
            this.scene.add(wireframeMesh);
        });
    }

    createParticles() {
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = 0;
            particlePositions[i3 + 1] = 0;
            particlePositions[i3 + 2] = 0;

            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        this.spheres.forEach((sphere, index) => {
            const particles = new THREE.Points(particleGeometry.clone(), particleMaterial);
            particles.position.copy(sphere.position);
            particles.userData = {
                velocities: particleVelocities.map(v => ({ ...v })),
                originalPosition: { ...sphere.userData.originalPosition }
            };
            this.particles.push(particles);
            this.scene.add(particles);
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

        // パーティクルの更新
        this.particles.forEach(particles => {
            const positions = particles.geometry.attributes.position.array;
            const velocities = particles.userData.velocities;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i/3].x;
                positions[i + 1] += velocities[i/3].y;
                positions[i + 2] += velocities[i/3].z;

                // パーティクルが一定距離以上離れたら元の位置に戻す
                const distance = Math.sqrt(
                    positions[i] * positions[i] +
                    positions[i + 1] * positions[i + 1] +
                    positions[i + 2] * positions[i + 2]
                );

                if (distance > 5) {
                    positions[i] = 0;
                    positions[i + 1] = 0;
                    positions[i + 2] = 0;
                    velocities[i/3] = {
                        x: (Math.random() - 0.5) * 0.1,
                        y: (Math.random() - 0.5) * 0.1,
                        z: (Math.random() - 0.5) * 0.1
                    };
                }
            }

            particles.geometry.attributes.position.needsUpdate = true;
        });

        // カメラの回転を滑らかに追従
        this.targetRotationX = this.mouseY * 0.5;
        this.targetRotationY = this.mouseX * 0.5;
        this.updateCameraPosition();

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.updateRendererSize();
        if (this.lineMaterial) {
            this.lineMaterial.resolution.set(window.innerWidth, window.innerHeight);
        }
    }
}

// ページ読み込み完了時にアニメーションを開始
document.addEventListener('DOMContentLoaded', () => {
    new NightSky();
}); 