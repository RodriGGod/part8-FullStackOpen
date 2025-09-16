const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')
const { throwBadInput } = require('./utils/errors') // si usas el helper
const Author = require('./models/author')
const Book   = require('./models/book')
const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
require('dotenv').config()


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library'
mongoose.connect(MONGODB_URI)
    .then(() => console.log('connected to MongoDB'))
    .catch(err => console.error('Mongo error:', err))

let authors = [
    {
        name: 'Robert Martin',
        id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
        born: 1952,
    },
    {
        name: 'Martin Fowler',
        id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
        born: 1963
    },
    {
        name: 'Fyodor Dostoevsky',
        id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
        born: 1821
    },
    {
        name: 'Joshua Kerievsky', // birthyear not known
        id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
    },
    {
        name: 'Sandi Metz', // birthyear not known
        id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
    },
]

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 *
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conexión con el libro
*/

let books = [
    {
        title: 'Clean Code',
        published: 2008,
        author: 'Robert Martin',
        id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Agile software development',
        published: 2002,
        author: 'Robert Martin',
        id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
        genres: ['agile', 'patterns', 'design']
    },
    {
        title: 'Refactoring, edition 2',
        published: 2018,
        author: 'Martin Fowler',
        id: "afa5de00-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    },
    {
        title: 'Refactoring to patterns',
        published: 2008,
        author: 'Joshua Kerievsky',
        id: "afa5de01-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'patterns']
    },
    {
        title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
        published: 2012,
        author: 'Sandi Metz',
        id: "afa5de02-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'design']
    },
    {
        title: 'Crime and punishment',
        published: 1866,
        author: 'Fyodor Dostoevsky',
        id: "afa5de03-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'crime']
    },
    {
        title: 'Demons',
        published: 1872,
        author: 'Fyodor Dostoevsky',
        id: "afa5de04-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'revolution']
    },
]

/*
  you can remove the placeholder query once your first one has been implemented 
*/

const typeDefs = `
    type Query {
        me: User
        bookCount: Int!
        authorCount: Int!
        allBooks(author: String, genre: String): [Book!]!
        allAuthors: [Author!]!
    }
    type User {
        username: String!
        favoriteGenre: String!
    }
    type Mutation {
        addBook(
            title: String!
            author: String!
            published: Int!
            genres: [String!]!
        ): Book
        editAuthor(
            name: String!
            setBornTo: Int!
        ): Author
    }


    type Book {
        title: String!
        published: Int!
        author: Author!  
        genres: [String!]!
    }
    type Author {
        name: String!
        born: Int
        bookCount: Int
    }
`

const user = {
    username: 'admin',
    favoriteGenre: 'refactoring'
}


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
        me: (root, args, context) => context.currentUser
    },

    // Resolver de campo para calcular bookCount por autor
    Author: {
        bookCount: async (root) => Book.countDocuments({ author: root._id })
    },

    Mutation: {
        addBook: async (root, args) => {
            // 1) autor: crear o recuperar
            let author = await Author.findOne({ name: args.author })
            if (!author) {
                author = new Author({ name: args.author })
                try {
                    await author.save()
                } catch (error) {
                    // aquí saltan minlength/unique del autor
                    throwBadInput('Creating author failed', { name: args.author }, error)
                }
            }

            // 2) libro
            const book = new Book({
                title: args.title,
                published: args.published,
                genres: args.genres,
                author: author._id,
            })

            try {
                const saved = await book.save() // aquí saltan minlength/unique del título, géneros vacíos, etc.
                return saved.populate('author')
            } catch (error) {
                throwBadInput('Creating book failed', { title: args.title }, error)
            }
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
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
})

const User = { username: 'admin', favoriteGenre: 'refactoring' }

startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => ({ currentUser: User })
}).then(({ url }) => {
    console.log(`Server ready at ${url}`)
})