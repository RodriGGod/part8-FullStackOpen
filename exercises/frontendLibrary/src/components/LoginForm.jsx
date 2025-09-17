import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN } from '../queries';

const LoginForm = ({ onLogin, onError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [login, result] = useMutation(LOGIN, {
    onError: (error) => {
      // Puedes mostrar un notify sencillo con onError(error.message)
      onError?.(error?.graphQLErrors?.[0]?.message || 'Login failed');
    },
  });

  useEffect(() => {
    if (result.data?.login?.value) {
      const token = result.data.login.value;
      localStorage.setItem('library-user-token', token);
      onLogin?.(token);
    }
  }, [result.data, onLogin]);

  const submit = async (e) => {
    e.preventDefault();
    login({ variables: { username, password } });
  };

  return (
    <div>
      <h2>login</h2>
      <form onSubmit={submit}>
        <div>
          username{' '}
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          password{' '}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">login</button>
      </form>
    </div>
  );
};

export default LoginForm;
