import {Vector3, Euler} from 'three';
import {Component} from './Component';

import {NativeArguments} from './prototype/NativeArguments';
import {CompositionError} from './errors';

@NativeArguments(
  // Three.js Instances.
  ['position',   {copy: true}],
  ['rotation',   {copy: true}],
  ['quaternion', {copy: true}],
  ['target', {copy: true}]
)
class LightComponent extends Component {
  static defaults = {
    ...Component.defaults,

    build: true,

    light: {
      color: 0xffffff,
      skyColor: 0xffffff,
      groundColor: 0xffffff,

      intensity: 1,
      distance: 100,
      angle: Math.PI / 3,
      exponent: 0,
      decay: 1
    },

    shadow: {
      cast: true,

      bias: 0,
      radius: 1,

      mapSize: {
        width: 1024,
        height: 1024
      },

      camera: {
        near: true,
        far: 400,
        fov: 60,

        top: 200,
        bottom: -200,
        left: -200,
        right: 200
      }
    },

    position: {x: 0, y: 0, z: 0},
    rotation: {x: 0, y: 0, z: 0}
  };

  static instructions = {
    position: ['x', 'y', 'z'],
    rotation: ['x', 'y', 'z'],
    scale: ['x', 'y', 'z']
  };

  constructor(params, defaults = LightComponent.defaults, instructions = LightComponent.instructions) {
    super(params, defaults, instructions);

    if (this.params.build) {
      const build = this.build(this.params);

      if (!build) throw new CompositionError(
        'LightComponent',
        '.build() method should return a THREE.Object3D or a Promise resolved with THREE.Object3D.',
        this
      );

      if (build instanceof Promise) build.then((native) => {this.native = native});
      else this.native = build;

      this.wrap();
    }
  }

  build() {
    throw new CompositionError(
      'MeshComponent',
      'Instance should have it\'s own .build().',
      this
    );
  }

  wrap() {
    return new Promise(resolve => {
      this.defer(() => {
        this.position.set(this.params.position.x, this.params.position.y, this.params.position.z);
        this.rotation.set(this.params.rotation.x, this.params.rotation.y, this.params.rotation.z);

        resolve(this);
      });
    });
  }

  wrapShadow() {
    const {native, params: {shadow}} = this;

    native.castShadow = shadow.cast;
    native.shadow.mapSize.width = shadow.mapSize.width;
    native.shadow.mapSize.height = shadow.mapSize.height;
    native.shadow.bias = shadow.bias;
    native.shadow.radius = shadow.radius;

    const shadowCamera = native.shadow.camera;

    shadowCamera.near = shadow.near;
    shadowCamera.far = shadow.far;
    shadowCamera.fov = shadow.fov;

    shadowCamera.left = shadow.left;
    shadowCamera.right = shadow.right;
    shadowCamera.top = shadow.top;
    shadowCamera.bottom = shadow.bottom;
  }

  copy(source) {
    if (source.native) {
      this.native = source.native.clone();
      this.params = {...source.params};
      this.modules = source.modules.slice(0);

      if (this.target) this.target.copy(source.target());

      this.position.copy(source.position);
      this.rotation.copy(source.rotation);
      this.quaternion.copy(source.quaternion);
    } else this.params = source.params;

    return this;
  }

  clone() {
    return new this.constructor({build: false}).copy(this);
  }

  addTo(object) {
    return object.add(this);
  }
}

export {
  LightComponent
};