import { gql, useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'
import Select from 'react-select'

// Query para obtener todos los autores
const ALL_AUTHORS = gql`
  query {
    allAuthors {
      name
      born
      bookCount
    }
  }
`

// Mutación para editar el año de nacimiento de un autor
const EDIT_AUTHOR = gql`
  mutation EditAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
      bookCount
    }
  }
`

const Authors = (props) => {
  const { loading, error, data } = useQuery(ALL_AUTHORS)
  const [selectedOption, setSelectedOption] = useState(null)
  const [born, setBorn] = useState('')

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    onError: (error) => {
      console.error(error.graphQLErrors?.[0]?.message || error.message)
    }
  })

  if (!props.show) return null
  if (loading) return <p>Loading...</p>
  if (error) return <p>Error loading authors</p>

  const authors = data.allAuthors
  const options = authors.map((a) => ({ value: a.name, label: a.name }))

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedOption) return

    await editAuthor({
      variables: {
        name: selectedOption.value,
        setBornTo: Number(born)
      }
    })

    setSelectedOption(null)
    setBorn('')
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Born</th>
            <th>Books</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born ?? '—'}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Set birthyear</h3>
      <form onSubmit={submit}>
        <div>
          <Select
            value={selectedOption}
            onChange={setSelectedOption}
            options={options}
            placeholder="Select author"
          />
        </div>
        <div>
          born{' '}
          <input
            type="number"
            value={born}
            onChange={(e) => setBorn(e.target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  )
}

export default Authors
