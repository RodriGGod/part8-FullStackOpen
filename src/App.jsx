import { useState, useEffect } from 'react'
import axios from 'axios'
import personService from './services/persons'

const Notification = ({ message }) => {
  const Style = {
    color: 'green',
    fontStyle: 'italic',
    fontSize: 16
  }

  if (message === null) {
    return null
  }

  return (
    <div className='error' style={Style}>
      {message}
    </div>
  )
}

const Filter = ({ searchPerson, handleSearchChange }) => {
  return (
    <div>
      Search: <input value={searchPerson} onChange={handleSearchChange} />
    </div>
  );
}

const Person = ({ person, action }) => {
  return (
    <li key={`${person.name}-${person.number}`}>
      {person.name}
      &nbsp;
      {person.number}
      <button onClick={action}>delete</button>
    </li>
  )
}

const PersonForm = ({ addPerson, newName, handleNameChange, newNumber, handleNumberChange }) => {
  return (
    <form onSubmit={addPerson}>
      <div>
        name: <input value={newName} onChange={handleNameChange} />
      </div>
      <div>
        number: <input value={newNumber} onChange={handleNumberChange} />
      </div>
      <div>
        <button type="submit">add</button>
      </div>
    </form>
  )
}



const App = () => {
  const [persons, setPersons] = useState([])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [searchPerson, setSearchPerson] = useState('')
  const [filteredPersons, setFilteredPersons] = useState([])
  const [Message, setMessage] = useState(null)



  const handleNameChange = (event) => {
    console.log(event.target.value)
    setNewName(event.target.value)
  }
  const handleNumberChange = (event) => {
    console.log(event.target.value)
    setNewNumber(event.target.value)
  }
  const handleSearchChange = (event) => {
    const searchValue = event.target.value;
    console.log(searchValue);
    setSearchPerson(searchValue);

    if (Array.isArray(persons)) {
      const filterItems = persons.filter(person =>
        person.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredPersons(filterItems);
    } else {
      setFilteredPersons([]); // Si `persons` no es un array, evita errores
    }
  };

  const hook = () => {
    console.log('effect')
    personService
      .getAll()
      .then((initialPersons) => {
        console.log('promise fulfilled')
        setPersons(initialPersons)
        setFilteredPersons(initialPersons)
      })
      .catch((error) => {
        console.log('promise rejected', error)
      });
  }
  useEffect(hook, [])
  console.log('render', persons.length, 'persons')

  const addPerson = (event) => {
    event.preventDefault()
    console.log('button clicked', event.target)

    const nameExists = Array.isArray(persons) && persons.some(person => person.name === newName)

    if (nameExists) {
      alert(`${newName} is already added to phonebook`)
      const confirmChange = window.confirm(`Do you want to update the number for ${newName}?`)

      if (confirmChange) {
        const person = persons.find(person => person.name === newName)
        const changedPerson = { ...person, number: newNumber }

        personService
          .update(person.id, changedPerson)
          .then(returnedPerson => {
            setPersons(persons.map(person => person.id !== returnedPerson.id ? person : returnedPerson))
            setFilteredPersons(filteredPersons.map(person => person.id !== returnedPerson.id ? person : returnedPerson))
            setNewName('')
            setNewNumber('')
          });
      }
      return

    } else {

      const personObject = {
        name: newName,
        number: newNumber,
        /* id: (persons.length + 1).toString(), */
      }

      personService
        .create(personObject)
        .then((returnedPerson) => {
          console.log(returnedPerson)
          setPersons(persons.concat(returnedPerson))
          setFilteredPersons(filteredPersons.concat(returnedPerson))
          setMessage(
            `Person '${returnedPerson.name}' was added`
          )
          setTimeout(() => {
            setMessage(null)
          }, 5000)
        }).catch((error) => {
          setMessage(
            error.response.data.error
          )
          setTimeout(() => {
            setMessage("")
          }, 5000)
        });
      setNewName('')
      setNewNumber('')
    }
  }

  const deletePerson = (id, name) => {

    const confirmed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (!confirmed) {
      return;
    }

    personService
      .erase(id)
      .then(() => {
        setPersons(persons.filter(person => person.id !== id));
        setFilteredPersons(filteredPersons.filter(person => person.id !== id));
      });
    console.log('Deleted person with ID:', id);

  }

  return (
    <div>
      <Notification message={Message} />
      <Filter searchPerson={searchPerson} handleSearchChange={handleSearchChange} />
      <h2>Phonebook</h2>
      <PersonForm addPerson={addPerson} newName={newName} handleNameChange={handleNameChange} newNumber={newNumber} handleNumberChange={handleNumberChange} />

      <h2>Numbers</h2>
      <ul>
        {Array.isArray(filteredPersons) && filteredPersons.map((person) => (
          <Person key={person.id} person={person} action={() => deletePerson(person.id, person.name)} />
        ))}
      </ul>
    </div>
  )
}

export default App