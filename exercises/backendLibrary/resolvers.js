const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { throwBadInput } = require('./utils/errors') // si usas el helper


const resolvers = {
    Query: {
        bookCount: async () => Book.collection.countDocuments(),
        authorCount: async () => Author.collection.countDocuments(),

        // allBooks con filtro por genre (el truco: usar $in)
        allBooks: async (root, args) => {
            const q = {}
            if (args.genre) q.genres = { $in: [args.genre] }
            // el filtro por author NO es necesario ahora (se pide que no)
            return Book.find(q).populate('author')
        },

        // Devolver todos los autores; bookCount se calcula abajo en el field resolver
        allAuthors: async () => {
            return Author.find({})
        },

        // Puedes dejar tu "me" tal cual con el usuario fake en context
        me: (root, args, { currentUser }) => currentUser
    },

    // Resolver de campo para calcular bookCount por autor
    Author: {
        bookCount: async (root) => Book.countDocuments({ author: root._id })
    },

    Mutation: {
        addBook: async (root, args, context) => {
            const currentUser = context.currentUser
            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }

            let author = await Author.findOne({ name: args.author })
            if (!author) {
                author = new Author({ name: args.author })
                await author.save()
            }

            const book = new Book({ ...args, author: author._id })

            try {
                await book.save()
            } catch (error) {
                throw new UserInputError(error.message, { invalidArgs: args })
            }

            // popular el autor para que GraphQL devuelva datos completos
            const populatedBook = await book.populate('author')

            pubsub.publish('BOOK_ADDED', { bookAdded: populatedBook })
            return populatedBook
        },

        editAuthor: async (root, { name, setBornTo }) => {
            const author = await Author.findOne({ name })
            if (!author) return null

            author.born = setBornTo
            try {
                return await author.save() // podría fallar si cambias también 'name' en otra versión
            } catch (error) {
                throwBadInput('Updating author failed', { name }, error)
            }
        },
        createUser: async (root, args) => {
            const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
            try {
                return await user.save()
            } catch (error) {
                throw new GraphQLError('Creating the user failed', {
                    extensions: { code: 'BAD_USER_INPUT', invalidArgs: { username: args.username }, error }
                })
            }
        },

        login: async (root, { username, password }) => {
            const user = await User.findOne({ username })
            // password fija del curso
            if (!user || password !== 'secret') {
                throw new GraphQLError('wrong credentials', {
                    extensions: { code: 'BAD_USER_INPUT' }
                })
            }
            const payload = { username: user.username, id: user._id }
            const value = jwt.sign(payload, process.env.JWT_SECRET)
            return { value }
        }
    },
    Subscription: {
        bookAdded: {
            subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
        }
    }
}

module.exports = resolvers