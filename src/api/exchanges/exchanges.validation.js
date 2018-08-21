const validarDados = (dados) => {
  if (!dados.id_usuario) {
    throw new Error('id_usuario inválido')
  }
}

const validarRequisitosExchange = (dados) => {
  if (!dados) {
    throw new Error('Usuário não encontrado')
  }
}

module.exports = {
  validarDados,
  validarRequisitosExchange
}
