const { GraphQLError } = require('graphql')

function throwBadInput(message, invalidArgs, error) {
  throw new GraphQLError(message, {
    extensions: {
      code: 'BAD_USER_INPUT',
      invalidArgs,
      // incluir el error original ayuda en el frontend para depurar
      error
    }
  })
}

module.exports = { throwBadInput }
