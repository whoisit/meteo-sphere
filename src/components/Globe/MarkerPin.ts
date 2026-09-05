import * as THREE from 'three';

export class MarkerPin {
  public group: THREE.Group;
  private ringMesh: THREE.Mesh;
  private coreMesh: THREE.Mesh;
  private beaconMesh: THREE.Mesh;
  private ringMaterial: THREE.MeshBasicMaterial;
  private coreMaterial: THREE.MeshBasicMaterial;
  private time = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // Glowing core point
    const coreGeo = new THREE.SphereGeometry(1.2, 16, 16);
    this.coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      depthTest: true,
    });
    this.coreMesh = new THREE.Mesh(coreGeo, this.coreMaterial);
    this.group.add(this.coreMesh);

    // Pulsing radar ripple ring
    const ringGeo = new THREE.RingGeometry(1.2, 3.5, 32);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, this.ringMaterial);
    this.group.add(this.ringMesh);

    // Vertical beacon beam
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.4, 8, 8);
    beamGeo.translate(0, 4, 0); // Origin at base
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.beaconMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beaconMesh.rotation.x = Math.PI / 2;
    this.group.add(this.beaconMesh);
  }

  public setPosition(lon: number, lat: number, radius = 100.8) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    this.group.position.set(x, y, z);

    // Orient marker normal to the sphere surface
    const normal = new THREE.Vector3(x, y, z).normalize();
    this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.group.visible = true;
  }

  public hide() {
    this.group.visible = false;
  }

  public update(deltaTime: number) {
    if (!this.group.visible) return;

    this.time += deltaTime * 3.5;
    const pulse = (Math.sin(this.time) + 1) * 0.5; // 0..1

    // Scale ring pulse
    const ringScale = 1.0 + pulse * 1.5;
    this.ringMesh.scale.set(ringScale, ringScale, 1);
    this.ringMaterial.opacity = 0.9 * (1.0 - pulse * 0.7);

    // Pulsing core light
    const coreScale = 0.9 + pulse * 0.3;
    this.coreMesh.scale.set(coreScale, coreScale, coreScale);
  }

  public dispose() {
    this.coreMesh.geometry.dispose();
    this.coreMaterial.dispose();
    this.ringMesh.geometry.dispose();
    this.ringMaterial.dispose();
    this.beaconMesh.geometry.dispose();
  }
}
