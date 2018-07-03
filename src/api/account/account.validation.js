const bcrypt = require('bcrypt');

const emailRegex = /\S+@\S+\.\S+/;
const passwordRegex = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%]).{6,20})/;

const validade_signup = usuario => {
  const errors = [];

  if (!usuario.email.match(emailRegex)) {
    errors.push(Object.assign({}, { message: 'O email informado está inválido' }));
  }
  if (!usuario.password.match(passwordRegex)) {
    errors.push(Object.assign({}, { message: 'A senha informada está inválida' }));
  }
  if (!bcrypt.compareSync(usuario.confirm_password, usuario.password_encripted)) {
    errors.push(Object.assign({}, { message: 'A senha e a senha de confirmação não conferem' }));
  }
  if (usuario.nome === '') {
    errors.push(Object.assign({}, { message: 'Informe o nome' }));
  }

  return errors;
};

module.exports = { validade_signup };