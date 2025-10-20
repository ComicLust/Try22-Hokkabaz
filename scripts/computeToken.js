const crypto = require('crypto');
const token = crypto.createHash('sha256').update('admin:admin123:pN7$gX2!hQ9zRw4@Lm6^sV0bT8&yK3uF5eZ1').digest('hex');
console.log(token);