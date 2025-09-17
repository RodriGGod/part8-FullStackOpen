import { useQuery } from "@apollo/client";
import { ALL_BOOKS, ME } from "../queries";

const Recommendations = ({ show }) => {
  // 1) pedir el usuario logueado
  const me = useQuery(ME, { skip: !show });
  const favorite = me.data?.me?.favoriteGenre;

  // 2) pedir libros del género favorito (cuando lo sepamos)
  const books = useQuery(ALL_BOOKS, {
    variables: { genre: favorite },
    skip: !show || !favorite,
  });

  if (!show) return null;

  if (me.loading) return <div>loading your profile…</div>;
  if (me.error)   return <div style={{color:"red"}}>failed to load profile</div>;

  if (!favorite) return <div><h2>recommendations</h2><em>No favorite genre set.</em></div>;

  if (books.loading) return <div>loading books…</div>;
  if (books.error)   return <div style={{color:"red"}}>failed to load books</div>;

  const list = books.data?.allBooks ?? [];

  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favorite genre <strong>{favorite}</strong></p>
      <table>
        <tbody>
          <tr>
            <th>title</th>
            <th>author</th>
            <th>published</th>
          </tr>
          {list.map(b => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author?.name}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommendations;
