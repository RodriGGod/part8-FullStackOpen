import { useState } from "react";
import { useQuery } from "@apollo/client";
import { ALL_BOOKS } from "../queries";

const Books = ({ show }) => {
  const [genre, setGenre] = useState(null);

  // A) Todos los libros (solo para construir la lista de géneros)
  const all = useQuery(ALL_BOOKS, { skip: !show });

  // B) Libros filtrados por género (server-side)
  const filtered = useQuery(ALL_BOOKS, {
    variables: { genre },   // null -> sin filtro en el server
    skip: !show,
  });

  if (!show) return null;

  // Estados de carga/errores compactos
  if (all.loading || filtered.loading) return <div>loading...</div>;
  if (all.error || filtered.error) return <div style={{ color: 'red' }}>error loading books</div>;

  // Géneros únicos a partir del "all"
  const allBooks = all.data?.allBooks ?? [];
  const genres = [...new Set(allBooks.flatMap(b => b.genres))].sort();

  // Si hay género → usa la lista filtrada; si no → la completa
  const books = genre ? (filtered.data?.allBooks ?? []) : allBooks;

  const handleGenreClick = async (g) => {
    setGenre(g);
    // fuerza una query fresca al servidor con el género actual
    await filtered.refetch({ genre: g });
  };

  const handleAllClick = async () => {
    setGenre(null);
    // refresca el catálogo completo (opcional, útil tras añadir libros)
    await all.refetch();
  };

  return (
    <div>
      <h2>books</h2>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handleAllClick}
          style={{ fontWeight: genre ? 400 : 700, marginRight: 8 }}
        >
          all genres
        </button>
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => handleGenreClick(g)}
            style={{ fontWeight: genre === g ? 700 : 400, marginRight: 8 }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        {genre ? <em>filter: {genre}</em> : <em>showing all genres</em>}
      </div>

      <table>
        <tbody>
          <tr>
            <th>title</th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map(b =>
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Books;
