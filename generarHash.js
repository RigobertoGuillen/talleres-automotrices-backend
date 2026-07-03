const bcrypt = require('bcrypt');
bcrypt.hash('admin', 10, (err, hash) => {
    console.log("TU NUEVO HASH ES:", hash);
});