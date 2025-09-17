import { useEffect, useState } from "react";
import { useApolloClient, useSubscription } from "@apollo/client";
import { ALL_BOOKS, BOOK_ADDED } from "./queries";

import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import Recommendations from "./components/Recommendations";

const App = () => {
  const client = useApolloClient();
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("authors");

  useEffect(() => {
    const saved = localStorage.getItem("library-user-token");
    if (saved) setToken(saved);
  }, []);

  // evita duplicados
  const appendIfMissing = (list, book) =>
    list.some((b) => b.id === book.id) ? list : list.concat(book);

  // Actualiza la caché en todas las variantes de ALL_BOOKS
  const updateCacheWith = (added) => {
    // sin filtro (genre: null)
    try {
      client.cache.updateQuery(
        { query: ALL_BOOKS, variables: { genre: null } },
        (data) => {
          if (!data?.allBooks) return { allBooks: [added] };
          return { allBooks: appendIfMissing(data.allBooks, added) };
        }
      );
    } catch {
      // si esa variante no está en caché aún, ignorar
    }

    // listas por género
    for (const g of added.genres ?? []) {
      try {
        client.cache.updateQuery(
          { query: ALL_BOOKS, variables: { genre: g } },
          (data) => {
            if (!data?.allBooks) return { allBooks: [added] };
            return { allBooks: appendIfMissing(data.allBooks, added) };
          }
        );
      } catch {
        // idem
      }
    }
  };

  // Suscripción a nuevos libros
  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const added = data.data?.bookAdded;
      if (!added) return;
      // notificación
      window.alert(`New book added: "${added.title}" by ${added.author?.name}`);
      // actualización de caché
      updateCacheWith(added);
    },
  });

  const handleLogin = (jwt) => {
    setToken(jwt);
    setPage("authors");
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("library-user-token");
    client.resetStore();
    setPage("authors");
  };

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>

        {!token ? (
          <button onClick={() => setPage("login")}>login</button>
        ) : (
          <>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={() => setPage("recommendations")}>
              recommendations
            </button>
            <button onClick={logout}>logout</button>
          </>
        )}
      </div>

      <Authors show={page === "authors"} />
      <Books show={page === "books"} />
      {token && <NewBook show={page === "add"} />}
      {token && <Recommendations show={page === "recommendations"} />}
      {!token && page === "login" && <LoginForm onLogin={handleLogin} />}
    </div>
  );
};

export default App;
