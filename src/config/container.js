
class Container {
  constructor() {
    this.dependencies = new Map();
  }

  register(name, dependency) {
    this.dependencies.set(name, dependency);
    return this;
  }

  resolve(name) 
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependencia '${name}' no registrada`);
    }
    return dependency;
  
  registerFactory(name, factory) {
    this.dependencies.set(name, factory);
    return this;
  }

  resolveFactory(name, ...args) {
    const factory = this.dependencies.get(name);
    if (!factory) {
      throw new Error(`Fábrica '${name}' no registrada`);
    }
    return factory(...args);
  }
}

// Instancia única (Singleton)
const container = new Container();

module.exports = { container };