const TokenRecuperacion = class TokenRecuperacion {
  constructor({
    id,
    email,
    token,
    expires_at,
    used,
    created_at
  } = {}) {
    this.id = id;
    this.email = email;
    this.token = token;
    this.expires_at = expires_at;
    this.used = used || false;
    this.created_at = created_at || new Date();
  }

  get esta_expirado() {
    return new Date() > this.expires_at;
  }

  get esta_usado() {
    return this.used === true;
  }

  get es_valido() {
    return !this.esta_expirado && !this.esta_usado;
  }

  marcarComoUsado() {
    this.used = true;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      token: this.token,
      expires_at: this.expires_at,
      used: this.used,
      created_at: this.created_at,
      es_valido: this.es_valido,
      esta_expirado: this.esta_expirado
    };
  }

  toDatabase() {
    return {
      id: this.id,
      email: this.email,
      token: this.token,
      expires_at: this.expires_at,
      used: this.used,
      created_at: this.created_at
    };
  }

  static fromDatabase(data) {
    return new TokenRecuperacion({
      id: data.id,
      email: data.email,
      token: data.token,
      expires_at: data.expires_at,
      used: data.used,
      created_at: data.created_at
    });
  }

  static forCreation(data) {
    return new TokenRecuperacion({
      email: data.email,
      token: data.token,
      expires_at: data.expires_at || new Date(Date.now() + 3600000),
      used: false
    });
  }
};

module.exports = TokenRecuperacion;